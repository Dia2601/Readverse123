import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

// Global unhandled error protection to prevent Node process termination
process.on("uncaughtException", (err) => {
  console.error("⚠️ [Process] Uncaught Exception trapped:", err?.message || err);
});
process.on("unhandledRejection", (reason) => {
  console.error("⚠️ [Process] Unhandled Rejection trapped:", reason);
});

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Body limit protection (prevents oversized payload DoS)
app.use(express.json({ limit: "1mb" }));

// Lightweight in-memory sliding window rate limiter
interface RateLimitBucket {
  count: number;
  resetAt: number;
}
const ipRateLimits = new Map<string, RateLimitBucket>();
const ipAiRateLimits = new Map<string, RateLimitBucket>();

// Clean up expired buckets every 60s
setInterval(() => {
  const now = Date.now();
  for (const [ip, bucket] of ipRateLimits.entries()) {
    if (bucket.resetAt <= now) ipRateLimits.delete(ip);
  }
  for (const [ip, bucket] of ipAiRateLimits.entries()) {
    if (bucket.resetAt <= now) ipAiRateLimits.delete(ip);
  }
}, 60000).unref();

function apiRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || "global";
  const now = Date.now();
  const bucket = ipRateLimits.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    ipRateLimits.set(ip, { count: 1, resetAt: now + 60000 });
    return next();
  }
  bucket.count++;
  if (bucket.count > 240) {
    res.setHeader("Retry-After", "5");
    return res.status(429).json({ error: "Hệ thống đang phục vụ nhiều người dùng. Vui lòng thử lại sau 5 giây." });
  }
  next();
}

function aiRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || "global";
  const now = Date.now();
  const bucket = ipAiRateLimits.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    ipAiRateLimits.set(ip, { count: 1, resetAt: now + 60000 });
    return next();
  }
  bucket.count++;
  if (bucket.count > 36) {
    // Flag request to immediately serve high quality cached/canonical response without overloading Gemini
    (req as any)._forceFallback = true;
  }
  next();
}

app.use("/api", apiRateLimiter);

// Server-side AI response caching (TTL + LRU)
interface ServerCacheEntry {
  data: any;
  expiresAt: number;
}
const serverCache = new Map<string, ServerCacheEntry>();

function getCachedResult<T>(key: string): T | null {
  const entry = serverCache.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.data as T;
  }
  return null;
}

function setCachedResult(key: string, data: any, ttlSeconds = 1800): void {
  if (serverCache.size > 300) {
    const now = Date.now();
    for (const [k, v] of serverCache.entries()) {
      if (v.expiresAt <= now) serverCache.delete(k);
    }
    if (serverCache.size > 300) {
      const keys = Array.from(serverCache.keys()).slice(0, 50);
      keys.forEach((k) => serverCache.delete(k));
    }
  }
  serverCache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

// Gemini Concurrency Controller (Semaphore + Queue)
let activeGeminiCalls = 0;
const MAX_CONCURRENT_GEMINI_CALLS = 4;
const MAX_GEMINI_QUEUE = 16;
type QueueItem = {
  resolve: (value: boolean) => void;
  queuedAt: number;
};
const geminiQueue: QueueItem[] = [];

async function acquireGeminiSlot(): Promise<boolean> {
  if (activeGeminiCalls < MAX_CONCURRENT_GEMINI_CALLS) {
    activeGeminiCalls++;
    return true;
  }
  if (geminiQueue.length >= MAX_GEMINI_QUEUE) {
    return false;
  }
  return new Promise<boolean>((resolve) => {
    const item: QueueItem = {
      resolve,
      queuedAt: Date.now(),
    };
    geminiQueue.push(item);

    setTimeout(() => {
      const idx = geminiQueue.indexOf(item);
      if (idx !== -1) {
        geminiQueue.splice(idx, 1);
        resolve(false);
      }
    }, 3500);
  });
}

function releaseGeminiSlot(): void {
  activeGeminiCalls = Math.max(0, activeGeminiCalls - 1);
  while (geminiQueue.length > 0) {
    const next = geminiQueue.shift();
    if (next) {
      if (Date.now() - next.queuedAt <= 4000) {
        activeGeminiCalls++;
        next.resolve(true);
        return;
      }
    }
  }
}

// Initialize Gemini SDK lazily with telemetry
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Resilient Gemini caller with automatic retry, queue limiter, and model fallback
interface GeminiCallParams {
  contents: any;
  config?: any;
}

const PRIMARY_MODEL = "gemini-3.8-flash";
const FALLBACK_MODELS = ["gemini-flash-latest", "gemini-3.1-flash-lite"];

async function callGemini(params: GeminiCallParams) {
  const hasSlot = await acquireGeminiSlot();
  if (!hasSlot) {
    return null;
  }

  try {
    const ai = getGeminiClient();
    if (!ai) return null;

    const modelsToTry = [PRIMARY_MODEL, ...FALLBACK_MODELS];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const callPromise = ai.models.generateContent({
            model: modelName,
            contents: params.contents,
            config: params.config,
          });

          // Timeout protection (8.5 seconds max)
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Gemini request timeout 8500ms")), 8500)
          );

          const response = await Promise.race([callPromise, timeoutPromise]);
          if (response && response.text) {
            return response;
          }
        } catch (err: any) {
          lastError = err;
          const errMsg = err?.message || String(err);
          const isTransient =
            errMsg.includes("503") ||
            errMsg.includes("429") ||
            errMsg.includes("UNAVAILABLE") ||
            errMsg.includes("high demand") ||
            errMsg.includes("RESOURCE_EXHAUSTED") ||
            errMsg.includes("timeout");

          if (isTransient && attempt === 0) {
            await new Promise((resolve) => setTimeout(resolve, 400));
            continue;
          }
          break;
        }
      }
    }

    console.warn("Gemini unavailable across models, using intelligent fallback response:", lastError?.message || lastError);
    return null;
  } finally {
    releaseGeminiSlot();
  }
}

function parseJsonSafely<T>(text: string | undefined | null, fallback: T): T {
  if (!text) return fallback;
  try {
    let cleaned = text.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }
    return JSON.parse(cleaned);
  } catch {
    return fallback;
  }
}

// Health check endpoint with system metrics
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    universe: "READVERSE",
    activeGeminiCalls,
    queueLength: geminiQueue.length,
    cacheEntries: serverCache.size,
    memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    uptimeSeconds: Math.round(process.uptime()),
  });
});

// 1. AI Cosmic Companion ("Komi" / "Sao Nhỏ") Chat
app.post("/api/companion/chat", aiRateLimiter, async (req: Request, res: Response) => {
  try {
    const {
      message,
      context,
      astronautName,
      currentPlanet,
      readWorks = [],
      interests = [],
      experienceLevel,
      completedCount = 0,
    } = req.body;

    const fallbackReply = `Chào phi hành gia ${astronautName || "bạn nhỏ"}! Sao Nhỏ Komi luôn đồng hành cùng bạn trên ${currentPlanet || "chuyến hành trình này"}. Bạn nghĩ điều gì làm nên sức sống lâu bền của tác phẩm này? 🌟`;

    if ((req as any)._forceFallback) {
      return res.json({ reply: fallbackReply });
    }

    const systemInstruction = `Bạn là Komi - người bạn đồng hành vũ trụ thông minh, ấm áp và hóm hỉnh của READVERSE (vũ trụ đọc sách và tư duy phản biện dành cho học sinh THPT).
Tông giọng: Thân thiện, tò mò, khuyến khích suy nghĩ sâu, tuyệt đối không nói giọng trẻ con mẫu giáo, không đưa ra câu trả lời sẵn ngay lập tức mà gợi mở bằng câu hỏi kích thích tư duy (Socratic questioning).
Ngữ cảnh người học hiện tại:
- Tên học sinh: ${astronautName || "Phi hành gia"}
- Tác phẩm đã đọc trong hồ sơ: ${JSON.stringify(readWorks)}
- Sở thích: ${JSON.stringify(interests)}
- Cấp độ đọc: ${experienceLevel || "Đang khám phá"}
- Số hoạt động đã hoàn thành: ${completedCount}
- Hành tinh đang khám phá: ${currentPlanet || "Trạm Vũ Trụ"}
- Chi tiết ngữ cảnh: ${context || "Khám phá tác phẩm"}

Nhiệm vụ: Trả lời ngắn gọn (dưới 120 từ), ấm áp, đưa ra 1 lời khen nếu lập luận tốt, và đặt 1 câu hỏi sâu sắc để học sinh suy ngẫm thêm. Luôn căn cứ vào những tác phẩm học sinh ĐÃ ĐỌC (${JSON.stringify(readWorks)}), không bịa ra tác phẩm lạ.`;

    const response = await callGemini({
      contents: message || "Xin chào Komi, hãy gợi ý cho mình cách tiếp cận tác phẩm này.",
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    if (response?.text) {
      return res.json({
        reply: response.text.trim(),
      });
    }

    return res.json({
      reply: fallbackReply,
      guidanceTip: "Hãy thử đặt câu hỏi: Nếu nhân vật có lựa chọn khác, kết cục sẽ ra sao?",
    });
  } catch (error) {
    console.error("Companion chat error:", error);
    res.json({
      reply: "Tín hiệu sóng từ vũ trụ hơi chập chờn một chút, nhưng Komi vẫn ở đây! Bạn nghĩ chi tiết vừa rồi phản ánh điều gì về tâm lý nhân vật?",
    });
  }
});

// Endpoint: Generate dynamic Detective Case based on student's declared read work
app.post("/api/investigate/generate-case", aiRateLimiter, async (req: Request, res: Response) => {
  try {
    const { workTitle, author } = req.body;
    if (!workTitle) {
      return res.status(400).json({ error: "Tên tác phẩm là bắt buộc" });
    }

    const cacheKey = `case:${(workTitle || "").toLowerCase().trim()}`;
    const cached = getCachedResult<any>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const fallbackCase = {
      id: "gen-case-" + Date.now(),
      workTitle: workTitle,
      author: author || "Khuyết danh",
      claim: `Hành động và lựa chọn then chốt của nhân vật trong "${workTitle}" phản ánh sự giằng xé giữa khát vọng tự do và định kiến của hoàn cảnh.`,
      context: `Nhân vật đối mặt với bước ngoặt quyết định số phận trong bối cảnh xã hội phức tạp của "${workTitle}".`,
      guidingClues: [
        `Nhân vật đã bộc lộ suy nghĩ hay cảm xúc gì trước khi đưa ra quyết định then chốt?`,
        `Chi tiết hành động nào cho thấy sự đấu tranh nội tâm của nhân vật?`,
        `Hoàn cảnh bên ngoài đã tác động như thế nào đến sự lựa chọn đó?`,
      ],
      suggestedEvidences: [
        `Chi tiết diễn biến nội tâm của nhân vật trong đoạn cao trào.`,
        `Lời thoại hoặc phản ứng của các nhân vật xung quanh trước lựa chọn ấy.`,
        `Hình ảnh biểu tượng hoặc không gian nghệ thuật gắn liền với bước ngoặt.`,
      ],
    };

    if ((req as any)._forceFallback) {
      return res.json(fallbackCase);
    }

    const prompt = `Bạn là Trưởng ban Thám Tử Văn Học tại READVERSE.
Học sinh đã khai báo ĐÃ ĐỌC tác phẩm: "${workTitle}" (Tác giả: "${author || "chưa rõ"}").
Nhiệm vụ: Hãy tạo một vụ án/luận điểm thẩm tra văn học sâu sắc dựa trên tác phẩm này.
Yêu cầu nghiêm ngặt:
- Luận điểm (claim) phải gây tranh cãi, kích thích tư duy thẩm tra chứng cứ (ví dụ: hành động X không chỉ vì lý do Y mà là một sự giằng xé Z).
- Bối cảnh (context): ngắn gọn, khơi gợi khoảnh khắc đắt giá.
- Manh mối gợi mở (guidingClues): 3 câu hỏi gợi mở, TUYỆT ĐỐI KHÔNG ĐƯA ĐÁP ÁN TRỰC TIẾP NGAY TỪ ĐẦU, mà gợi ý học sinh tìm manh mối ở đâu.
- Dẫn chứng gợi ý (suggestedEvidences): 3 chi tiết/câu văn có thực hoặc gần gũi trong tác phẩm để học sinh tham khảo đối chiếu.

Trả về JSON thuần túy:
{
  "claim": "Chuỗi luận điểm thẩm tra",
  "context": "Chuỗi tóm tắt bối cảnh",
  "guidingClues": ["Manh mối 1", "Manh mối 2", "Manh mối 3"],
  "suggestedEvidences": ["Dẫn chứng 1", "Dẫn chứng 2", "Dẫn chứng 3"]
}`;

    const response = await callGemini({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    if (response?.text) {
      const parsed = parseJsonSafely(response.text, fallbackCase);
      const generated = {
        id: "gen-case-" + Date.now(),
        workTitle,
        author: author || "Khuyết danh",
        claim: parsed.claim || fallbackCase.claim,
        context: parsed.context || fallbackCase.context,
        guidingClues: Array.isArray(parsed.guidingClues) ? parsed.guidingClues : fallbackCase.guidingClues,
        suggestedEvidences: Array.isArray(parsed.suggestedEvidences) ? parsed.suggestedEvidences : fallbackCase.suggestedEvidences,
      };
      setCachedResult(cacheKey, generated, 3600);
      return res.json(generated);
    }

    return res.json(fallbackCase);
  } catch (error) {
    console.error("Generate case error:", error);
    res.json({
      id: "gen-case-" + Date.now(),
      workTitle: req.body.workTitle || "Tác phẩm",
      author: req.body.author || "Khuyết danh",
      claim: "Lựa chọn của nhân vật chính là minh chứng cho nhân phẩm kiên cường giữa hoàn cảnh nghiệt ngã.",
      context: "Một khoảnh khắc nội tâm then chốt trong tác phẩm.",
      guidingClues: [
        "Quan sát phản ứng đầu tiên của nhân vật trước biến cố.",
        "Tìm kiếm sự thay đổi trong ánh mắt, cử chỉ hoặc lời độc thoại nội tâm.",
      ],
      suggestedEvidences: [
        "Chi tiết miêu tả cảm xúc lúc giằng xé.",
        "Lời nói trực tiếp bộc lộ lòng tự trọng hoặc tình yêu thương.",
      ],
    });
  }
});

// 2. Planet 02 — Detective / Thám Tử: Evaluate Evidence & Reasoning
app.post("/api/investigate/evaluate", aiRateLimiter, async (req: Request, res: Response) => {
  try {
    const { claim, evidence, reasoning, workTitle } = req.body;

    const fallback = {
      relevanceScore: 88,
      strengthScore: 85,
      feedback: `Dẫn chứng từ "${workTitle || "tác phẩm"}" rất trúng đích! Lập luận của bạn đã làm sáng tỏ luận điểm "${claim || ""}". Để sắc bén hơn, bạn có thể phân tích thêm bối cảnh tâm lý lúc đó.`,
      missingPerspectives: "Bạn có thể cân nhắc xem liệu hoàn cảnh xã hội có ép buộc nhân vật hay không?",
      badgeEarned: "Kính Lúp Tinh Tường",
    };

    if ((req as any)._forceFallback) {
      return res.json(fallback);
    }

    const prompt = `Bạn là Giám Khảo Thám Tử Văn Học của Hành Tinh Thám Tử trong READVERSE.
Đề bài luận điểm cần thẩm tra: "${claim}"
Tác phẩm: "${workTitle}"
Dẫn chứng học sinh đưa ra: "${evidence}"
Lời giải thích/suy luận của học sinh: "${reasoning}"

Hãy đánh giá và phản hồi bằng định dạng JSON thuần túy gồm các trường:
{
  "relevanceScore": number từ 50-100,
  "strengthScore": number từ 50-100,
  "feedback": "Nhận xét sâu sắc, mang tính hướng dẫn, chỉ ra điểm sáng và chỗ cần đào sâu (tối đa 100 từ)",
  "missingPerspectives": "Gợi ý 1 góc nhìn mới hoặc khía cạnh tiềm ẩn mà học sinh chưa nhắc tới (tối đa 60 từ)",
  "badgeEarned": "Tên huy hiệu thám tử vũ trụ ngắn gọn"
}`;

    const response = await callGemini({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.6,
      },
    });

    if (response?.text) {
      const data = parseJsonSafely(response.text, fallback);
      return res.json(data);
    }

    return res.json(fallback);
  } catch (error) {
    console.error("Investigate evaluation error:", error);
    res.json({
      relevanceScore: 85,
      strengthScore: 80,
      feedback: "Dẫn chứng của bạn liên kết chặt chẽ với luận điểm! Komi ghi nhận khả năng quan sát nhạy bén của bạn.",
      missingPerspectives: "Cân nhắc thêm phản ứng của các nhân vật xung quanh.",
      badgeEarned: "Kính Lúp Vũ Trụ",
    });
  }
});

// Dynamic endpoint: Generate Debate Topic based on student's declared read work
app.post("/api/debate/generate-topic", aiRateLimiter, async (req: Request, res: Response) => {
  try {
    const { workTitle, author } = req.body;
    if (!workTitle) {
      return res.status(400).json({ error: "Tên tác phẩm là bắt buộc" });
    }

    const cacheKey = `debate:${(workTitle || "").toLowerCase().trim()}`;
    const cached = getCachedResult<any>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const fallbackTopic = {
      id: "gen-deb-" + Date.now(),
      title: `Thách thức đạo đức và lựa chọn trong "${workTitle}"`,
      dilemma: `Trong nghịch cảnh của "${workTitle}", hành động của nhân vật chính là minh chứng cho sự bất lực trước số phận hay là đỉnh cao của lòng trắc ẩn và sự hy sinh?`,
      stanceA: "Hành động là sự hy sinh cao thượng vì tình thương và nhân phẩm",
      stanceB: "Hành động thể hiện sự bế tắc và thiếu đi tầm nhìn giải phóng thực sự",
      workRef: workTitle,
      contextPrompt: `Cuộc tranh luận xoay quanh giá trị nhân văn và tính tất yếu của số phận trong "${workTitle}".`,
    };

    if ((req as any)._forceFallback) {
      return res.json(fallbackTopic);
    }

    const prompt = `Bạn là Trọng Tài Trí Tuệ tại Đấu Trường Tranh Biện của READVERSE.
Học sinh ĐÃ ĐỌC tác phẩm: "${workTitle}" (Tác giả: "${author || "Khuyết danh"}").
Nhiệm vụ: Hãy tạo ra 1 chủ đề tranh biện văn học kịch tính, đa chiều, có thế giằng co giữa 2 quan điểm (stanceA vs stanceB) về một nhân vật hoặc tình huống then chốt trong tác phẩm này.
Yêu cầu:
- dilemma: Tình huống nan giải / câu hỏi lớn mở đầu.
- stanceA: Luận điểm phía A (đầy sức nặng).
- stanceB: Luận điểm phía B (đối lập nhưng cũng có cơ sở vững chắc).
- contextPrompt: Gợi mở bối cảnh văn học.

Trả về JSON thuần túy:
{
  "title": "Tên chủ đề tranh biện",
  "dilemma": "Câu hỏi thế lưỡng nan",
  "stanceA": "Quan điểm A",
  "stanceB": "Quan điểm B",
  "contextPrompt": "Gợi ý bối cảnh"
}`;

    const response = await callGemini({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    if (response?.text) {
      const parsed = parseJsonSafely(response.text, fallbackTopic);
      const generated = {
        id: "gen-deb-" + Date.now(),
        title: parsed.title || fallbackTopic.title,
        dilemma: parsed.dilemma || fallbackTopic.dilemma,
        stanceA: parsed.stanceA || fallbackTopic.stanceA,
        stanceB: parsed.stanceB || fallbackTopic.stanceB,
        workRef: workTitle,
        contextPrompt: parsed.contextPrompt || fallbackTopic.contextPrompt,
      };
      setCachedResult(cacheKey, generated, 3600);
      return res.json(generated);
    }

    return res.json(fallbackTopic);
  } catch (error) {
    console.error("Generate debate topic error:", error);
    res.json({
      id: "gen-deb-" + Date.now(),
      title: `Tranh biện về "${req.body.workTitle || "Tác phẩm"}"`,
      dilemma: "Liệu nhân vật có thể tìm ra con đường khác để cứu rỗi chính mình hay không?",
      stanceA: "Hoàn cảnh xã hội nghiệt ngã đã dập tắt mọi khả năng phản kháng.",
      stanceB: "Lương tri và ý chí cá nhân vẫn luôn có quyền tự quyết định.",
      workRef: req.body.workTitle || "Tác phẩm",
      contextPrompt: "Đào sâu vào động cơ và tâm lý nhân vật.",
    });
  }
});

// 3. Planet 03 — Debate / Đấu Trí: Opposing Argument & Round Evaluation
app.post("/api/debate/turn", aiRateLimiter, async (req: Request, res: Response) => {
  try {
    const { topic, round, playerPosition, playerInput, history } = req.body;

    const fallback = {
      counterArgument: `Ở vòng này, một góc nhìn phản biện đáng chú ý: Dù hoàn cảnh khắc nghiệt, con người vẫn có những khoảng lặng tự do trong tâm hồn. Nếu đổ lỗi hoàn toàn cho ngoại cảnh, ta có vô tình xem nhẹ ý chí tự thân của nhân vật không? Bạn phản hồi luận điểm này thế nào?`,
      coachingTip: "Dùng chi tiết hành động nhỏ hoặc diễn biến nội tâm để củng cố luận điểm.",
      scores: { logic: 88, evidence: 84, empathy: 90 },
    };

    if ((req as any)._forceFallback) {
      return res.json(fallback);
    }

    const prompt = `Bạn là Trọng Tài Trí Tuệ tại Hành Tinh Đấu Trí của READVERSE.
Chủ đề tranh biện văn học: "${topic}"
Vị trí của học sinh: "${playerPosition}"
Vòng đấu hiện tại: Vòng ${round}
Ý kiến/Lập luận của học sinh: "${playerInput}"
Lịch sử trao đổi trước đó: ${JSON.stringify(history || [])}

Hãy đưa ra phản biện hoặc đánh giá vòng đấu dưới định dạng JSON thuần túy:
{
  "counterArgument": "Luận điểm phản biện sắc sảo, lịch thiệp, gợi mở từ phía đối lập để thách thức học sinh tư duy đa chiều (dưới 120 từ)",
  "coachingTip": "Lời khuyên chiến thuật tranh biện ngắn gọn của Komi (dưới 40 từ)",
  "scores": {
    "logic": number từ 70-98,
    "evidence": number từ 70-98,
    "empathy": number từ 70-98
  }
}`;

    const response = await callGemini({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    if (response?.text) {
      const data = parseJsonSafely(response.text, fallback);
      return res.json(data);
    }

    return res.json(fallback);
  } catch (error) {
    console.error("Debate turn error:", error);
    res.json({
      counterArgument: "Một góc nhìn đối lập rất đáng để tâm: Liệu định kiến xã hội có phải là nguyên nhân duy nhất dẫn đến bước ngoặt này? Bạn có bằng chứng nào chứng minh nhân vật đã từng đấu tranh?",
      coachingTip: "Dùng chi tiết hành động nhỏ để bảo vệ luận điểm lớn.",
      scores: { logic: 86, evidence: 82, empathy: 89 },
    });
  }
});

// Debate synthesis/conclusion endpoint (no simple win/lose, evaluates multi-perspective thinking)
app.post("/api/debate/conclude", aiRateLimiter, async (req: Request, res: Response) => {
  try {
    const { topic, playerPosition, history, roundsCount } = req.body;

    const fallback = {
      logicScore: 88,
      perspectiveScore: 92,
      empathyScore: 90,
      badge: "Hiệp Sĩ Đa Chiều",
      synthesis: `Tranh biện xuất sắc qua ${roundsCount || 3} vòng! Bạn đã bảo vệ quan điểm một cách kiên định nhưng vẫn thể hiện sự cởi mở, thấu cảm và lắng nghe đối lập. Đây chính là phẩm chất của một tư duy phản biện trưởng thành.`,
      strengths: "Lập luận mạch lạc, biết cách dẫn chứng và tôn trọng tính phức tạp của nhân vật văn học.",
      growthAreas: "Có thể tiếp tục đào sâu bối cảnh lịch sử để củng cố tính thời đại của quan điểm.",
    };

    if ((req as any)._forceFallback) {
      return res.json(fallback);
    }

    const prompt = `Bạn là Trọng Tài Trí Tuệ tại Hành Tinh Đấu Trí của READVERSE.
Chủ đề tranh biện: "${topic}"
Lập trường học sinh: "${playerPosition}"
Lịch sử cuộc tranh biện qua các vòng: ${JSON.stringify(history || [])}

Nhiệm vụ: Hãy đưa ra bản TỔNG KẾT TRANH BIỆN mang tính giáo dục, đánh giá khả năng tư duy đa chiều, khả năng bảo vệ quan điểm, mức độ thấu cảm với góc nhìn đối lập.
TUYỆT ĐỐI KHÔNG phân định thắng/thua đơn giản, mà xem đây là quá trình rèn luyện tư duy phản biện.

Trả về JSON thuần túy:
{
  "logicScore": number từ 75-100 (tính chặt chẽ),
  "perspectiveScore": number từ 75-100 (tư duy đa chiều),
  "empathyScore": number từ 75-100 (thấu cảm với quan điểm đối lập),
  "badge": "Tên danh hiệu (ví dụ: Hiệp Sĩ Đa Chiều, Trí Tuệ Bao Dung)",
  "synthesis": "Bản nhận xét tổng kết sâu sắc (khoảng 80-120 từ)",
  "strengths": "Điểm sáng nổi bật trong lập luận của học sinh",
  "growthAreas": "Gợi ý để phát triển tư duy sắc bén hơn nữa"
}`;

    const response = await callGemini({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    if (response?.text) {
      const data = parseJsonSafely(response.text, fallback);
      return res.json(data);
    }

    return res.json(fallback);
  } catch (error) {
    console.error("Debate conclude error:", error);
    res.json({
      logicScore: 86,
      perspectiveScore: 90,
      empathyScore: 88,
      badge: "Hiệp Sĩ Đa Chiều",
      synthesis: "Tranh biện rất đáng khen! Bạn cho thấy sự thấu hiểu sâu sắc với nghịch cảnh của nhân vật và lắng nghe góc nhìn đối lập một cách văn minh.",
      strengths: "Biết bảo vệ quan điểm cốt lõi.",
      growthAreas: "Liên hệ thêm với thực tiễn xã hội.",
    });
  }
});

// 4. Planet 04 — Connect / Liên Kết: Evaluate Constellation Pathways
app.post("/api/connect/evaluate", aiRateLimiter, async (req: Request, res: Response) => {
  try {
    const { nodes, connectionReason, insight } = req.body;
    const reason = connectionReason || insight || "Sự đồng điệu giữa số phận cá nhân và bức tranh thời đại";

    const fallback = {
      constellationTitle: "Chòm Sao Thấu Cảm",
      constellationName: "Chòm Sao Thấu Cảm",
      depthScore: 92,
      sparkleStrength: 92,
      feedback: "Liên kết tuyệt vời! Bạn đã nối liền số phận cá nhân trong văn học với những trăn trở muôn thuở của kiếp nhân sinh.",
      unlockedStar: "Sao Thiên Cơ",
    };

    if ((req as any)._forceFallback) {
      return res.json(fallback);
    }

    const prompt = `Bạn là Thợ Kiến Tạo Chòm Sao Tri Thức tại Hành Tinh Liên Kết của READVERSE.
Học sinh vừa tạo đường nối giữa các nút: ${JSON.stringify(nodes)}
Lý do liên kết của học sinh: "${reason}"

Hãy đánh giá sợi dây liên tưởng này và trả lời dạng JSON thuần túy:
{
  "constellationTitle": "Tên chòm sao thơ mộng do liên kết này tạo nên (ví dụ: Chòm Sao Ánh Lửa, Chòm Sao Thấu Cảm)",
  "constellationName": "Tên chòm sao (giống constellationTitle)",
  "depthScore": number từ 75-100,
  "sparkleStrength": number từ 75-100,
  "feedback": "Lời nhận xét đầy chất thơ và trí tuệ về sự gặp gỡ của các ý niệm (dưới 80 từ)",
  "unlockedStar": "Tên ngôi sao mới được thắp sáng trên bản đồ"
}`;

    const response = await callGemini({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    if (response?.text) {
      const data = parseJsonSafely(response.text, fallback);
      // Ensure both field naming conventions are present
      return res.json({
        constellationTitle: data.constellationTitle || data.constellationName || fallback.constellationTitle,
        constellationName: data.constellationName || data.constellationTitle || fallback.constellationName,
        depthScore: data.depthScore || data.sparkleStrength || fallback.depthScore,
        sparkleStrength: data.sparkleStrength || data.depthScore || fallback.sparkleStrength,
        feedback: data.feedback || fallback.feedback,
        unlockedStar: data.unlockedStar || fallback.unlockedStar,
      });
    }

    return res.json(fallback);
  } catch (error) {
    console.error("Connect error:", error);
    res.json({
      constellationTitle: "Chòm Sao Đồng Điệu",
      constellationName: "Chòm Sao Đồng Điệu",
      depthScore: 88,
      sparkleStrength: 88,
      feedback: "Sự kết nối giữa văn chương và cuộc sống thực tế làm bừng sáng vũ trụ tư duy của bạn!",
      unlockedStar: "Sao Linh Hồn",
    });
  }
});

// Dynamic endpoint: Generate Creative Prompt based on student's declared read work
app.post("/api/create/generate-prompt", aiRateLimiter, async (req: Request, res: Response) => {
  try {
    const { workTitle, author } = req.body;
    if (!workTitle) {
      return res.status(400).json({ error: "Tên tác phẩm là bắt buộc" });
    }

    const cacheKey = `prompt:${(workTitle || "").toLowerCase().trim()}`;
    const cached = getCachedResult<any>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const fallbackPrompt = {
      id: "gen-crt-" + Date.now(),
      title: `Một kết cục khác cho "${workTitle}"`,
      originalWork: workTitle,
      type: "alternative_ending",
      scenario: `Nếu tại bước ngoặt quyết định, nhân vật chính trong "${workTitle}" đưa ra một lựa chọn khác biệt hoặc có thêm một người bạn đồng hành thấu hiểu, câu chuyện sẽ diễn tiến ra sao?`,
      characterFocus: "Tâm lý và diễn biến nội tâm của nhân vật chính",
      starterQuestion: "Chi tiết đầu tiên thay đổi sẽ kéo theo chuỗi biến chuyển nào tiếp theo?",
    };

    if ((req as any)._forceFallback) {
      return res.json(fallbackPrompt);
    }

    const prompt = `Bạn là Giám Tuyển Sáng Tạo tại Xưởng Kiến Tạo Văn Học của READVERSE.
Học sinh ĐÃ ĐỌC tác phẩm: "${workTitle}" (Tác giả: "${author || "Khuyết danh"}").
Nhiệm vụ: Tạo 1 đề bài sáng tạo/viết tiếp/góc nhìn mới (What-If scenario hoặc Lá thư chưa gửi hoặc Kết thúc khác) dựa trên tác phẩm này.
Yêu cầu:
- Tựa đề gợi cảm (title).
- Tình huống gợi mở (scenario): sâu sắc, bám sát tâm lý nhân vật nhưng cho phép học sinh mở rộng trí tưởng tượng.
- Trọng tâm tâm lý (characterFocus).
- Câu hỏi khởi động (starterQuestion).

Trả về JSON thuần túy:
{
  "title": "Tựa đề tình huống",
  "scenario": "Nội dung tình huống giả định gợi mở",
  "characterFocus": "Trọng tâm tâm lý nhân vật cần giữ vững",
  "starterQuestion": "Câu hỏi gợi ý mở màn"
}`;

    const response = await callGemini({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    if (response?.text) {
      const parsed = parseJsonSafely(response.text, fallbackPrompt);
      const generated = {
        id: "gen-crt-" + Date.now(),
        title: parsed.title || fallbackPrompt.title,
        originalWork: workTitle,
        type: "alternative_ending",
        scenario: parsed.scenario || fallbackPrompt.scenario,
        characterFocus: parsed.characterFocus || fallbackPrompt.characterFocus,
        starterQuestion: parsed.starterQuestion || fallbackPrompt.starterQuestion,
      };
      setCachedResult(cacheKey, generated, 3600);
      return res.json(generated);
    }

    return res.json(fallbackPrompt);
  } catch (error) {
    console.error("Generate creative prompt error:", error);
    res.json({
      id: "gen-crt-" + Date.now(),
      title: `Bản giao hưởng mới từ "${req.body.workTitle || "Tác phẩm"}"`,
      originalWork: req.body.workTitle || "Tác phẩm",
      type: "alternative_ending",
      scenario: "Nếu nhân vật có cơ hội đối thoại với chính mình ở một ngã rẽ khác, họ sẽ nói điều gì?",
      characterFocus: "Sự thức tỉnh và thấu cảm nội tâm",
      starterQuestion: "Một giọt nước mắt hay một nụ cười bất ngờ?",
    });
  }
});

// 5. Planet 05 — Create / Kiến Tạo: Creative Alternative Scenarios
app.post("/api/create/evaluate", aiRateLimiter, async (req: Request, res: Response) => {
  try {
    const { originalWork, promptScenario, promptTitle, playerStory, studentText } = req.body;
    const scenario = promptTitle || promptScenario || "Khám phá góc nhìn ngoại truyện";
    const story = studentText || playerStory || "";

    const fallback = {
      creativityScore: 94,
      depthScore: 90,
      consistencyScore: 88,
      feedback: "Ý tưởng táo bạo và rất giàu tính nhân văn! Bạn giữ được cốt cách tính cách nhân vật nhưng đặt trong hoàn cảnh mới, mở ra suy ngẫm về sự chuộc lỗi và hy vọng.",
      evaluation: "Ý tưởng táo bạo và rất giàu tính nhân văn! Bạn giữ được cốt cách tính cách nhân vật nhưng đặt trong hoàn cảnh mới, mở ra suy ngẫm về sự chuộc lỗi và hy vọng.",
      characterPraise: "Ngôn từ thể hiện sự thấu hiểu sâu sắc với số phận và diễn biến tâm lý nhân vật.",
      komiComment: "Komi đặc biệt thích cách bạn xử lý diễn biến - vừa tự nhiên vừa mang đậm chất văn học!",
      badge: "Bản Phác Thảo Ngân Hà",
      artifactTitle: "Bản Phác Thảo Ngân Hà",
    };

    if ((req as any)._forceFallback) {
      return res.json(fallback);
    }

    const prompt = `Bạn là Giám Tuyển Sáng Tạo tại Hành Tinh Kiến Tạo của READVERSE.
Tác phẩm gốc: "${originalWork}"
Tình huống giả định / góc nhìn mới: "${scenario}"
Sản phẩm sáng tạo của học sinh: "${story}"

Hãy đánh giá tác phẩm sáng tạo dưới định dạng JSON thuần túy:
{
  "creativityScore": number 70-100,
  "depthScore": number 70-100 (chiều sâu tư tưởng),
  "consistencyScore": number 70-100 (tính nhất quán với tâm lý/bản chất tác phẩm),
  "feedback": "Nhận xét chi tiết về sức sáng tạo, logic diễn biến và thông điệp (dưới 110 từ)",
  "characterPraise": "Điểm sáng về tâm lý nhân vật và ngôn từ (dưới 50 từ)",
  "badge": "Tên huy hiệu nghệ thuật vũ trụ độc đáo"
}`;

    const response = await callGemini({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.8,
      },
    });

    if (response?.text) {
      const data = parseJsonSafely(response.text, fallback);
      return res.json({
        creativityScore: data.creativityScore || fallback.creativityScore,
        depthScore: data.depthScore || fallback.depthScore,
        consistencyScore: data.consistencyScore || fallback.consistencyScore,
        feedback: data.feedback || data.evaluation || fallback.feedback,
        evaluation: data.feedback || data.evaluation || fallback.evaluation,
        characterPraise: data.characterPraise || data.komiComment || fallback.characterPraise,
        komiComment: data.characterPraise || data.komiComment || fallback.komiComment,
        badge: data.badge || data.artifactTitle || fallback.badge,
        artifactTitle: data.badge || data.artifactTitle || fallback.artifactTitle,
      });
    }

    return res.json(fallback);
  } catch (error) {
    console.error("Create error:", error);
    res.json({
      creativityScore: 90,
      depthScore: 90,
      consistencyScore: 88,
      feedback: "Bạn đã đem lại một góc nhìn hoàn toàn mới mẻ cho tác phẩm quen thuộc! Tính cách nhân vật vẫn được tôn trọng trong khi cốt truyện có bước ngoặt bất ngờ.",
      characterPraise: "Tình cảm và ngôn từ thể hiện sự thấu hiểu sâu sắc với nỗi đau con người.",
      badge: "Cây Bút Ngân Hà",
    });
  }
});

// Co-creation AI feedback endpoint (does not write for them, gives suggestions on voice, emotion, imagery)
app.post("/api/create/co-create-feedback", aiRateLimiter, async (req: Request, res: Response) => {
  try {
    const { originalWork, promptTitle, studentDraft } = req.body;

    const fallback = {
      voiceHighlight: "Giọng văn tự nhiên, mộc mạc và có chiều sâu cảm xúc.",
      emotionalImpact: "Truyền tải được nỗi trăn trở chân thành của nhân vật trước biến cố.",
      imagerySuggestions: [
        "Thử thêm vào một chi tiết về âm thanh (ví dụ: tiếng gió rít qua khe cửa, hay tiếng bước chân ngập ngừng).",
        "Miêu tả thêm ánh mắt hoặc cử chỉ bàn tay của nhân vật khi nói câu thoại quan trọng.",
      ],
      encouragement: "Đoạn văn của bạn đã có hồn cốt rất tốt! Hãy tiếp tục mở rộng thêm.",
    };

    if ((req as any)._forceFallback) {
      return res.json(fallback);
    }

    const prompt = `Bạn là Trợ Lý Đồng Sáng Tạo Văn Học của READVERSE.
Học sinh đang viết đoạn văn sáng tạo về tác phẩm "${originalWork || "Văn học"}" (Đề bài: "${promptTitle || "Sáng tạo ngoại truyện"}").
Bản thảo hiện tại của học sinh:
"${studentDraft}"

QUY TẮC BẮT BUỘC:
- KHÔNG ĐƯỢC VIẾT HỘ hay thay thế bài của học sinh.
- Chỉ đưa ra góp ý khích lệ, tinh tế:
  1. voiceHighlight: Điểm độc đáo trong giọng văn của học sinh (ngắn gọn, dưới 30 từ).
  2. emotionalImpact: Cảm xúc truyền tải qua câu từ (dưới 35 từ).
  3. imagerySuggestions: Mảng gồm 2 gợi ý cụ thể để đoạn văn giàu hình ảnh/giác quan hơn.
  4. encouragement: Lời cổ vũ truyền cảm hứng của Komi.

Trả về JSON thuần túy:
{
  "voiceHighlight": "...",
  "emotionalImpact": "...",
  "imagerySuggestions": ["gợi ý 1", "gợi ý 2"],
  "encouragement": "..."
}`;

    const response = await callGemini({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    if (response?.text) {
      const data = parseJsonSafely(response.text, fallback);
      return res.json(data);
    }

    return res.json(fallback);
  } catch (error) {
    console.error("Co-create feedback error:", error);
    res.json({
      voiceHighlight: "Giọng văn giàu cảm xúc và nhịp điệu lắng đọng.",
      emotionalImpact: "Chạm tới sự trăn trở của nhân vật rất tự nhiên.",
      imagerySuggestions: [
        "Thử thêm một chi tiết giác quan như mùi hương hay ánh sáng chạng vạng.",
        "Mô tả nhịp thở hay một cử chỉ ngập ngừng để tăng kịch tính.",
      ],
      encouragement: "Bản thảo rất triển vọng! Hãy tiếp tục mài giũa thêm chi tiết nhé.",
    });
  }
});

// ============================================================================
// HÀNH TRÌNH SÁNG TẠO: AI STORY PARTNER (Section IV & V)
// ============================================================================
app.post("/api/create/story-partner", aiRateLimiter, async (req: Request, res: Response) => {
  try {
    const {
      originalWork,
      author,
      characters,
      context,
      turningPoint,
      originalSituationSummary,
      storyBranches,
      userDraft,
    } = req.body;

    const workName = originalWork || "Tác phẩm văn học";
    const draftText = (userDraft || "").trim();

    if (!draftText) {
      return res.status(400).json({ error: "Vui lòng nhập ý tưởng của bạn trước khi cùng AI phát triển." });
    }

    const fallbackResponse = {
      ideaOpens: `Ý tưởng của bạn đang mở ra một khả năng mới mẻ cho nhân vật trong "${workName}": phá vỡ sự bế tắc của hoàn cảnh cũ để tìm kiếm một con đường nhân văn hơn.`,
      rationalPoints: [
        `Diễn biến này tôn trọng khát vọng hướng thiện và lòng trắc ẩn vốn có trong tâm hồn nhân vật.`,
        `Quyết định bước ngoặt bắt nguồn từ một biến cố có thật trong bối cảnh của câu chuyện.`,
      ],
      considerations: [
        `Cần lưu ý áp lực từ hoàn cảnh xã hội thời đó có thể tạo ra rào cản lớn đối với lựa chọn này.`,
        `Tránh biến bước ngoặt thành sự màu nhiệm phi lý, hãy để nhân vật trả giá hoặc nỗ lực tương xứng.`,
      ],
      growthSuggestions: [
        `Tập trung vào chi tiết đối thoại đầu tiên giữa nhân vật chính và người đối diện khi ngã rẽ xảy ra.`,
        `Mô tả chuyển biến nội tâm qua một cử chỉ nhỏ: ánh mắt, sự chần chừ hay một hơi thở sâu.`,
        `Đưa ra một thử thách bất ngờ ngay sau khi đưa ra lựa chọn mới để thử thách lòng kiên định.`,
      ],
      openQuestions: [
        `Khi bước sang con đường này, nhân vật sợ mất đi điều gì quý giá nhất của họ?`,
        `Ai trong tác phẩm sẽ là người đầu tiên nhận ra sự thay đổi này và phản ứng ra sao?`,
      ],
    };

    if ((req as any)._forceFallback) {
      return res.json(fallbackResponse);
    }

    const prompt = `Bạn là "AI Story Partner" (Cộng sự sáng tạo văn học) tại READVERSE.
Bạn đang đồng hành cùng học sinh THPT phát triển một hướng đi mới cho tác phẩm văn học.

THÔNG TIN NGUYÊN TÁC (Chỉ được bám sát tác phẩm này, không trộn tác phẩm khác):
- Tác phẩm gốc: "${workName}"
- Tác giả: "${author || "Khuyết danh"}"
- Nhân vật liên quan: ${Array.isArray(characters) ? characters.join(", ") : "Các nhân vật trong tác phẩm"}
- Bối cảnh nguyên tác: "${context || "Bối cảnh văn học"}"
- Tóm tắt tình huống gốc: "${originalSituationSummary || "Tình huống cao trào"}"
- Điểm rẽ đã chọn: "${turningPoint || "Một bước ngoặt khác"}"

TIẾN TRÌNH CÁC NHÁNH ĐÃ PHÁT TRIỂN:
${Array.isArray(storyBranches) ? storyBranches.map((b: any) => `- [${b.stepTitle}]: ${b.content}`).join("\n") : "Chưa có nhánh phụ"}

Ý TƯỞNG MỚI DO NGƯỜI ĐỌC TỰ NHẬP:
"${draftText}"

NGUYÊN TẮC TỐI CAO:
1. NGƯỜI ĐỌC LÀ NGƯỜI SÁNG TẠO. AI CHỈ LÀ CỘNG SỰ GỢI MỞ.
2. TUYỆT ĐỐI KHÔNG TỰ ĐỘNG VIẾT THAY toàn bộ câu chuyện hay viết một đoạn truyện dài thay học sinh.
3. Phân biệt rõ: 📖 NGUYÊN TÁC (sự thật tác phẩm) và ✦ SÁNG TẠO CỦA NGƯỜI ĐỌC (hướng đi giả định).
4. Phản hồi ĐÚNG 5 phần theo định dạng JSON thuần túy:
{
  "ideaOpens": "1 câu phân tích sâu sắc: Ý tưởng của bạn đang mở ra điều gì cho tác phẩm?",
  "rationalPoints": [
    "Điểm hợp lý 1 bám sát tính cách/tâm lý nhân vật",
    "Điểm hợp lý 2 về mặt logic tự nhiên"
  ],
  "considerations": [
    "Điều cần cân nhắc 1 (ví dụ: áp lực định kiến, rào cản hoàn cảnh để không bị phi lý)",
    "Điều cần cân nhắc 2 (giữ vững hồn cốt nhân vật)"
  ],
  "growthSuggestions": [
    "Gợi ý hướng phát triển cụ thể 1 mà học sinh có thể tự viết tiếp",
    "Gợi ý hướng phát triển cụ thể 2",
    "Gợi ý hướng phát triển cụ thể 3"
  ],
  "openQuestions": [
    "Câu hỏi gợi mở nội tâm 1?",
    "Câu hỏi gợi mở tình huống/xung đột 2?"
  ]
}`;

    const response = await callGemini({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    if (response?.text) {
      const parsed = parseJsonSafely(response.text, fallbackResponse);
      return res.json({
        ideaOpens: parsed.ideaOpens || fallbackResponse.ideaOpens,
        rationalPoints: Array.isArray(parsed.rationalPoints) && parsed.rationalPoints.length > 0
          ? parsed.rationalPoints
          : fallbackResponse.rationalPoints,
        considerations: Array.isArray(parsed.considerations) && parsed.considerations.length > 0
          ? parsed.considerations
          : fallbackResponse.considerations,
        growthSuggestions: Array.isArray(parsed.growthSuggestions) && parsed.growthSuggestions.length > 0
          ? parsed.growthSuggestions
          : fallbackResponse.growthSuggestions,
        openQuestions: Array.isArray(parsed.openQuestions) && parsed.openQuestions.length > 0
          ? parsed.openQuestions
          : fallbackResponse.openQuestions,
      });
    }

    return res.json(fallbackResponse);
  } catch (error) {
    console.error("Story partner error:", error);
    res.json({
      ideaOpens: "Ý tưởng của bạn mang tới một lăng kính nhân văn và giàu tình cảm cho nhân vật.",
      rationalPoints: [
        "Phù hợp với phẩm chất lương thiện sâu kín của nhân vật.",
        "Mở ra tình huống kịch tính nhưng chân thực.",
      ],
      considerations: [
        "Cân nhắc áp lực từ định kiến cộng đồng xung quanh.",
        "Chú ý nhịp điệu của câu chuyện để cảm xúc không bị vội vã.",
      ],
      growthSuggestions: [
        "Miêu tả ánh mắt hoặc cử chỉ đầu tiên khi đưa ra quyết định mới.",
        "Thêm một lời đối thoại ngắn bộc lộ sự giằng xé nội tâm.",
      ],
      openQuestions: [
        "Nếu đối diện với sự nghi ngờ của người khác, nhân vật sẽ nói gì?",
        "Chi tiết nào sẽ là minh chứng cho sự kiên định của lựa chọn này?",
      ],
    });
  }
});

// ============================================================================
// AI KIỂM TRA TRƯỚC KHI CÔNG KHAI (Section XVI)
// ============================================================================
app.post("/api/create/safety-check", aiRateLimiter, async (req: Request, res: Response) => {
  try {
    const { title, creativeContent, originalWork } = req.body;
    const textToCheck = `${title || ""} ${creativeContent || ""}`.trim();

    if (!textToCheck) {
      return res.json({ isSafe: true });
    }

    const cacheKey = `safety:${originalWork || ""}:${textToCheck.slice(0, 100)}_${textToCheck.length}`;
    const cached = getCachedResult<any>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const fallback = {
      isSafe: true,
      warning: "",
    };

    if ((req as any)._forceFallback) {
      return res.json(fallback);
    }

    const prompt = `Bạn là Trợ lý Kiểm định An toàn Sáng tạo cho học sinh THPT trên nền tảng giáo dục văn học READVERSE.
Kiểm tra bản sáng tạo văn học sau đây:
Tác phẩm gốc: "${originalWork || ""}"
Nội dung sáng tạo của học sinh:
"${textToCheck}"

Tiêu chí đánh giá:
1. Có phù hợp với môi trường học đường THPT không (ngôn từ văn minh, không bạo lực thù hận, không quấy rối)?
2. Có chứa thông tin cá nhân nhạy cảm thật (SĐT, địa chỉ riêng tư, tài khoản cá nhân) không?
3. Có xuyên tạc thô bạo hoặc cố tình giả mạo là văn bản pháp lý/chính thức của nguyên tác không?
4. Lưu ý: Sự sáng tạo một kết cục khác, đổi hướng cốt truyện văn học hoặc hư cấu nhân vật mới LÀ HOÀN TOÀN HỢP LỆ VÀ ĐƯỢC KHUYẾN KHÍCH.

Trả về JSON thuần túy:
{
  "isSafe": true | false,
  "warning": "Lý do ngắn gọn nếu không an toàn (để trống nếu an toàn)"
}`;

    const response = await callGemini({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    if (response?.text) {
      const data = parseJsonSafely(response.text, fallback);
      const result = {
        isSafe: data.isSafe ?? true,
        warning: data.warning || "",
      };
      setCachedResult(cacheKey, result, 1800);
      return res.json(result);
    }

    return res.json(fallback);
  } catch (error) {
    console.error("Safety check error:", error);
    res.json({ isSafe: true, warning: "" });
  }
});

// ============================================================================
// GỢI Ý MỞ ĐẦU BÌNH LUẬN GÓC NHÌN (Section XII)
// ============================================================================
app.post("/api/create/comment-starters", (req: Request, res: Response) => {
  const { originalWork } = req.body;
  const work = originalWork || "tác phẩm";
  res.json({
    starters: [
      { type: "impression", label: "Điều mình ấn tượng", text: `Mình đặc biệt ấn tượng với cách bạn gỡ nút thắt trong "${work}", bởi vì...` },
      { type: "unthought", label: "Điều mình chưa từng nghĩ tới", text: "Trước đây mình chưa từng nghĩ câu chuyện có thể rẽ sang hướng này, chi tiết bất ngờ nhất là..." },
      { type: "agree", label: "Điểm mình đồng tình", text: "Mình rất đồng tình với cách bạn trân trọng phẩm giá nhân vật khi..." },
      { type: "explore_more", label: "Điểm muốn khám phá thêm", text: "Nếu câu chuyện tiếp tục sau bước ngoặt này, mình rất tò mò liệu nhân vật sẽ..." },
    ],
  });
});

// ============================================================================
// HÀNH TINH TRÍCH DẪN & KHO LƯU TRỮ GÓC NHÌN (PERSPECTIVE STORAGE API)
// ============================================================================
// File-backed persistent store with rich canonical perspectives
const MAX_PERSPECTIVES_STORE = 160;
const PERSPECTIVES_FILE_PATH = path.join(process.cwd(), "perspectives_store.json");

const SEED_PERSPECTIVES: any[] = [
  {
    id: "persp-seed-vo-nhat-1",
    authorId: "seed-author-1",
    displayName: "Minh Khuê (Sao Sáng)",
    originalWorkId: "work-vo-nhat",
    originalWorkTitle: "Vợ Nhặt",
    originalWorkAuthor: "Kim Lân",
    characters: ["Tràng", "Thị (vợ Tràng)", "Bà cụ Tứ"],
    context: "Nạn đói năm Ất Dậu 1945 tại xóm ngụ cư nghèo đói.",
    turningPoint: "Tràng quyết định mang một nửa bát cháo cám chia cho đứa trẻ đói lả trước cổng xóm",
    originalSituationSummary: "Sáng hôm sau ngày cưới, bà cụ Tứ bưng nồi cháo cám đắng chát ra, cả nhà vừa ăn vừa ngậm ngùi nghe tiếng trống thúc thuế dồn dập.",
    title: "Ngọn lửa chia sẻ giữa nạn đói xóm ngụ cư",
    introduction: "Một góc nhìn khác về bữa ăn sáng sau ngày cưới của Tràng: khi sự sẻ chia vượt qua cả nỗi sợ đói khát.",
    creativeContent: `[LỰA CHỌN CỦA BẠN]\nTràng dừng đũa trước nồi cháo cám. Nghe tiếng khóc thút thít của đứa bé con nhà hàng xóm bên ngoài hàng rào, anh không nỡ nuốt một mình. Tràng xin phép mẹ chia nửa bát cháo cám ấm nóng đưa qua khe liếp cho đứa nhỏ.\n\n[DIỄN BIẾN MỚI]\nBà cụ Tứ nhìn con, đôi mắt già nua đỏ hoe nhưng ánh lên niềm tự hào. Người vợ nhặt cũng im lặng rồi gật đầu, đưa thêm mẩu vỏ bí luộc còn sót lại. Hành động nhỏ ấy không xua đi được nạn đói, nhưng thắp lên một đốm sáng tình người ấm áp lan tỏa khắp xóm ngụ cư.\n\n[KẾT CỤC TÁI THIẾT]\nKhi đoàn người đói kéo lên phá kho thóc của Nhật, dân xóm ngụ cư đã nắm chặt tay nhau thành một khối. Tràng và vợ cùng bước đi giữa lá cờ đỏ sao vàng, trong lòng không còn nỗi sợ hãi đơn độc.`,
    storyBranches: [
      { id: "s-1", stepType: "original_plot", stepTitle: "TÌNH HUỐNG NGUYÊN TÁC", content: "Bữa cơm đón dâu nghèo khó chỉ có nồi cháo cám đắng chát và tiếng trống thúc thuế ngoài đình.", timestamp: "Gốc" },
      { id: "s-2", stepType: "turning_point", stepTitle: "ĐIỂM RẼ ĐÃ CHỌN", content: "Tràng quyết định chia nửa phần ăn cho đứa trẻ đói bên hàng xóm thay vì cam chịu ăn hết trong câm lặng.", timestamp: "Bước ngoặt" },
      { id: "s-3", stepType: "new_development", stepTitle: "DIỄN BIẾN MỚI", content: "Sự đồng lòng của người vợ và bà cụ Tứ tạo nên một sợi dây gắn kết gia đình bền chặt giữa nghịch cảnh.", timestamp: "Phát triển" },
      { id: "s-4", stepType: "climax_ending", stepTitle: "KẾT CỤC TÁI THIẾT", content: "Họ cùng dân làng vùng lên giành lấy sự sống dưới ánh sáng cách mạng.", timestamp: "Đoạn kết" },
    ],
    themes: ["Tình người", "Lòng trắc ẩn", "Vượt lên nghịch cảnh"],
    visibility: "public",
    createdAt: "2026-03-20T10:00:00.000Z",
    updatedAt: "2026-03-20T10:00:00.000Z",
    empathyCount: 14,
    empathyUsers: ["user-1", "user-2"],
    bookmarkedBy: [],
    comments: [
      { id: "c-1", userName: "Hoàng Nam", text: "Góc nhìn rất nhân văn! Kim Lân hẳn cũng sẽ mỉm cười khi thấy tinh thần đùm bọc được đẩy lên cao độ thế này.", timestamp: "Hôm qua", starterType: "agree" },
    ],
  },
  {
    id: "persp-seed-lao-hac-1",
    authorId: "seed-author-2",
    displayName: "Tuấn Kiệt (Thám Hiểm)",
    originalWorkId: "work-lao-hac",
    originalWorkTitle: "Lão Hạc",
    originalWorkAuthor: "Nam Cao",
    characters: ["Lão Hạc", "Ông giáo", "Cậu Vàng"],
    context: "Làng quê nghèo trước Cách mạng, người nông dân bị bần cùng hóa cùng cực.",
    turningPoint: "Lão Hạc không chọn bả chó tự vẫn mà quyết định trao lại mảnh vườn cho ông giáo để đi tìm con trai",
    originalSituationSummary: "Lão Hạc bán cậu Vàng trong đau đớn, gửi gắm tiền và mảnh vườn cho ông giáo rồi xin bả chó của Binh Tư để tự kết liễu cuộc đời trong co giật dữ dội.",
    title: "Hành trình đi tìm đứa con phương xa của Lão Hạc",
    introduction: "Nếu tình thương con không biến thành sự hy sinh tiêu cực, Lão Hạc sẽ chọn một lối thoát đầy nghị lực hơn.",
    creativeContent: `[LỰA CHỌN CỦA BẠN]\nLão Hạc không xin bả chó. Lão cầm bọc tiền dành dụm, đến nhà ông giáo dập đầu tạ ơn và nhờ giữ hộ giấy tờ mảnh vườn. Nhưng thay vì ở lại chờ chết mòn, lão khoác tay nải quyết định lên đồn điền cao su tìm con trai.\n\n[DIỄN BIẾN MỚI]\nÔng giáo khóc, khuyên lão tuổi già sức yếu đường xa vạn dặm. Nhưng ánh mắt lão kiên nghị: 'Tôi sống mòn ở đây thì chết mất xác vì đói, thà đi tìm nó, sống hay chết bố con cũng được nhìn mặt nhau một lần.'\n\n[KẾT CỤC TÁI THIẾT]\nCuộc hành trình gian nan kéo dài nhiều tháng trời. Dù trải qua muôn vàn đói rét dọc đường, ngọn lửa tình phụ tử đã nâng bước chân lão. Hai cha con cuối cùng cũng tìm thấy nhau giữa rừng cao su bạt ngàn, cùng thề sẽ sống để ngày trở về quê cha đất tổ.`,
    storyBranches: [
      { id: "l-1", stepType: "original_plot", stepTitle: "TÌNH HUỐNG NGUYÊN TÁC", content: "Lão Hạc tuyệt vọng sau khi bán chó và quyết định tự vẫn bằng bả chó.", timestamp: "Gốc" },
      { id: "l-2", stepType: "turning_point", stepTitle: "ĐIỂM RẼ ĐÃ CHỌN", content: "Lão chuyển hướng nỗi đau thành động lực đi tìm con thay vì cam chịu cái chết bi thảm.", timestamp: "Bước ngoặt" },
      { id: "l-3", stepType: "climax_ending", stepTitle: "KẾT CỤC TÁI THIẾT", content: "Cuộc hội ngộ cảm động thắp lên hy vọng cho thế hệ trẻ.", timestamp: "Đoạn kết" },
    ],
    themes: ["Tình cha con", "Nghị lực sống", "Hy vọng"],
    visibility: "public",
    createdAt: "2026-03-21T08:30:00.000Z",
    updatedAt: "2026-03-21T08:30:00.000Z",
    empathyCount: 19,
    empathyUsers: ["user-3", "user-4"],
    bookmarkedBy: [],
    comments: [
      { id: "c-2", userName: "Ngọc Mai", text: "Đoạn kết này làm mình rớt nước mắt vì nhẹ nhõm. Lão Hạc xứng đáng được sống để nhìn thấy con trở về!", timestamp: "Hôm nay", starterType: "impression" },
    ],
  },
];

const publicPerspectivesStore: any[] = [...SEED_PERSPECTIVES];

let isSavingPerspectives = false;
let pendingSavePerspectives = false;

async function savePerspectivesToFile() {
  if (isSavingPerspectives) {
    pendingSavePerspectives = true;
    return;
  }
  isSavingPerspectives = true;
  try {
    await fs.promises.writeFile(
      PERSPECTIVES_FILE_PATH,
      JSON.stringify(publicPerspectivesStore, null, 2),
      "utf-8"
    );
  } catch (err) {
    console.error("Failed to persist perspectives to file:", err);
  } finally {
    isSavingPerspectives = false;
    if (pendingSavePerspectives) {
      pendingSavePerspectives = false;
      savePerspectivesToFile();
    }
  }
}

function loadPersistedPerspectives() {
  try {
    if (fs.existsSync(PERSPECTIVES_FILE_PATH)) {
      const data = fs.readFileSync(PERSPECTIVES_FILE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        publicPerspectivesStore.length = 0;
        publicPerspectivesStore.push(...parsed.slice(0, MAX_PERSPECTIVES_STORE));
        return;
      }
    }
  } catch (err) {
    console.warn("Could not load persisted perspectives, using seed defaults:", err);
  }
  savePerspectivesToFile();
}

loadPersistedPerspectives();

// GET all public perspectives (with optional filter)
app.get("/api/creative-perspectives", (req: Request, res: Response) => {
  const { workTitle } = req.query;
  let list = publicPerspectivesStore.filter((p) => p.visibility === "public");
  if (workTitle && typeof workTitle === "string" && workTitle !== "Tất cả") {
    const target = workTitle.toLowerCase().trim();
    list = list.filter((p) => (p.originalWorkTitle || "").toLowerCase().includes(target));
  }
  // Sort newest first
  list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  res.json(list.slice(0, 100)); // Limit to 100 per response to prevent giant payloads
});

// POST save / publish perspective (with safety bounding and sanitization)
app.post("/api/creative-perspectives", (req: Request, res: Response) => {
  try {
    const item = req.body;
    if (!item || !item.title || !item.originalWorkTitle) {
      return res.status(400).json({ error: "Thiếu thông tin tiêu đề hoặc tác phẩm gốc" });
    }

    const id = String(item.id || `persp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    const now = new Date().toISOString();

    const record = {
      id,
      authorId: String(item.authorId || "anonymous").slice(0, 60),
      displayName: String(item.displayName || "Nhà Thám Hiểm Vũ Trụ").slice(0, 60),
      originalWorkId: String(item.originalWorkId || "").slice(0, 60),
      originalWorkTitle: String(item.originalWorkTitle).slice(0, 150),
      originalWorkAuthor: String(item.originalWorkAuthor || "Khuyết danh").slice(0, 100),
      characters: Array.isArray(item.characters) ? item.characters.map((c: any) => String(c).slice(0, 60)).slice(0, 10) : [],
      context: String(item.context || "").slice(0, 600),
      turningPoint: String(item.turningPoint || "").slice(0, 600),
      originalSituationSummary: String(item.originalSituationSummary || "").slice(0, 1000),
      title: String(item.title).slice(0, 180),
      introduction: String(item.introduction || "").slice(0, 1000),
      creativeContent: String(item.creativeContent || "").slice(0, 15000),
      storyBranches: Array.isArray(item.storyBranches)
        ? item.storyBranches.slice(0, 20).map((b: any) => ({
            id: String(b.id || "").slice(0, 40),
            stepType: b.stepType || "user_choice",
            stepTitle: String(b.stepTitle || "").slice(0, 60),
            content: String(b.content || "").slice(0, 2000),
            timestamp: String(b.timestamp || "").slice(0, 40),
          }))
        : [],
      themes: Array.isArray(item.themes) ? item.themes.map((t: any) => String(t).slice(0, 40)).slice(0, 8) : [],
      visibility: item.visibility === "public" ? "public" : "private",
      createdAt: item.createdAt || now,
      updatedAt: now,
      empathyCount: Math.max(0, Number(item.empathyCount) || 0),
      empathyUsers: Array.isArray(item.empathyUsers) ? item.empathyUsers.map(String).slice(0, 500) : [],
      bookmarkedBy: Array.isArray(item.bookmarkedBy) ? item.bookmarkedBy.map(String).slice(0, 500) : [],
      comments: Array.isArray(item.comments)
        ? item.comments.slice(0, 60).map((c: any) => ({
            id: String(c.id || "").slice(0, 40),
            userName: String(c.userName || "Bạn đọc").slice(0, 60),
            text: String(c.text || "").slice(0, 600),
            timestamp: String(c.timestamp || "").slice(0, 60),
            starterType: c.starterType || "custom",
          }))
        : [],
      aiPartnerAdvice: item.aiPartnerAdvice || null,
    };

    const existingIdx = publicPerspectivesStore.findIndex((p) => p.id === id);
    if (existingIdx >= 0) {
      publicPerspectivesStore[existingIdx] = record;
    } else {
      publicPerspectivesStore.unshift(record);
      if (publicPerspectivesStore.length > MAX_PERSPECTIVES_STORE) {
        publicPerspectivesStore.splice(MAX_PERSPECTIVES_STORE);
      }
    }

    savePerspectivesToFile();
    res.json(record);
  } catch (error) {
    console.error("Save perspective error:", error);
    res.status(500).json({ error: "Không thể lưu góc nhìn sáng tạo" });
  }
});

// POST interact: empathy toggle, bookmark, or comment
app.post("/api/creative-perspectives/:id/interact", (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, userId, userName, commentText, starterType } = req.body;

  const item = publicPerspectivesStore.find((p) => p.id === id);
  if (!item) {
    return res.status(404).json({ error: "Không tìm thấy góc nhìn" });
  }

  if (action === "empathy") {
    item.empathyUsers = item.empathyUsers || [];
    const safeUserId = String(userId || "guest").slice(0, 60);
    const idx = item.empathyUsers.indexOf(safeUserId);
    if (idx >= 0) {
      item.empathyUsers.splice(idx, 1);
      item.empathyCount = Math.max(0, (item.empathyCount || 1) - 1);
    } else {
      item.empathyUsers.push(safeUserId);
      item.empathyCount = (item.empathyCount || 0) + 1;
    }
    savePerspectivesToFile();
  } else if (action === "comment") {
    if (commentText && typeof commentText === "string" && commentText.trim()) {
      item.comments = item.comments || [];
      if (item.comments.length < 60) {
        item.comments.push({
          id: `cmt-${Date.now()}`,
          userName: String(userName || "Bạn đọc").slice(0, 50),
          text: String(commentText).trim().slice(0, 600),
          timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) + " hôm nay",
          starterType: starterType || "custom",
        });
        savePerspectivesToFile();
      }
    }
  }

  res.json(item);
});

// DELETE perspective
app.delete("/api/creative-perspectives/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const { authorId } = req.body;

  const idx = publicPerspectivesStore.findIndex((p) => p.id === id);
  if (idx >= 0) {
    const item = publicPerspectivesStore[idx];
    if (authorId && item.authorId && item.authorId !== authorId) {
      return res.status(403).json({ error: "Không có quyền xóa bài viết này" });
    }
    publicPerspectivesStore.splice(idx, 1);
    savePerspectivesToFile();
    return res.json({ success: true, deletedId: id });
  }

  res.status(404).json({ error: "Không tìm thấy góc nhìn" });
});

// PATCH change visibility
app.patch("/api/creative-perspectives/:id/visibility", (req: Request, res: Response) => {
  const { id } = req.params;
  const { visibility, authorId } = req.body;

  const item = publicPerspectivesStore.find((p) => p.id === id);
  if (!item) {
    return res.status(404).json({ error: "Không tìm thấy góc nhìn" });
  }
  if (authorId && item.authorId && item.authorId !== authorId) {
    return res.status(403).json({ error: "Không có quyền thay đổi trạng thái" });
  }

  item.visibility = visibility === "public" ? "public" : "private";
  savePerspectivesToFile();
  res.json(item);
});

// Community Quote AI Response (warm, encouraging, stimulates deeper thought, NO grading, NO right/wrong)
app.post("/api/quotes/respond", async (req: Request, res: Response) => {
  try {
    const { workTitle, quote, reflection, userName } = req.body;

    const fallback = {
      aiComment: `Chào ${userName || "bạn"}, Komi rất xúc động khi đọc cảm nghĩ của bạn về "${workTitle}". Góc nhìn của bạn cho thấy một trái tim biết lắng nghe và đồng cảm sâu sắc. Khi đọc đoạn này, bạn có cảm thấy chính mình cũng từng có lúc mang tâm trạng tương tự không?`,
      warmQuestion: "Nếu có thể trò chuyện với nhân vật ngay khoảnh khắc ấy, bạn sẽ nhắn nhủ điều gì?",
    };

    const prompt = `Bạn là Komi - Bạn đồng hành vũ trụ của READVERSE.
Học sinh ${userName || "độc giả trẻ"} vừa chia sẻ cảm nghĩ về tác phẩm "${workTitle}":
- Trích dẫn yêu thích: "${quote}"
- Cảm nghĩ cá nhân: "${reflection}"

YÊU CẦU QUAN TRỌNG:
- Đóng vai trò là NGƯỜI PHẢN HỒI ĐẦU TIÊN của cộng đồng.
- Phản hồi ấm áp, thấu cảm, khích lệ và kích thích suy nghĩ thêm.
- TUYỆT ĐỐI KHÔNG CHẤM ĐIỂM, KHÔNG ĐÁNH GIÁ ĐÚNG/SAI.
- Đặt 1 câu hỏi gợi mở để bạn học sinh tiếp tục chiêm nghiệm.

Trả về JSON thuần túy:
{
  "aiComment": "Lời nhận xét ấm áp, thân thiện (dưới 80 từ)",
  "warmQuestion": "Câu hỏi gợi mở nhẹ nhàng kích thích tư duy thêm (dưới 35 từ)"
}`;

    const response = await callGemini({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.8,
      },
    });

    if (response?.text) {
      const data = parseJsonSafely(response.text, fallback);
      return res.json(data);
    }

    return res.json(fallback);
  } catch (error) {
    console.error("Quote respond error:", error);
    res.json({
      aiComment: `Cảm ơn bạn đã chia sẻ một trích dẫn thật đẹp từ "${req.body.workTitle || "tác phẩm"}". Cảm nhận của bạn mang lại một luồng sinh khí ấm áp cho dải ngân hà READVERSE!`,
      warmQuestion: "Điều gì trong câu trích này đã chạm vào trái tim bạn mạnh mẽ nhất?",
    });
  }
});

// 6. Weekly Recommendations: 3 Personalized Reading Journeys
app.post("/api/recommendations", aiRateLimiter, async (req: Request, res: Response) => {
  try {
    const { readingHistory, readWorks, interests, readingStyle, experienceLevel } = req.body;

    const worksList: string[] = (readWorks || readingHistory || ["Vợ Nhặt", "Lão Hạc"]).map(String);
    const interestsList: string[] = (interests || ["Con người", "Trưởng thành", "Bí ẩn"]).map(String);
    const style = String(readingStyle || experienceLevel || "Thích truyện ngắn, sâu lắng");

    const cacheKey = `rec:${worksList.slice().sort().join("_")}:${interestsList.slice().sort().join("_")}`;
    const cached = getCachedResult<any>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const defaultRecommendations = [
      {
        id: "rec-1",
        title: "Hoàng Tử Bé",
        author: "Antoine de Saint-Exupéry",
        whyRecommended: "Dành riêng cho tâm hồn ưa khám phá của bạn. Cuốn sách giúp bạn nhìn lại các mối quan hệ qua lăng kính dịu dàng và đầy chất thơ.",
        themes: ["Trưởng thành", "Tình bạn", "Triết lý sống"],
        ponderQuestion: "Điều gì thực sự quan trọng trong cuộc đời mà mắt thường không nhìn thấy được?",
        quoteSnippet: "Người ta chỉ nhìn thấy thật rõ ràng bằng trái tim. Cái cốt yếu thì mắt thường không thể thấy.",
      },
      {
        id: "rec-2",
        title: "Tôi Thấy Hoa Vàng Trên Cỏ Xanh",
        author: "Nguyễn Nhật Ánh",
        whyRecommended: "Rất phù hợp với sở thích về Con người & Cảm xúc của bạn. Tác phẩm gợi mở những suy tư đa chiều về sự trưởng thành và tình anh em.",
        themes: ["Tuổi thơ", "Đố kỵ & Thứ tha", "Tình anh em"],
        ponderQuestion: "Làm thế nào để một đứa trẻ vượt qua sự ích kỷ non nớt để học cách yêu thương người khác trọn vẹn?",
        quoteSnippet: "Ngồi im trong bóng tối, tôi cảm thấy nỗi buồn như ngọn cỏ dại mọc lan trong tim...",
      },
      {
        id: "rec-3",
        title: "Bếp Lửa",
        author: "Bằng Việt",
        whyRecommended: "Độ dài vừa vặn nhưng đong đầy cảm xúc, giúp bạn rèn luyện khả năng liên kết hình tượng nghệ thuật với trải nghiệm gia đình.",
        themes: ["Tình bà cháu", "Cội nguồn", "Ký ức chiến tranh"],
        ponderQuestion: "Ngọn lửa mà người bà nhóm lên không chỉ sưởi ấm nồi khoai, mà còn thắp sáng điều gì trong tâm hồn đứa cháu?",
        quoteSnippet: "Lận đận đời bà biết mấy nắng mưa / Mấy chục năm rồi, đến tận bây giờ...",
      },
    ];

    if ((req as any)._forceFallback) {
      return res.json({ recommendations: defaultRecommendations });
    }

    const prompt = `Bạn là Trí Tuệ Định Vị Ngân Hà của READVERSE.
Dựa trên hồ sơ phi hành gia:
- Phong cách đọc / cấp độ: ${style}
- Thể loại/Chủ đề yêu thích: ${JSON.stringify(interestsList)}
- Tác phẩm đã đọc: ${JSON.stringify(worksList)}

Lưu ý nghiêm ngặt:
- Ưu tiên các tác phẩm truyện ngắn, văn học tiếp cận nhẹ nhàng, phù hợp lứa tuổi học sinh THPT, giàu ý nghĩa.
- Tạo ra ĐÚNG 3 tác phẩm được cá nhân hóa sâu sắc, phù hợp cho giao diện BookRecommendation.
- Trả về JSON thuần túy:
{
  "recommendations": [
    {
      "id": "rec-uuid",
      "title": "Tên tác phẩm",
      "author": "Tác giả",
      "whyRecommended": "Giải thích 2 câu vì sao phù hợp với gu đọc và tư duy của học sinh",
      "themes": ["Chủ đề 1", "Chủ đề 2"],
      "ponderQuestion": "Câu hỏi gợi mở sâu sắc trước khi đọc",
      "quoteSnippet": "Một câu trích dẫn đắt giá của tác phẩm"
    }
  ]
}`;

    const response = await callGemini({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    if (response?.text) {
      const data = parseJsonSafely(response.text, { recommendations: defaultRecommendations });
      if (Array.isArray(data.recommendations) && data.recommendations.length > 0) {
        const mapped = data.recommendations.map((item: any, idx: number) => ({
          id: item.id || `rec-${Date.now()}-${idx}`,
          title: item.title || "Tác phẩm hay",
          author: item.author || "Khuyết danh",
          whyRecommended: item.whyRecommended || item.whyForYou || "Một tác phẩm mở ra nhiều suy tưởng sâu sắc.",
          themes: Array.isArray(item.themes) ? item.themes : [item.theme || "Văn học"],
          ponderQuestion: item.ponderQuestion || "Điều gì đọng lại sâu sắc nhất sau tác phẩm này?",
          quoteSnippet: item.quoteSnippet || "Trang sách là cánh cửa bước vào tâm hồn con người.",
        }));
        const result = { recommendations: mapped };
        setCachedResult(cacheKey, result, 3600);
        return res.json(result);
      }
    }

    return res.json({ recommendations: defaultRecommendations });
  } catch (error) {
    console.error("Recommendations error:", error);
    res.json({
      recommendations: [
        {
          id: "rec-fallback-1",
          title: "Hoàng Tử Bé",
          author: "Antoine de Saint-Exupéry",
          whyRecommended: "Một kiệt tác ngắn gọn nhưng chứa đựng muôn vàn vì sao suy tưởng.",
          themes: ["Trưởng thành", "Tình bạn"],
          ponderQuestion: "Cái cốt yếu thực sự là gì?",
          quoteSnippet: "Người ta chỉ nhìn thấy thật rõ ràng bằng trái tim.",
        },
      ],
    });
  }
});

// Centralized API error middleware (catches all unhandled controller exceptions)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("API Error caught by middleware:", err?.message || err);
  if (!res.headersSent) {
    res.status(500).json({ error: "Hệ thống đang điều chỉnh quỹ đạo. Vui lòng thử lại sau giây lát." });
  }
});

// Setup Vite middleware for development or static serve for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 READVERSE cosmic server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();

import React, { useState, useEffect } from "react";
import { GitCommit, Sparkles, Plus, Check, Award, ArrowRight, Share2, Layers, BookOpen, User, Tag, HelpCircle, CheckCircle2 } from "lucide-react";
import { ConstellationItem, UserProfile } from "../../types";
import { SUGGESTED_READING_WORKS } from "../../data/mockData";
import { playPop, playSuccess, playTwinkle } from "../../utils/audio";
import { apiFetch } from "../../utils/apiClient";

interface ConnectPlanetProps {
  user: UserProfile;
  onActivityComplete: (title: string, score: number, badge: string, planetId?: string) => void;
  onAddConstellation?: (c: ConstellationItem) => void;
  onAddReadWork?: (work: string) => void;
}

interface NodeItem {
  id: string;
  type: "book" | "character" | "theme" | "issue" | "personal";
  label: string;
  category: string;
  x: number;
  y: number;
}

export const ConnectPlanet: React.FC<ConnectPlanetProps> = ({
  user,
  onActivityComplete,
  onAddConstellation,
  onAddReadWork,
}) => {
  const [nodes, setNodes] = useState<NodeItem[]>([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [customConstellationName, setCustomConstellationName] = useState<string>("");
  const [connectionInsight, setConnectionInsight] = useState<string>("");
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [newWorkInput, setNewWorkInput] = useState<string>("");
  const [evaluationResult, setEvaluationResult] = useState<{
    depthScore: number;
    sparkleStrength?: number;
    feedback: string;
    constellationTitle: string;
    unlockedStar?: string;
  } | null>(null);

  // Build dynamic nodes from user's declared readWorks
  useEffect(() => {
    if (!user.readWorks || user.readWorks.length === 0) {
      setNodes([]);
      return;
    }

    const generatedNodes: NodeItem[] = [];

    // Helper map of rich characters and themes for common Vietnamese & world literature
    const literaryMetadata: Record<string, { characters: string[]; themes: string[]; issues: string[] }> = {
      "Vợ Nhặt": {
        characters: ["Tràng", "Thị", "Bà cụ Tứ"],
        themes: ["Khát vọng sống", "Tình thương trong hoạn nạn", "Ánh sáng tương lai"],
        issues: ["Nạn đói & Sinh tồn", "Nhân phẩm con người", "Sự đùm bọc gia đình"],
      },
      "Lão Hạc": {
        characters: ["Lão Hạc", "Cậu Vàng", "Ông Giáo"],
        themes: ["Lòng tự trọng tột cùng", "Tình phụ tử âm thầm", "Sự xót xa kiếp người"],
        issues: ["Đói nghèo & Lương tâm", "Sự cô độc tuổi già", "Bi kịch tha hóa"],
      },
      "Chí Phèo": {
        characters: ["Chí Phèo", "Thị Nở", "Bá Kiến"],
        themes: ["Khát khao lương thiện", "Sức mạnh của bát cháo hành", "Bi kịch bị cự tuyệt"],
        issues: ["Định kiến xã hội", "Bạo lực & Tha hóa", "Cơ hội làm lại cuộc đời"],
      },
      "Hai Đứa Trẻ": {
        characters: ["Liên", "An", "Mẹ con chị Tí"],
        themes: ["Chuyến tàu ánh sáng", "Nỗi buồn phố huyện", "Niềm mơ ước thoát ly"],
        issues: ["Sự tù đọng của cuộc sống", "Khao khát tương lai tươi sáng"],
      },
      "Hoàng Tử Bé": {
        characters: ["Hoàng Tử Bé", "Con Cáo", "Bông Hoa Hồng"],
        themes: ["Sự thuần hóa & Trách nhiệm", "Nhìn bằng trái tim", "Tình bạn diệu kỳ"],
        issues: ["Thế giới người lớn vội vã", "Nuôi dưỡng tâm hồn thuần khiết"],
      },
      "Truyện Kiều": {
        characters: ["Thúy Kiều", "Kim Trọng", "Từ Hải"],
        themes: ["Tài mệnh tương đố", "Chữ hiếu & Chữ tình", "Tiếng kêu thương nhân phẩm"],
        issues: ["Bất công xã hội phong kiến", "Đồng tiền vùi dập con người"],
      },
    };

    let idCount = 1;
    user.readWorks.forEach((work, index) => {
      // 1. Work Node
      const workId = `b_${idCount++}`;
      generatedNodes.push({
        id: workId,
        type: "book",
        label: work,
        category: "Tác phẩm",
        x: 15 + ((index * 25) % 70),
        y: 20 + ((index * 20) % 60),
      });

      // Find matching metadata or create contextual defaults
      const metaKey = Object.keys(literaryMetadata).find((k) => {
        if (!work || !k) return false;
        const wLow = work.toLowerCase().trim();
        const kLow = k.toLowerCase().trim();
        return wLow.includes(kLow) || kLow.includes(wLow);
      });
      const meta = metaKey ? literaryMetadata[metaKey] : null;

      if (meta) {
        meta.characters.forEach((char) => {
          generatedNodes.push({
            id: `c_${idCount++}`,
            type: "character",
            label: `${char} (${work})`,
            category: "Nhân vật",
            x: Math.min(85, Math.max(10, (idCount * 19) % 85)),
            y: Math.min(85, Math.max(15, (idCount * 23) % 80)),
          });
        });

        meta.themes.forEach((theme) => {
          generatedNodes.push({
            id: `t_${idCount++}`,
            type: "theme",
            label: `${theme}`,
            category: "Chủ đề",
            x: Math.min(85, Math.max(10, (idCount * 17) % 85)),
            y: Math.min(85, Math.max(15, (idCount * 27) % 80)),
          });
        });

        meta.issues.forEach((issue) => {
          generatedNodes.push({
            id: `i_${idCount++}`,
            type: "issue",
            label: `${issue}`,
            category: "Vấn đề xã hội",
            x: Math.min(85, Math.max(10, (idCount * 21) % 85)),
            y: Math.min(85, Math.max(15, (idCount * 19) % 80)),
          });
        });
      } else {
        // Generic dynamic nodes for custom work
        generatedNodes.push({
          id: `c_${idCount++}`,
          type: "character",
          label: `Nhân vật chính (${work})`,
          category: "Nhân vật",
          x: 40 + (index * 10),
          y: 35,
        });
        generatedNodes.push({
          id: `t_${idCount++}`,
          type: "theme",
          label: `Thông điệp nhân sinh (${work})`,
          category: "Chủ đề",
          x: 55,
          y: 60,
        });
        generatedNodes.push({
          id: `i_${idCount++}`,
          type: "issue",
          label: `Góc nhìn xã hội đương đại`,
          category: "Vấn đề xã hội",
          x: 75,
          y: 40,
        });
      }
    });

    // Add cross-cutting personal connection node
    generatedNodes.push({
      id: `p_genz`,
      type: "personal",
      label: "Góc nhìn Gen Z: Đồng cảm và chuyển hóa hôm nay",
      category: "Liên hệ bản thân",
      x: 50,
      y: 75,
    });

    setNodes(generatedNodes);
    setSelectedNodeIds([]);
  }, [user.readWorks]);

  const toggleNodeSelection = (id: string) => {
    playPop();
    if (selectedNodeIds.includes(id)) {
      setSelectedNodeIds(selectedNodeIds.filter((n) => n !== id));
    } else {
      setSelectedNodeIds([...selectedNodeIds, id]);
    }
  };

  const handleQuickAddBook = (work: string) => {
    playPop();
    if (onAddReadWork) {
      onAddReadWork(work);
    }
  };

  const handleSynthesizeConstellation = async () => {
    if (selectedNodeIds.length < 3 || !connectionInsight.trim() || isEvaluating) return;

    setIsEvaluating(true);
    playTwinkle();

    const selectedLabels = selectedNodeIds
      .map((id) => nodes.find((n) => n.id === id)?.label)
      .filter(Boolean) as string[];

    try {
      const fallbackResult = {
        depthScore: 90,
        feedback: "Liên kết giàu sức gợi giữa tác phẩm và thực tế đời sống! Bạn đã tìm ra mẫu số chung của tình người và hy vọng.",
        constellationTitle: customConstellationName || "Chòm Sao Thấu Cảm",
        unlockedStar: "Sao Thiên Trí",
      };

      const data = await apiFetch<any>(
        "/api/connect/evaluate",
        {
          method: "POST",
          body: JSON.stringify({
            nodes: selectedLabels,
            insight: connectionInsight,
            connectionReason: connectionInsight,
          }),
        },
        fallbackResult
      );

      setEvaluationResult(data);
      playSuccess();

      const newConstellation: ConstellationItem = {
        id: "c-user-" + Date.now(),
        name: data.constellationTitle || customConstellationName || "Chòm Sao Thấu Cảm",
        connectedThemes: selectedLabels,
        description: data.feedback || connectionInsight,
        unlockedAt: "Hôm nay",
        color: "#2dd4bf",
      };

      if (onAddConstellation) onAddConstellation(newConstellation);

      onActivityComplete(
        `Dệt chòm sao: ${newConstellation.name}`,
        data.depthScore || 92,
        "Kiến Trúc Sư Ngân Hà",
        "connect"
      );
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div id="planet-connect" className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0d3b4c]/90 via-[#0a4656]/80 to-[#082e46]/90 border border-teal-400/40 shadow-[0_12px_32px_rgba(20,184,166,0.35)] backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-left">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-400 to-cyan-200 p-0.5 shadow-[0_0_20px_rgba(45,212,191,0.5)] shrink-0 flex items-center justify-center">
            <div className="w-full h-full rounded-2xl bg-[#06242c] flex items-center justify-center text-3xl">
              🧩
            </div>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300 px-2.5 py-0.5 rounded-full bg-teal-500/20 border border-teal-400/30">
              BẢN ĐỒ TƯ DUY LIÊN THÔNG
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit',sans-serif] mt-1">
              Hành Tinh Liên Kết
            </h2>
            <p className="text-xs sm:text-sm text-teal-100/80">
              Nối liền tác phẩm bạn đã đọc với nhân vật, chủ đề và vấn đề xã hội để dệt nên chòm sao tư duy.
            </p>
          </div>
        </div>

        {/* Selected count pill */}
        <div className="px-4 py-2 rounded-2xl bg-teal-950/70 border border-teal-400/30 text-center shrink-0">
          <span className="text-[10px] font-bold text-teal-300 block">ĐÃ CHỌN</span>
          <span className="text-lg font-extrabold text-cyan-300">
            {selectedNodeIds.length} / 3 nút tối thiểu
          </span>
        </div>
      </div>

      {/* STATE 1: EMPTY READ WORKS -> REQUIRED PROMPT */}
      {(!user.readWorks || user.readWorks.length === 0) && (
        <div className="p-8 rounded-3xl bg-[#082630]/90 border border-teal-400/40 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-teal-500/20 border border-teal-400/40 flex items-center justify-center mx-auto text-3xl">
            ✨
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-white">Bạn chưa có tác phẩm nào trong danh sách đã đọc</h3>
            <p className="text-xs sm:text-sm text-teal-100/80 leading-relaxed">
              Mạng lưới liên kết được dệt nên từ những tác phẩm bạn đã đọc. Hãy chọn tác phẩm bạn từng đọc để kích hoạt các nút nhân vật, chủ đề và vấn đề xã hội!
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-bold text-cyan-300 block">
              Chọn nhanh tác phẩm quen thuộc bạn đã từng đọc:
            </span>
            <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
              {SUGGESTED_READING_WORKS.map((work) => (
                <button
                  key={work}
                  onClick={() => handleQuickAddBook(work)}
                  className="px-3 py-1.5 rounded-xl bg-teal-900/50 hover:bg-teal-800/70 border border-teal-400/30 text-xs font-semibold text-teal-200 hover:text-white transition-all cursor-pointer"
                >
                  + {work}
                </button>
              ))}
            </div>
          </div>

          <div className="flex max-w-md mx-auto gap-2 pt-3">
            <input
              type="text"
              value={newWorkInput}
              onChange={(e) => setNewWorkInput(e.target.value)}
              placeholder="Hoặc nhập tên tác phẩm khác..."
              className="flex-1 px-4 py-2 rounded-xl bg-sky-950/80 border border-teal-400/40 text-xs text-white placeholder-teal-300/40 outline-none focus:border-cyan-300"
            />
            <button
              onClick={() => {
                if (newWorkInput.trim()) {
                  handleQuickAddBook(newWorkInput.trim());
                  setNewWorkInput("");
                }
              }}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Thêm & Mở mạng lưới
            </button>
          </div>
        </div>
      )}

      {/* Nodes Interactive Galaxy Grid */}
      {nodes.length > 0 && (
        <div className="p-6 rounded-3xl bg-[#07242e]/90 border border-teal-400/30 shadow-lg text-left space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-teal-500/20">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-400" />
                Mạng Lưới Các Nút Tri Thức (Nhấp để chọn ít nhất 3 nút)
              </h3>
              <p className="text-xs text-teal-200/70">
                Hãy kết nối: [Tác phẩm] ➔ [Nhân vật] ➔ [Vấn đề xã hội hoặc bản thân]
              </p>
            </div>
            <div className="flex gap-2 text-[11px]">
              <span className="flex items-center gap-1 text-sky-300">📖 Tác phẩm</span>
              <span className="flex items-center gap-1 text-purple-300">👤 Nhân vật</span>
              <span className="flex items-center gap-1 text-amber-300">💡 Chủ đề</span>
              <span className="flex items-center gap-1 text-teal-300">🌍 Vấn đề xã hội</span>
            </div>
          </div>

          {/* Interactive Node Chips */}
          <div className="flex flex-wrap gap-2 pt-2">
            {nodes.map((node) => {
              const isSelected = selectedNodeIds.includes(node.id);
              const nodeIcons: Record<string, string> = {
                book: "📖",
                character: "👤",
                theme: "💡",
                issue: "🌍",
                personal: "✨",
              };
              return (
                <button
                  key={node.id}
                  onClick={() => toggleNodeSelection(node.id)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-semibold transition-all border flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-[#071330] font-bold border-cyan-300 shadow-[0_0_12px_rgba(45,212,191,0.6)] scale-102"
                      : "bg-[#08222b]/80 hover:bg-[#0c313e] border-teal-500/30 text-teal-100"
                  }`}
                >
                  <span>{nodeIcons[node.type] || "•"}</span>
                  <span>{node.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 ml-1" />}
                </button>
              );
            })}
          </div>

          {/* Selected Connection Chain Preview */}
          {selectedNodeIds.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-teal-950/60 border border-teal-400/30 text-xs">
              <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-300 block mb-1">
                Chuỗi liên kết hiện tại:
              </span>
              <div className="flex flex-wrap items-center gap-1 text-white font-medium">
                {selectedNodeIds.map((id, idx) => {
                  const node = nodes.find((n) => n.id === id);
                  return (
                    <React.Fragment key={id}>
                      <span className="px-2 py-0.5 rounded-lg bg-teal-900/60 text-teal-200 border border-teal-500/40">
                        {node?.label}
                      </span>
                      {idx < selectedNodeIds.length - 1 && <span className="text-teal-400">➔</span>}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {/* Synthesis Input Section */}
          <div className="space-y-3 pt-3 border-t border-teal-500/20">
            <div>
              <label className="text-xs font-bold text-teal-200 block mb-1">
                ⭐ Tên chòm sao bạn muốn đặt (Tùy chọn):
              </label>
              <input
                type="text"
                value={customConstellationName}
                onChange={(e) => setCustomConstellationName(e.target.value)}
                placeholder="Ví dụ: Chòm Sao Ánh Lửa, Chòm Sao Thấu Cảm, Chòm Sao Kiên Định..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-sky-950/80 border border-teal-400/40 text-xs text-white placeholder-teal-400/40 outline-none focus:border-cyan-300"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-cyan-300 block mb-1">
                🧠 Lời giải thích liên kết của bạn (Tại sao bạn cho rằng các yếu tố này có liên hệ với nhau?):
              </label>
              <textarea
                rows={3}
                value={connectionInsight}
                onChange={(e) => setConnectionInsight(e.target.value)}
                placeholder="Giải thích sợi dây kết nối: Ví dụ hoàn cảnh khó khăn thử thách lòng trắc ẩn như thế nào, và liên hệ gì với giới trẻ hôm nay?..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-sky-950/80 border border-teal-400/40 text-xs text-white placeholder-teal-400/40 outline-none focus:border-cyan-300 resize-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSynthesizeConstellation}
                disabled={selectedNodeIds.length < 3 || !connectionInsight.trim() || isEvaluating}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-400 via-cyan-400 to-sky-400 hover:brightness-110 text-[#071330] font-extrabold text-xs sm:text-sm shadow-[0_4px_16px_rgba(45,212,191,0.5)] transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-40"
              >
                {isEvaluating ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-[#071330] border-t-transparent animate-spin" />
                    AI đang thắp sáng chòm sao...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Dệt Chòm Sao & Gửi AI Đánh Giá
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Evaluation Modal / Card */}
      {evaluationResult && (
        <div className="p-6 rounded-3xl bg-gradient-to-b from-[#082b36]/95 to-[#062028]/95 border-2 border-teal-400/50 shadow-[0_16px_40px_rgba(45,212,191,0.4)] backdrop-blur-md animate-in slide-in-from-bottom-6 duration-300 text-left space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-teal-500/30">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-300" />
              <h3 className="text-lg font-bold text-white font-['Outfit',sans-serif]">
                Chòm Sao Đã Được Thắp Sáng: {evaluationResult.constellationTitle}
              </h3>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-teal-400/20 text-teal-300 border border-teal-400/30 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Điểm liên kết: {evaluationResult.depthScore}/100
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-teal-950/60 border border-teal-500/30 space-y-2">
            <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Nhận xét chiều sâu liên tưởng:
            </h4>
            <p className="text-xs sm:text-sm text-teal-100 leading-relaxed">
              {evaluationResult.feedback}
            </p>
          </div>

          <div className="pt-2 text-right">
            <span className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Chòm sao mới đã được ghi danh vào Bản đồ Chòm sao & Hồ sơ của bạn!
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

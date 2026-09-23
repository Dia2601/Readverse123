import React, { useState, useEffect } from "react";
import { Sparkles, Feather, Lightbulb, CheckCircle, Award, BookOpen, Send, RefreshCw, Bookmark, MessageSquare, AlertCircle, GitBranch, ArrowRight } from "lucide-react";
import { UserProfile, CreativePerspective } from "../../types";
import { SUGGESTED_READING_WORKS } from "../../data/mockData";
import { playPop, playSuccess, playTwinkle } from "../../utils/audio";
import { StoryReconstruction } from "./StoryReconstruction";
import { apiFetch } from "../../utils/apiClient";

interface CreatePlanetProps {
  user: UserProfile;
  onActivityComplete: (title: string, score: number, badge: string, planetId?: string) => void;
  onSaveCreation?: (creation: { id: string; title: string; workTitle: string; content: string; date: string }) => void;
  onAddReadWork?: (work: string) => void;
  onOpenStoryReconstruction?: (workTitle: string, starterHint?: string) => void;
  onNavigateToQuotesPlanet?: () => void;
  onViewPerspectiveDetail?: (perspective: CreativePerspective) => void;
}

interface CreativePrompt {
  id: string;
  title: string;
  originalWork: string;
  promptType: "alternative_ending" | "diary" | "modern_2025" | "letter";
  typeLabel: string;
  description: string;
  characterAnchor: string;
  starterHint: string;
}

export const CreatePlanet: React.FC<CreatePlanetProps> = ({
  user,
  onActivityComplete,
  onSaveCreation,
  onAddReadWork,
  onOpenStoryReconstruction,
  onNavigateToQuotesPlanet,
  onViewPerspectiveDetail,
}) => {
  const [prompts, setPrompts] = useState<CreativePrompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<CreativePrompt | null>(null);
  const [customText, setCustomText] = useState<string>("");
  const [isAskingCoCreate, setIsAskingCoCreate] = useState<boolean>(false);
  const [isSavingToArchive, setIsSavingToArchive] = useState<boolean>(false);
  const [newWorkInput, setNewWorkInput] = useState<string>("");

  // In-planet dedicated state for Story Reconstruction
  const [storyReconstructWork, setStoryReconstructWork] = useState<string | null>(null);

  // AI Co-creation feedback (does not write for them, gives suggestions)
  const [coCreateFeedback, setCoCreateFeedback] = useState<{
    voiceHighlight: string;
    emotionalImpact: string;
    imagerySuggestions: string[];
    encouragement: string;
  } | null>(null);

  // Final archive result
  const [archiveResult, setArchiveResult] = useState<{
    creativityScore: number;
    depthScore: number;
    feedback: string;
    characterPraise: string;
    badge: string;
  } | null>(null);

  // Count words helper
  const wordCount = customText.trim() ? customText.trim().split(/\s+/).length : 0;
  const isMinimumWordsMet = wordCount >= 50;

  // Build prompts based on user's readWorks
  useEffect(() => {
    if (!user.readWorks || user.readWorks.length === 0) {
      setPrompts([]);
      setSelectedPrompt(null);
      return;
    }

    const generated: CreativePrompt[] = [];
    user.readWorks.forEach((work, idx) => {
      // 1. Alternative ending
      generated.push({
        id: `p_alt_${idx}`,
        title: `Đoạn kết mới cho "${work}"`,
        originalWork: work,
        promptType: "alternative_ending",
        typeLabel: "Viết tiếp đoạn kết khác",
        description: `Nếu ở thời khắc quyết định, nhân vật chính trong "${work}" có một lựa chọn khác biệt, câu chuyện sẽ khép lại thế nào?`,
        characterAnchor: "Giữ vững bản chất tình cảm và tâm hồn của nhân vật trong hoàn cảnh mới.",
        starterHint: `Buổi chiều hôm đó, ngọn gió đổi chiều mang theo một bước ngoặt bất ngờ...`,
      });

      // 2. Diary from secondary character's POV
      generated.push({
        id: `p_diary_${idx}`,
        title: `Nhật ký của một nhân vật phụ trong "${work}"`,
        originalWork: work,
        promptType: "diary",
        typeLabel: "Nhật ký nhân vật phụ",
        description: `Kể lại biến cố qua con mắt của người chứng kiến thầm lặng trong "${work}".`,
        characterAnchor: "Sự băn khoăn, xót xa và những điều chưa thể thốt nên lời.",
        starterHint: `Đêm nay trăng khuất sau rặng tre, tôi ngồi lặng yên nhìn sang căn nhà ấy...`,
      });

      // 3. Modern 2025 context
      generated.push({
        id: `p_mod_${idx}`,
        title: `Nhân vật "${work}" giữa nhịp sống 2025`,
        originalWork: work,
        promptType: "modern_2025",
        typeLabel: "Đặt vào bối cảnh hiện đại 2025",
        description: `Nếu sống giữa kỷ nguyên công nghệ số và nhịp sống hối hả năm 2025, họ sẽ đối diện với những cám dỗ và thử thách nào?`,
        characterAnchor: "Sự giằng xé giữa giá trị cốt lõi và nhịp sống hiện đại.",
        starterHint: `Màn hình điện thoại liên tục nhấp nháy những dòng thông báo, giữa dòng người tấp nập...`,
      });

      // 4. Letter to the character
      generated.push({
        id: `p_let_${idx}`,
        title: `Bức thư vượt thời gian gửi nhân vật trong "${work}"`,
        originalWork: work,
        promptType: "letter",
        typeLabel: "Thư gửi nhân vật",
        description: `Viết một bức thư tâm tình gửi đến nhân vật bạn trăn trở nhất trong "${work}".`,
        characterAnchor: "Sự thấu cảm sâu sắc giữa hai thế hệ cách biệt hàng thập kỷ.",
        starterHint: `Gửi bạn - người bạn tri kỷ tôi chỉ vừa được gặp qua từng trang sách...`,
      });
    });

    setPrompts(generated);
    if (generated.length > 0 && !selectedPrompt) {
      setSelectedPrompt(generated[0]);
    }
  }, [user.readWorks]);

  const handleSelectPrompt = (p: CreativePrompt) => {
    playPop();
    if (p.promptType === "alternative_ending" || p.typeLabel.includes("đoạn kết khác")) {
      playTwinkle();
      if (onOpenStoryReconstruction) {
        onOpenStoryReconstruction(p.originalWork, p.starterHint);
      } else {
        setStoryReconstructWork(p.originalWork);
      }
      return;
    }
    setSelectedPrompt(p);
    setCustomText("");
    setCoCreateFeedback(null);
    setArchiveResult(null);
  };

  const handleUseStarter = () => {
    if (!selectedPrompt) return;
    playPop();
    setCustomText((prev) => (prev ? prev + " " + selectedPrompt.starterHint : selectedPrompt.starterHint + " "));
  };

  const handleQuickAddBook = (work: string) => {
    playPop();
    if (onAddReadWork) {
      onAddReadWork(work);
    }
  };

  // Co-creation advice from AI (does not write for student!)
  const handleRequestCoCreate = async () => {
    if (!selectedPrompt || !customText.trim() || isAskingCoCreate) return;

    setIsAskingCoCreate(true);
    playTwinkle();

    try {
      const fallbackFeedback = {
        voiceHighlight: "Giọng văn chân thành, câu từ mộc mạc và giàu cảm xúc.",
        emotionalImpact: "Truyền tải được nỗi trăn trở của nhân vật rất tốt.",
        imagerySuggestions: [
          "Thêm một chi tiết gợi tả giác quan như tiếng gió xào xạc hay hơi thở ngập ngừng.",
          "Mô tả ánh mắt hay chuyển động bàn tay để tạo thêm điểm nhấn hình ảnh.",
        ],
        encouragement: "Đoạn văn của bạn đã có sức gợi rất tốt! Hãy tiếp tục mài giũa thêm chi tiết.",
      };

      const data = await apiFetch<any>(
        "/api/create/co-create-feedback",
        {
          method: "POST",
          body: JSON.stringify({
            originalWork: selectedPrompt.originalWork,
            promptTitle: selectedPrompt.title,
            studentDraft: customText,
          }),
        },
        fallbackFeedback
      );

      setCoCreateFeedback(data);
      playSuccess();
    } finally {
      setIsAskingCoCreate(false);
    }
  };

  // Save to Cosmic Archive & Complete Activity
  const handleSaveToArchive = async () => {
    if (!selectedPrompt || !isMinimumWordsMet || isSavingToArchive) return;

    setIsSavingToArchive(true);
    playTwinkle();

    try {
      const fallbackEval = {
        creativityScore: 92,
        depthScore: 90,
        feedback: "Tác phẩm sáng tạo xuất sắc! Bạn kết nối hài hòa giữa cảm xúc nhân vật và trí tưởng tượng tươi mới.",
        characterPraise: "Tình cảm và ngôn từ thể hiện sự thấu cảm sâu sắc.",
        badge: "Cây Bút Ngân Hà",
      };

      const data = await apiFetch<any>(
        "/api/create/evaluate",
        {
          method: "POST",
          body: JSON.stringify({
            originalWork: selectedPrompt.originalWork,
            promptTitle: selectedPrompt.title,
            studentText: customText,
          }),
        },
        fallbackEval
      );

      setArchiveResult(data);
      playSuccess();

      if (onSaveCreation) {
        onSaveCreation({
          id: "creation-" + Date.now(),
          title: selectedPrompt.title,
          workTitle: selectedPrompt.originalWork,
          content: customText,
          date: new Date().toLocaleDateString("vi-VN"),
        });
      }

      onActivityComplete(
        `Sáng tác: ${selectedPrompt.title}`,
        Math.round(((data.creativityScore || 92) + (data.depthScore || 90)) / 2),
        data.badge || "Cây Bút Ngân Hà",
        "create"
      );
    } finally {
      setIsSavingToArchive(false);
    }
  };

  if (storyReconstructWork) {
    return (
      <StoryReconstruction
        workTitle={storyReconstructWork}
        currentUser={user}
        onBack={() => setStoryReconstructWork(null)}
        onNavigateToQuotesPlanet={onNavigateToQuotesPlanet}
        onViewPublishedPerspective={onViewPerspectiveDetail}
      />
    );
  }

  return (
    <div id="planet-create" className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#3b0764]/90 via-[#4c1d95]/80 to-[#1e1b4b]/90 border border-fuchsia-400/40 shadow-[0_12px_32px_rgba(217,70,239,0.35)] backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-left">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-400 to-fuchsia-300 p-0.5 shadow-[0_0_20px_rgba(244,114,182,0.5)] shrink-0 flex items-center justify-center">
            <div className="w-full h-full rounded-2xl bg-[#1e0735] flex items-center justify-center text-3xl">
              ✨
            </div>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-fuchsia-300 px-2.5 py-0.5 rounded-full bg-fuchsia-500/20 border border-fuchsia-400/30">
              TƯỞNG TƯỢNG VÀ TÁI THIẾT VĂN HỌC
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit',sans-serif] mt-1">
              Hành Tinh Sáng Tạo
            </h2>
            <p className="text-xs sm:text-sm text-fuchsia-200/80">
              Viết tiếp đoạn kết khác, ghi nhật ký nhân vật phụ, đặt vào năm 2025, hoặc gửi thư cho nhân vật.
            </p>
          </div>
        </div>
      </div>

      {/* FEATURED SPECIAL JOURNEY: STORY RECONSTRUCTION */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#2c084e]/90 via-[#3d1266]/80 to-[#1e0a45]/90 border-2 border-pink-400/50 shadow-[0_8px_30px_rgba(244,114,182,0.25)] text-left flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-pink-300 px-2.5 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/30">
              ✦ HÀNH TRÌNH TÁI THIẾT CÂU CHUYỆN
            </span>
            <span className="text-xs text-fuchsia-300 flex items-center gap-1 font-semibold">
              <GitBranch className="w-3.5 h-3.5 text-pink-400" />
              Cây Cốt Truyện Đa Nhánh
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-white font-['Outfit',sans-serif]">
            Viết Tiếp Đoạn Kết Khác Cùng AI Cộng Sự
          </h3>
          <p className="text-xs sm:text-sm text-fuchsia-200/80 leading-relaxed font-serif">
            Chọn một bước ngoặt trong cốt truyện gốc, viết nên hướng rẽ mới của riêng bạn. AI sẽ đồng hành phản hồi cảm xúc, bảo đảm bạn luôn là người làm chủ trang viết.
          </p>
        </div>

        <button
          onClick={() => {
            playTwinkle();
            const targetWork = user.readWorks?.[0] || "Vợ Nhặt";
            if (onOpenStoryReconstruction) {
              onOpenStoryReconstruction(targetWork);
            } else {
              setStoryReconstructWork(targetWork);
            }
          }}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-pink-500/30 shrink-0 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-pink-200" />
          <span>Bắt đầu Tái Thiết Ngay</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* STATE 1: EMPTY READ WORKS -> REQUIRED PROMPT */}
      {(!user.readWorks || user.readWorks.length === 0) && (
        <div className="p-8 rounded-3xl bg-[#1c0c36]/90 border border-fuchsia-400/40 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-fuchsia-500/20 border border-fuchsia-400/40 flex items-center justify-center mx-auto text-3xl">
            ✍️
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-white">Bạn chưa có tác phẩm nào trong danh sách đã đọc</h3>
            <p className="text-xs sm:text-sm text-fuchsia-200/80 leading-relaxed">
              Các thử thách sáng tạo được xây dựng từ tác phẩm bạn đã đọc để bạn tự do viết tiếp cái kết hoặc gửi thư cho nhân vật. Hãy chọn tác phẩm bạn từng đọc!
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-bold text-pink-300 block">
              Chọn nhanh tác phẩm quen thuộc bạn đã từng đọc:
            </span>
            <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
              {SUGGESTED_READING_WORKS.map((work) => (
                <button
                  key={work}
                  onClick={() => handleQuickAddBook(work)}
                  className="px-3 py-1.5 rounded-xl bg-fuchsia-900/50 hover:bg-fuchsia-800/70 border border-fuchsia-400/30 text-xs font-semibold text-fuchsia-200 hover:text-white transition-all cursor-pointer"
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
              className="flex-1 px-4 py-2 rounded-xl bg-sky-950/80 border border-fuchsia-400/40 text-xs text-white placeholder-fuchsia-300/40 outline-none focus:border-cyan-300"
            />
            <button
              onClick={() => {
                if (newWorkInput.trim()) {
                  handleQuickAddBook(newWorkInput.trim());
                  setNewWorkInput("");
                }
              }}
              className="px-4 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Thêm & Mở xưởng viết
            </button>
          </div>
        </div>
      )}

      {/* Prompts Selection Grid */}
      {prompts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          {prompts.map((p) => {
            const isSelected = selectedPrompt?.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPrompt(p)}
                className={`p-4 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-gradient-to-br from-fuchsia-950/90 to-purple-950/90 border-fuchsia-400 shadow-[0_0_20px_rgba(217,70,239,0.4)] scale-101"
                    : "bg-[#160c2b]/70 hover:bg-[#20113f]/80 border-fuchsia-500/20 text-fuchsia-100"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-pink-300">
                      {p.originalWork}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-400/30 font-semibold flex items-center gap-1">
                      {p.promptType === "alternative_ending" && <Sparkles className="w-2.5 h-2.5 text-pink-400" />}
                      {p.typeLabel}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white font-serif">{p.title}</h4>
                  <p className="text-xs text-purple-200/80 mt-1 line-clamp-2">{p.description}</p>
                </div>
                <div className="mt-3 text-[11px] font-semibold text-fuchsia-300 flex items-center justify-between">
                  <span>
                    {p.promptType === "alternative_ending"
                      ? "✨ Mở không gian Tái Thiết Câu Chuyện →"
                      : isSelected
                      ? "✓ Đang chọn kịch bản này"
                      : "Chọn kịch bản này →"}
                  </span>
                  {p.promptType === "alternative_ending" && (
                    <ArrowRight className="w-3.5 h-3.5 text-pink-400" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Workspace Area */}
      {selectedPrompt && (
        <div className="p-6 rounded-3xl bg-[#140a28]/90 border border-fuchsia-400/30 shadow-lg text-left space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-fuchsia-500/20">
            <div>
              <span className="text-[11px] font-bold text-pink-300 uppercase tracking-wider block">
                {selectedPrompt.typeLabel} — {selectedPrompt.originalWork}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white font-serif mt-0.5">
                “{selectedPrompt.title}”
              </h3>
            </div>
            <button
              onClick={handleUseStarter}
              className="text-xs px-3 py-1.5 rounded-xl bg-fuchsia-900/60 hover:bg-fuchsia-800/60 text-fuchsia-200 border border-fuchsia-400/30 flex items-center gap-1.5 cursor-pointer"
            >
              <Feather className="w-3.5 h-3.5 text-pink-400" />
              Gợi ý câu mở đầu
            </button>
          </div>

          {/* Character Anchor */}
          <div className="p-3.5 rounded-2xl bg-fuchsia-950/40 border border-fuchsia-500/30 text-xs text-fuchsia-200 flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-300 shrink-0 mt-0.5" />
            <div>
              <strong className="text-pink-300">Điểm tựa cảm xúc: </strong>
              {selectedPrompt.characterAnchor}
            </div>
          </div>

          {/* Student's Creative Canvas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span>Trang viết sáng tạo của bạn:</span>
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full border ${
                  isMinimumWordsMet
                    ? "bg-emerald-950/70 border-emerald-400 text-emerald-300"
                    : "bg-amber-950/70 border-amber-400 text-amber-300"
                }`}
              >
                {wordCount} / 50 từ tối thiểu {isMinimumWordsMet ? "✓ Đạt yêu cầu" : "(Cần thêm)"}
              </span>
            </div>

            <textarea
              rows={8}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Đặt bút và để trí tưởng tượng bay bổng cùng nhân vật (tối thiểu 50 từ)..."
              className="w-full p-4 rounded-2xl bg-[#1d0d38]/90 border border-fuchsia-400/40 text-xs sm:text-sm text-white placeholder-purple-400/50 outline-none focus:border-fuchsia-300 resize-none font-serif leading-relaxed"
            />
          </div>

          {/* Action Buttons: Co-create Advice and Archive */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            {/* Ask AI to co-create / give feedback */}
            <button
              onClick={handleRequestCoCreate}
              disabled={!customText.trim() || isAskingCoCreate}
              className="px-4 py-2.5 rounded-2xl bg-purple-900/60 hover:bg-purple-800/70 border border-purple-400/40 text-purple-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
            >
              {isAskingCoCreate ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border border-white border-t-transparent animate-spin" />
                  Komi đang đọc và chuẩn bị góp ý...
                </>
              ) : (
                <>
                  <MessageSquare className="w-3.5 h-3.5 text-pink-300" /> Nhờ AI đồng sáng tạo / góp ý
                </>
              )}
            </button>

            {/* Save into Cosmic Archive (Complete Activity) */}
            <button
              onClick={handleSaveToArchive}
              disabled={!isMinimumWordsMet || isSavingToArchive}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-400 hover:from-fuchsia-400 hover:to-rose-300 text-white font-extrabold text-xs sm:text-sm shadow-[0_4px_20px_rgba(217,70,239,0.5)] transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-40"
            >
              {isSavingToArchive ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Đang lưu vào kho lưu trữ vũ trụ...
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4 text-yellow-300" /> Lưu vào Kho Lưu Trữ Vũ Trụ
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* CO-CREATION ADVICE MODAL / CARD (Allows student to revise!) */}
      {coCreateFeedback && (
        <div className="p-6 rounded-3xl bg-gradient-to-b from-[#2a0d42]/95 to-[#1a082c]/95 border-2 border-pink-400/40 shadow-xl backdrop-blur-md animate-in slide-in-from-top-4 duration-300 text-left space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-pink-500/30">
            <h4 className="text-sm font-bold text-pink-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-300" /> Góp Ý Đồng Sáng Tạo Từ Komi
            </h4>
            <span className="text-[11px] text-pink-300/80">Bạn có thể chỉnh sửa lại đoạn văn bên trên</span>
          </div>

          <div className="space-y-2 text-xs text-fuchsia-100">
            <p>
              <strong className="text-cyan-300">Điểm độc đáo trong giọng văn: </strong>
              {coCreateFeedback.voiceHighlight}
            </p>
            <p>
              <strong className="text-pink-300">Cảm xúc truyền tải: </strong>
              {coCreateFeedback.emotionalImpact}
            </p>

            <div className="p-3 rounded-2xl bg-fuchsia-950/60 border border-fuchsia-500/20 space-y-1 mt-2">
              <span className="font-bold text-yellow-300 block">💡 Gợi ý chi tiết để đoạn văn giàu hình ảnh hơn:</span>
              <ul className="list-disc pl-4 space-y-1 text-sky-200">
                {coCreateFeedback.imagerySuggestions.map((sug, idx) => (
                  <li key={idx}>{sug}</li>
                ))}
              </ul>
            </div>

            <p className="text-emerald-300 italic pt-1">{coCreateFeedback.encouragement}</p>
          </div>
        </div>
      )}

      {/* FINAL ARCHIVE RESULT CARD */}
      {archiveResult && (
        <div className="p-6 rounded-3xl bg-gradient-to-b from-[#240a3d]/95 to-[#150726]/95 border-2 border-fuchsia-400/50 shadow-[0_16px_40px_rgba(217,70,239,0.4)] backdrop-blur-md animate-in zoom-in-95 duration-300 text-left space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-fuchsia-500/30">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-300" />
              <h3 className="text-lg font-bold text-white font-['Outfit',sans-serif]">
                Tác Phẩm Đã Được Lưu Vào Kho Lưu Trữ Vũ Trụ
              </h3>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-400/30 font-bold">
              ✨ {archiveResult.badge}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-fuchsia-950/50 border border-fuchsia-400/30">
              <span className="text-[11px] text-fuchsia-300 font-semibold block">Chỉ số Sáng tạo & Ngôn từ</span>
              <span className="text-2xl font-extrabold text-pink-300">{archiveResult.creativityScore}%</span>
            </div>
            <div className="p-3 rounded-2xl bg-purple-950/50 border border-purple-400/30">
              <span className="text-[11px] text-purple-300 font-semibold block">Tính chân xác Tâm lý</span>
              <span className="text-2xl font-extrabold text-cyan-300">{archiveResult.depthScore}%</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-fuchsia-950/30 border border-fuchsia-500/20 space-y-2">
            <h4 className="text-xs font-bold text-pink-300 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-pink-400" /> Nhận xét tổng thể:
            </h4>
            <p className="text-xs sm:text-sm text-fuchsia-100 leading-relaxed">
              {archiveResult.feedback}
            </p>
          </div>

          <div className="pt-2 text-right">
            <span className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1.5">
              <CheckCircle className="w-4 h-4" /> Đã lưu vào danh sách sáng tác & hoàn thành thử thách!
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

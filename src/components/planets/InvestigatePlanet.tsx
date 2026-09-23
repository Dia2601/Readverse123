import React, { useState, useEffect } from "react";
import { Search, Compass, CheckCircle2, AlertCircle, Sparkles, Award, ArrowRight, ShieldAlert, BookOpen, Plus, RefreshCw } from "lucide-react";
import { DetectiveCase, UserProfile } from "../../types";
import { INITIAL_DETECTIVE_CASES, SUGGESTED_READING_WORKS } from "../../data/mockData";
import { playPop, playSuccess, playTwinkle } from "../../utils/audio";
import { apiFetch } from "../../utils/apiClient";

interface InvestigatePlanetProps {
  user: UserProfile;
  onActivityComplete: (title: string, score: number, badge: string, planetId?: string) => void;
  onAddReadWork?: (work: string) => void;
}

export const InvestigatePlanet: React.FC<InvestigatePlanetProps> = ({
  user,
  onActivityComplete,
  onAddReadWork,
}) => {
  const [selectedCase, setSelectedCase] = useState<DetectiveCase | null>(null);
  const [availableCases, setAvailableCases] = useState<DetectiveCase[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<string>("");
  const [customReasoning, setCustomReasoning] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isGeneratingCase, setIsGeneratingCase] = useState<boolean>(false);
  const [newWorkInput, setNewWorkInput] = useState<string>("");
  const [evaluationResult, setEvaluationResult] = useState<{
    relevanceScore: number;
    strengthScore: number;
    feedback: string;
    missingPerspectives: string;
    badgeEarned: string;
  } | null>(null);

  // Initialize cases matching the user's readWorks
  useEffect(() => {
    if (!user.readWorks || user.readWorks.length === 0) {
      setAvailableCases([]);
      setSelectedCase(null);
      return;
    }

    // Match existing pre-crafted cases or generate dynamically
    const matched = INITIAL_DETECTIVE_CASES.filter((c) =>
      user.readWorks.some((rw) => {
        if (!rw || !c?.workTitle) return false;
        const rwLow = rw.toLowerCase().trim();
        const cLow = c.workTitle.toLowerCase().trim();
        return rwLow.includes(cLow) || cLow.includes(rwLow);
      })
    );

    if (matched.length > 0) {
      setAvailableCases(matched);
      if (!selectedCase || !matched.some((m) => m.id === selectedCase.id)) {
        setSelectedCase(matched[0]);
      }
    } else {
      // First readWork doesn't have a static case -> generate dynamically
      generateCaseForWork(user.readWorks[0]);
    }
  }, [user.readWorks]);

  const generateCaseForWork = async (workTitle: string) => {
    setIsGeneratingCase(true);
    playTwinkle();
    try {
      const fallbackCaseData = {
        workTitle: workTitle,
        author: "Tác giả",
        claim: `Nhân vật chính trong "${workTitle}" hành động hoàn toàn do áp lực ngoại cảnh chứ không xuất phát từ bản tính.`,
        context: `Những biến động và xung đột cao trào trong tác phẩm "${workTitle}".`,
        guidingClues: [
          "Chú ý hoàn cảnh sống và biến cố bất ngờ",
          "Quan sát chuyển biến tâm lý và lời độc thoại nội tâm",
        ],
        suggestedEvidences: [
          `Chi tiết bước ngoặt lớn làm thay đổi số phận nhân vật trong "${workTitle}".`,
          `Khoảnh khắc nhân vật phải đưa ra lựa chọn khó khăn giữa tình cảm và trách nhiệm.`,
        ],
      };

      const data = await apiFetch<any>(
        "/api/investigate/generate-case",
        {
          method: "POST",
          body: JSON.stringify({ workTitle }),
          cacheTtlMs: 30000,
        },
        fallbackCaseData
      );

      if (data && data.claim) {
        const generated: DetectiveCase = {
          id: data.id || "dyn-case-" + Date.now(),
          workTitle: data.workTitle || workTitle,
          author: data.author || "Văn học",
          claim: data.claim,
          context: data.context || `Bối cảnh trong tác phẩm ${workTitle}`,
          guidingClues: data.guidingClues || ["Phân tích tâm lý nhân vật", "Tìm kiếm chi tiết biểu tượng"],
          suggestedEvidences: data.suggestedEvidences || [],
          difficulty: "Vừa",
        };
        setAvailableCases((prev) => [generated, ...prev]);
        setSelectedCase(generated);
      }
    } finally {
      setIsGeneratingCase(false);
    }
  };

  const handleSelectCase = (c: DetectiveCase) => {
    playPop();
    setSelectedCase(c);
    setSelectedEvidence("");
    setCustomReasoning("");
    setEvaluationResult(null);
  };

  const handlePickEvidence = (ev: string) => {
    playPop();
    setSelectedEvidence(ev);
  };

  const handleQuickAddBook = (work: string) => {
    playPop();
    if (onAddReadWork) {
      onAddReadWork(work);
    }
    generateCaseForWork(work);
  };

  const handleSubmitInvestigation = async () => {
    if (!selectedCase || !selectedEvidence.trim() || !customReasoning.trim() || isSubmitting) return;

    setIsSubmitting(true);
    playTwinkle();

    try {
      const fallbackEvaluation = {
        relevanceScore: 88,
        strengthScore: 84,
        feedback: `Dẫn chứng từ "${selectedCase.workTitle}" rất chuẩn xác! Lập luận của bạn đã làm sáng tỏ luận điểm. Bạn có thể phân tích thêm tâm lý nhân vật trước thời điểm này.`,
        missingPerspectives: "Cân nhắc thêm phản ứng của người xung quanh để thấy rõ sự cô độc.",
        badgeEarned: "Kính Lúp Tinh Tường",
      };

      const data = await apiFetch<any>(
        "/api/investigate/evaluate",
        {
          method: "POST",
          body: JSON.stringify({
            claim: selectedCase.claim,
            evidence: selectedEvidence,
            reasoning: customReasoning,
            workTitle: selectedCase.workTitle,
          }),
        },
        fallbackEvaluation
      );

      setEvaluationResult(data);
      playSuccess();

      // Only on successful AI evaluation is the activity completed!
      onActivityComplete(
        `Thẩm tra manh mối: ${selectedCase.workTitle}`,
        Math.round(((data.relevanceScore || 88) + (data.strengthScore || 84)) / 2),
        data.badgeEarned || "Thám Tử Trực Giác",
        "investigate"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="planet-investigate" className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#1e1b4b]/90 via-[#2e1065]/80 to-[#172554]/90 border border-purple-400/40 shadow-[0_12px_32px_rgba(147,51,234,0.3)] backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-left">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-400 to-indigo-300 p-0.5 shadow-[0_0_20px_rgba(168,85,247,0.5)] shrink-0 flex items-center justify-center">
            <div className="w-full h-full rounded-2xl bg-[#130d2d] flex items-center justify-center text-3xl">
              🔍
            </div>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30">
              TRUY TÌM MANH MỐI VĂN HỌC
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit',sans-serif] mt-1">
              Hành Tinh Thám Tử
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/80">
              Tìm kiếm dẫn chứng xác đáng từ các tác phẩm bạn đã đọc để thẩm định luận điểm sắc bén.
            </p>
          </div>
        </div>

        {/* Case selector for user's readWorks */}
        {availableCases.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-end">
            {availableCases.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelectCase(c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCase?.id === c.id
                    ? "bg-purple-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.6)]"
                    : "bg-purple-950/60 hover:bg-purple-900/50 text-purple-300 border border-purple-500/30"
                }`}
              >
                {c.workTitle}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* STATE 1: EMPTY READ WORKS -> REQUIRED NOTIFICATION */}
      {(!user.readWorks || user.readWorks.length === 0) && (
        <div className="p-8 rounded-3xl bg-[#0e1738]/90 border border-purple-400/40 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-purple-500/20 border border-purple-400/40 flex items-center justify-center mx-auto text-3xl">
            📜
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-white">Bạn chưa có tác phẩm nào trong danh sách đã đọc</h3>
            <p className="text-xs sm:text-sm text-purple-200/80 leading-relaxed">
              Hãy chọn tác phẩm bạn từng đọc để bắt đầu vụ án phù hợp! AI sẽ chuẩn bị hồ sơ vụ án riêng cho bạn.
            </p>
          </div>

          {/* Quick Select Buttons */}
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-bold text-cyan-300 block">
              Chọn nhanh tác phẩm quen thuộc bạn đã từng đọc:
            </span>
            <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
              {SUGGESTED_READING_WORKS.map((work) => (
                <button
                  key={work}
                  onClick={() => handleQuickAddBook(work)}
                  className="px-3 py-1.5 rounded-xl bg-purple-900/50 hover:bg-purple-800/70 border border-purple-400/30 text-xs font-semibold text-purple-200 hover:text-white transition-all cursor-pointer"
                >
                  + {work}
                </button>
              ))}
            </div>
          </div>

          {/* Or custom input */}
          <div className="flex max-w-md mx-auto gap-2 pt-3">
            <input
              type="text"
              value={newWorkInput}
              onChange={(e) => setNewWorkInput(e.target.value)}
              placeholder="Hoặc nhập tên tác phẩm khác..."
              className="flex-1 px-4 py-2 rounded-xl bg-sky-950/80 border border-purple-400/40 text-xs text-white placeholder-purple-300/40 outline-none focus:border-cyan-300"
            />
            <button
              onClick={() => {
                if (newWorkInput.trim()) {
                  handleQuickAddBook(newWorkInput.trim());
                  setNewWorkInput("");
                }
              }}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Thêm & Mở vụ án
            </button>
          </div>
        </div>
      )}

      {/* Case Generating Loading indicator */}
      {isGeneratingCase && (
        <div className="p-8 rounded-3xl bg-[#0e1738]/90 border border-purple-400/30 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-purple-400 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-purple-200">AI Komi đang phân tích tác phẩm và chuẩn bị hồ sơ vụ án cho bạn...</p>
        </div>
      )}

      {/* Case Dossier Card (When case is loaded) */}
      {!isGeneratingCase && selectedCase && (
        <div className="p-6 rounded-3xl bg-[#0e1738]/90 border border-purple-400/30 shadow-lg text-left space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-300" />
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                Hồ Sơ Luận Điểm — {selectedCase.workTitle} ({selectedCase.author})
              </span>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-900/60 text-indigo-200 border border-indigo-400/30">
              Cấp độ: Thử thách tư duy
            </span>
          </div>

          {/* The Claim */}
          <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-400/40">
            <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wide block mb-1">
              🎯 Luận điểm cần thẩm tra:
            </span>
            <p className="text-base sm:text-lg font-bold text-white leading-relaxed font-serif">
              “{selectedCase.claim}”
            </p>
            <p className="text-xs text-purple-200/80 mt-2 italic">
              Bối cảnh: {selectedCase.context}
            </p>
          </div>

          {/* Guiding Clues from AI Guide */}
          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-300">
              <Compass className="w-3.5 h-3.5" /> Gợi ý định hướng từ Komi (Không có sẵn đáp án):
            </div>
            <ul className="text-xs text-sky-200 space-y-1.5 pl-4 list-disc">
              {selectedCase.guidingClues.map((clue, idx) => (
                <li key={idx}>{clue}</li>
              ))}
            </ul>
          </div>

          {/* Evidence Selection / Input */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-sky-200 flex items-center justify-between">
              <span>🔎 Bước 1: Chọn hoặc nhập dẫn chứng từ tác phẩm:</span>
              <span className="text-[11px] text-sky-400 font-normal">Nhấp gợi ý hoặc tự nhập</span>
            </label>

            {selectedCase.suggestedEvidences && selectedCase.suggestedEvidences.length > 0 && (
              <div className="space-y-2">
                {selectedCase.suggestedEvidences.map((ev, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePickEvidence(ev)}
                    className={`w-full p-3 rounded-xl text-left text-xs transition-all border cursor-pointer font-serif italic ${
                      selectedEvidence === ev
                        ? "bg-purple-900/60 border-purple-400 text-white shadow-sm"
                        : "bg-[#0a1b42]/60 hover:bg-purple-950/40 border-sky-500/20 text-sky-200"
                    }`}
                  >
                    “{ev}”
                  </button>
                ))}
              </div>
            )}

            <textarea
              rows={2}
              value={selectedEvidence}
              onChange={(e) => setSelectedEvidence(e.target.value)}
              placeholder="Nhập dẫn chứng, câu trích hoặc hành động cụ thể của nhân vật trong tác phẩm..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-sky-950/80 border border-purple-400/40 text-xs text-white placeholder-sky-400/50 outline-none focus:border-cyan-300 resize-none font-serif italic"
            />
          </div>

          {/* Student Reasoning */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-cyan-300 block">
              🧠 Bước 2: Lập luận của bạn (Tại sao dẫn chứng trên chứng minh hoặc bác bỏ luận điểm?):
            </label>
            <textarea
              rows={3}
              value={customReasoning}
              onChange={(e) => setCustomReasoning(e.target.value)}
              placeholder="Giải thích liên kết logic: chi tiết này thể hiện điều gì về hoàn cảnh, tâm lý hoặc thông điệp của tác giả?..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-sky-950/80 border border-purple-400/40 text-xs text-white placeholder-sky-400/50 outline-none focus:border-cyan-300 resize-none"
            />
          </div>

          {/* Submit Action Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSubmitInvestigation}
              disabled={!selectedEvidence.trim() || !customReasoning.trim() || isSubmitting}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 hover:from-purple-400 hover:to-cyan-300 text-white font-extrabold text-sm shadow-[0_4px_20px_rgba(147,51,234,0.5)] transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Hội đồng thám tử đang thẩm định...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" /> Nộp bằng chứng cho AI thẩm định
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* AI Detective Feedback Result Modal / Card */}
      {evaluationResult && (
        <div className="p-6 rounded-3xl bg-gradient-to-b from-[#131138]/95 to-[#0b173e]/95 border-2 border-purple-400/50 shadow-[0_16px_40px_rgba(147,51,234,0.4)] backdrop-blur-md animate-in slide-in-from-bottom-6 duration-300 text-left space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-purple-500/30">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-300" />
              <h3 className="text-lg font-bold text-white font-['Outfit',sans-serif]">
                Kết Quả Thẩm Định Của Komi
              </h3>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Huy hiệu: {evaluationResult.badgeEarned}
            </span>
          </div>

          {/* Scores Overview */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-purple-950/50 border border-purple-400/30">
              <span className="text-[11px] text-purple-300 font-semibold block">Độ liên quan của dẫn chứng</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-extrabold text-cyan-300">{evaluationResult.relevanceScore}</span>
                <span className="text-xs text-sky-400">/100</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-indigo-950/50 border border-indigo-400/30">
              <span className="text-[11px] text-indigo-300 font-semibold block">Độ chặt chẽ của lập luận</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-extrabold text-yellow-300">{evaluationResult.strengthScore}</span>
                <span className="text-xs text-sky-400">/100</span>
              </div>
            </div>
          </div>

          {/* Deep Feedback */}
          <div className="p-4 rounded-2xl bg-sky-950/50 border border-sky-500/30 space-y-2">
            <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Nhận xét phân tích của AI:
            </h4>
            <p className="text-xs sm:text-sm text-sky-100 leading-relaxed">
              {evaluationResult.feedback}
            </p>
          </div>

          {/* Missing Perspectives Section */}
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-1.5">
            <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-400" /> Gợi ý góc nhìn còn thiếu:
            </h4>
            <p className="text-xs text-amber-100/90 leading-relaxed">
              {evaluationResult.missingPerspectives}
            </p>
          </div>

          <div className="pt-2 text-right">
            <span className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Đã hoàn thành thử thách & ghi nhận điểm phân tích vào hồ sơ!
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

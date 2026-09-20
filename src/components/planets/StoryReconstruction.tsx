import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Feather,
  ArrowLeft,
  Lightbulb,
  CheckCircle2,
  Lock,
  Globe2,
  GitBranch,
  Plus,
  RotateCcw,
  Save,
  Compass,
  AlertTriangle,
  HelpCircle,
  BookOpen,
  Send,
  MessageSquare,
  ChevronRight,
  ShieldCheck,
  Star,
} from "lucide-react";
import {
  UserProfile,
  StoryBranchNode,
  CreativePerspective,
  AIStoryPartnerAdvice,
} from "../../types";
import { getCanonicalWork, CanonicalWorkMetadata } from "../../data/canonicalWorksData";
import { syncPerspectiveToServer, saveLocalPerspective } from "../../utils/perspectiveManager";
import { playPop, playSuccess, playTwinkle, playWarp } from "../../utils/audio";

interface StoryReconstructionProps {
  user?: UserProfile;
  currentUser?: UserProfile;
  workTitle: string;
  initialPromptHint?: string;
  onBack: () => void;
  onActivityComplete?: (title: string, score: number, badge: string, planetId?: string) => void;
  onViewPublishedPerspective?: (perspective: CreativePerspective) => void;
  onNavigateToQuotesPlanet?: () => void;
}

export const StoryReconstruction: React.FC<StoryReconstructionProps> = ({
  user,
  currentUser,
  workTitle,
  initialPromptHint,
  onBack,
  onActivityComplete,
  onViewPublishedPerspective,
  onNavigateToQuotesPlanet,
}) => {
  const activeUser = currentUser || user || {
    id: "guest",
    name: "Phi hành gia",
    avatar: "🚀",
    readingStyle: "Độc giả sáng tạo",
    interests: [],
    readWorks: [],
    workItems: [],
    starsCount: 0,
    stats: { analysis: 50, multiPerspective: 50, criticalReasoning: 50, connection: 50, creativity: 50 },
    completedActivities: [],
    badges: [],
  };
  const canonicalData: CanonicalWorkMetadata = getCanonicalWork(workTitle);

  // Selected Turning Point
  const [selectedTurningPoint, setSelectedTurningPoint] = useState(
    canonicalData.suggestedTurningPoints[0]?.description ||
      `Tại thời điểm quyết định trong "${canonicalData.title}", nhân vật lựa chọn một hướng đi khác.`
  );
  const [customTurningPoint, setCustomTurningPoint] = useState("");
  const [isEditingTurningPoint, setIsEditingTurningPoint] = useState(false);

  // Draft text in current writing area
  const [currentIdeaDraft, setCurrentIdeaDraft] = useState(initialPromptHint || "");

  // Story Branches tree
  const [branches, setBranches] = useState<StoryBranchNode[]>([
    {
      id: "node-orig-0",
      stepType: "original_plot",
      stepTitle: "CỐT TRUYỆN GỐC",
      content: canonicalData.originalSituationSummary,
    },
    {
      id: "node-tp-1",
      stepType: "turning_point",
      stepTitle: "ĐIỂM RẼ",
      content: selectedTurningPoint,
    },
  ]);

  // AI Story Partner state
  const [isConsultingAI, setIsConsultingAI] = useState(false);
  const [aiPartnerAdvice, setAiPartnerAdvice] = useState<AIStoryPartnerAdvice | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Finish modal & publishing state
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [perspectiveTitle, setPerspectiveTitle] = useState(`Khúc rẽ nhân văn cho "${canonicalData.title}"`);
  const [introduction, setIntroduction] = useState("");
  const [themeTag, setThemeTag] = useState(canonicalData.themes[0] || "Tự do & Lương thiện");
  const [creatorDisplayName, setCreatorDisplayName] = useState(activeUser.name || "Nhà Thám Hiểm Trẻ");
  const [visibilityChoice, setVisibilityChoice] = useState<"private" | "public">("private");
  const [isPublishing, setIsPublishing] = useState(false);
  const [safetyWarning, setSafetyWarning] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Sync turning point into tree when updated
  useEffect(() => {
    setBranches((prev) =>
      prev.map((b) => (b.stepType === "turning_point" ? { ...b, content: selectedTurningPoint } : b))
    );
  }, [selectedTurningPoint]);

  // Handle Asking AI Story Partner
  const handleConsultAIStoryPartner = async () => {
    if (!currentIdeaDraft.trim() || isConsultingAI) return;
    setIsConsultingAI(true);
    setAiError(null);
    playTwinkle();

    try {
      const res = await fetch("/api/create/story-partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalWork: canonicalData.title,
          author: canonicalData.author,
          characters: canonicalData.characters,
          context: canonicalData.context,
          turningPoint: selectedTurningPoint,
          originalSituationSummary: canonicalData.originalSituationSummary,
          storyBranches: branches,
          userDraft: currentIdeaDraft,
        }),
      });

      if (!res.ok) throw new Error("Phản hồi AI không thành công");
      const data: AIStoryPartnerAdvice = await res.json();
      setAiPartnerAdvice(data);
      playSuccess();
    } catch (err) {
      console.warn("AI Story Partner fallback:", err);
      setAiError("Đường truyền với trạm AI Komi gián đoạn tạm thời. Bạn vẫn có thể tiếp tục viết và lưu câu chuyện tự do!");
      setAiPartnerAdvice({
        ideaOpens: `Ý tưởng của bạn mở ra một chân trời mới cho nhân vật trong "${canonicalData.title}": biến đổi sự cam chịu thành hành động tự cứu lấy phẩm giá.`,
        rationalPoints: [
          `Tính cách của nhân vật vốn giàu tình thương và lòng tự trọng sâu kín.`,
          `Bước ngoặt logic và giàu sức gợi đối với hoàn cảnh đương thời.`,
        ],
        considerations: [
          `Cần chú ý định kiến giai cấp và áp lực xã hội thời điểm đó.`,
          `Tạo chuyển biến tâm lý từng nấc để giữ được chất chân thực.`,
        ],
        growthSuggestions: [
          `Viết một câu đối thoại then chốt giữa hai nhân vật khi sự việc đảo chiều.`,
          `Mô tả một chi tiết ngoại cảnh (ngọn lửa, ánh trăng, gió lạnh) đồng điệu với nội tâm.`,
        ],
        openQuestions: [
          `Nhân vật sẽ đối diện với sự ngỡ ngàng của những người xung quanh ra sao?`,
          `Bài học sâu sắc nhất mà bạn muốn gửi gắm qua kết cục này là gì?`,
        ],
      });
      playSuccess();
    } finally {
      setIsConsultingAI(false);
    }
  };

  // Add current idea as a new step in the branch
  const handleCommitStepToTree = (stepType: "user_choice" | "new_development" | "climax_ending") => {
    if (!currentIdeaDraft.trim()) return;
    playPop();

    const stepTitleMap = {
      user_choice: "LỰA CHỌN CỦA BẠN",
      new_development: "DIỄN BIẾN MỚI",
      climax_ending: "KẾT CỤC TÁI THIẾT",
    };

    const newNode: StoryBranchNode = {
      id: `node-${Date.now()}`,
      stepType,
      stepTitle: stepTitleMap[stepType],
      content: currentIdeaDraft.trim(),
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };

    setBranches((prev) => [...prev, newNode]);
    setCurrentIdeaDraft("");
    setSaveSuccessMessage("Đã thêm một bước tiến vào Cây Cốt Truyện!");
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  // Undo last step
  const handleUndoStep = () => {
    // Only undo user-added nodes (keep original_plot and turning_point)
    if (branches.length <= 2) return;
    playPop();
    const removed = branches[branches.length - 1];
    setBranches((prev) => prev.slice(0, prev.length - 1));
    // Restore text to editor so user doesn't lose it
    if (!currentIdeaDraft.trim()) {
      setCurrentIdeaDraft(removed.content);
    }
  };

  // Save current progress as draft
  const handleSaveDraft = () => {
    playPop();
    const fullContent = branches
      .filter((b) => b.stepType !== "original_plot")
      .map((b) => `[${b.stepTitle}]\n${b.content}`)
      .join("\n\n") + (currentIdeaDraft ? `\n\n[Ý TƯỞNG ĐANG VIẾT]\n${currentIdeaDraft}` : "");

    const draftItem: CreativePerspective = {
      id: `persp-draft-${canonicalData.id}-${Date.now()}`,
      authorId: activeUser.id || "user-local",
      displayName: creatorDisplayName,
      originalWorkId: canonicalData.id,
      originalWorkTitle: canonicalData.title,
      originalWorkAuthor: canonicalData.author,
      characters: canonicalData.characters,
      context: canonicalData.context,
      turningPoint: selectedTurningPoint,
      originalSituationSummary: canonicalData.originalSituationSummary,
      title: perspectiveTitle || `Bản thảo: ${canonicalData.title}`,
      introduction: introduction || `Hướng phát triển giả định cho "${canonicalData.title}"`,
      creativeContent: fullContent,
      storyBranches: branches,
      themes: [themeTag],
      visibility: "private",
      createdAt: new Date().toISOString(),
      empathyCount: 0,
      comments: [],
      aiPartnerAdvice: aiPartnerAdvice || undefined,
    };

    saveLocalPerspective(draftItem);
    setSaveSuccessMessage("Đã lưu bản sáng tạo vào bộ nhớ cục bộ an toàn!");
    setTimeout(() => setSaveSuccessMessage(null), 3500);
  };

  // Open Finish Modal
  const handleOpenFinishModal = () => {
    playTwinkle();
    if (!introduction.trim()) {
      setIntroduction(`Một góc nhìn tái tưởng tượng khi nhân vật trong "${canonicalData.title}" đứng trước ngã rẽ.`);
    }
    setSafetyWarning(null);
    setIsFinishModalOpen(true);
  };

  // Confirm Complete & Publish / Save
  const handleConfirmFinish = async () => {
    setIsPublishing(true);
    setSafetyWarning(null);

    // Combine all user content
    const compiledContent = branches
      .filter((b) => b.stepType !== "original_plot")
      .map((b) => `[${b.stepTitle}]\n${b.content}`)
      .join("\n\n") + (currentIdeaDraft.trim() ? `\n\n[ĐOẠN KẾT]\n${currentIdeaDraft.trim()}` : "");

    // If publishing publicly, run AI Safety Check (Section XVI)
    if (visibilityChoice === "public") {
      try {
        const safetyRes = await fetch("/api/create/safety-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: perspectiveTitle,
            creativeContent: compiledContent,
            originalWork: canonicalData.title,
          }),
        });

        if (safetyRes.ok) {
          const safetyData = await safetyRes.json();
          if (!safetyData.isSafe) {
            setSafetyWarning(safetyData.warning || "Bản sáng tạo cần được chỉnh sửa trước khi công khai.");
            setIsPublishing(false);
            return;
          }
        }
      } catch (e) {
        console.warn("Safety check check bypassed gracefully:", e);
      }
    }

    const finalPerspective: CreativePerspective = {
      id: `persp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      authorId: activeUser.id || "user-local",
      displayName: (creatorDisplayName || activeUser.name || "Bạn đọc").trim(),
      originalWorkId: canonicalData.id,
      originalWorkTitle: canonicalData.title,
      originalWorkAuthor: canonicalData.author,
      characters: canonicalData.characters,
      context: canonicalData.context,
      turningPoint: selectedTurningPoint,
      originalSituationSummary: canonicalData.originalSituationSummary,
      title: perspectiveTitle.trim() || `Tái thiết "${canonicalData.title}"`,
      introduction: introduction.trim(),
      creativeContent: compiledContent,
      storyBranches: branches,
      themes: [themeTag],
      visibility: visibilityChoice,
      createdAt: new Date().toISOString(),
      empathyCount: 0,
      comments: [],
      aiPartnerAdvice: aiPartnerAdvice || undefined,
    };

    try {
      const synced = await syncPerspectiveToServer(finalPerspective);
      playSuccess();

      // Complete activity in user profile (+25 score, badge)
      if (onActivityComplete) {
        onActivityComplete(
          `Tái thiết câu chuyện: ${canonicalData.title}`,
          96,
          "Ngôi Sao Sáng Tạo",
          "create"
        );
      }

      setIsFinishModalOpen(false);
      setIsPublishing(false);

      if (visibilityChoice === "public") {
        if (onViewPublishedPerspective) {
          onViewPublishedPerspective(synced);
        } else if (onNavigateToQuotesPlanet) {
          onNavigateToQuotesPlanet();
        } else {
          onBack();
        }
      } else {
        setSaveSuccessMessage("Đã lưu riêng tư thành công vào kho lưu trữ cá nhân!");
        setTimeout(() => {
          onBack();
        }, 1200);
      }
    } catch (e) {
      console.error("Save error:", e);
      setIsPublishing(false);
    }
  };

  return (
    <div id="story-reconstruction-page" className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          id="reconstruct-back-btn"
          onClick={() => {
            playPop();
            onBack();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-sky-950/70 hover:bg-sky-900/90 border border-sky-400/30 text-sky-200 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-pink-400" />
          <span>Về Hành Tinh Sáng Tạo</span>
        </button>

        {saveSuccessMessage && (
          <div className="px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-400/50 text-emerald-300 text-xs font-medium flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {saveSuccessMessage}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            id="reconstruct-save-draft-btn"
            onClick={handleSaveDraft}
            className="px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-400/30 text-purple-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all"
            title="Lưu tiến trình vào máy"
          >
            <Save className="w-3.5 h-3.5 text-purple-300" />
            Lưu nháp
          </button>
        </div>
      </div>

      {/* Main Cosmic Header Section */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#2e0854]/95 via-[#3b126b]/90 to-[#19154a]/95 border border-fuchsia-400/40 shadow-[0_12px_36px_rgba(217,70,239,0.3)] backdrop-blur-md text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-pink-300 px-3 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/30 inline-flex items-center gap-1">
                ✦ TÁI THIẾT CÂU CHUYỆN
              </span>
              <span className="text-xs text-fuchsia-300 font-medium">
                {canonicalData.periodOrCategory}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-['Outfit',sans-serif] tracking-tight">
              “{canonicalData.title}”
            </h1>
            <p className="text-sm sm:text-base text-fuchsia-100/90 font-light leading-relaxed">
              Bạn sẽ thay đổi một lựa chọn trong câu chuyện và khám phá một con đường chưa từng được kể.
            </p>
          </div>

          {/* Book Card Badge */}
          <div className="shrink-0 p-4 rounded-2xl bg-black/30 border border-fuchsia-400/30 backdrop-blur-sm space-y-1 text-xs text-left min-w-[200px]">
            <div className="text-[10px] uppercase font-bold text-fuchsia-300/80">Tác giả nguyên tác</div>
            <div className="text-sm font-bold text-white font-serif">{canonicalData.author}</div>
            <div className="pt-1.5 border-t border-fuchsia-500/20 text-[11px] text-fuchsia-200/90">
              <span className="font-semibold text-pink-300">Nhân vật: </span>
              {canonicalData.characters.slice(0, 3).join(", ")}
              {canonicalData.characters.length > 3 ? "..." : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Metadata & Turning Point Information Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
        {/* Box 1: Bối cảnh & Tình huống gốc */}
        <div className="p-5 rounded-3xl bg-[#130b29]/90 border border-fuchsia-500/25 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-fuchsia-300 uppercase tracking-wider">
            <BookOpen className="w-4 h-4 text-pink-400" />
            📖 TÌNH HUỐNG NGUYÊN TÁC
          </div>
          <p className="text-xs text-sky-100/80 leading-relaxed font-serif">
            {canonicalData.originalSituationSummary}
          </p>
          <div className="pt-2 border-t border-fuchsia-500/20 text-[11px] text-purple-200/70">
            <strong className="text-purple-300">Bối cảnh: </strong> {canonicalData.context}
          </div>
        </div>

        {/* Box 2: Điểm rẽ được chọn (The Turning Fork) */}
        <div className="md:col-span-2 p-5 rounded-3xl bg-[#170a36]/90 border border-pink-400/40 shadow-md space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-pink-300 uppercase tracking-wider">
                <GitBranch className="w-4 h-4 text-pink-400" />
                ✦ ĐIỂM RẼ ĐƯỢC CHỌN
              </span>
              <button
                onClick={() => setIsEditingTurningPoint(!isEditingTurningPoint)}
                className="text-[11px] text-fuchsia-300 hover:text-white underline cursor-pointer"
              >
                {isEditingTurningPoint ? "Ẩn danh sách gợi ý" : "Đổi điểm rẽ khác ▾"}
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-950/40 to-purple-950/40 border border-pink-400/30 text-xs sm:text-sm text-pink-100 font-medium leading-relaxed font-serif">
              “{selectedTurningPoint}”
            </div>
          </div>

          {/* Quick choices dropdown/selector if open */}
          {isEditingTurningPoint && (
            <div className="space-y-2 pt-2 border-t border-pink-500/20 animate-in fade-in">
              <div className="text-[11px] font-semibold text-fuchsia-200">
                Chọn một điểm rẽ gợi ý từ READVERSE:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {canonicalData.suggestedTurningPoints.map((tp) => (
                  <button
                    key={tp.id}
                    onClick={() => {
                      playPop();
                      setSelectedTurningPoint(tp.description);
                      setIsEditingTurningPoint(false);
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      selectedTurningPoint === tp.description
                        ? "bg-pink-900/60 border-pink-400 text-white font-semibold"
                        : "bg-black/30 hover:bg-white/5 border-pink-500/20 text-fuchsia-200"
                    }`}
                  >
                    <div className="font-bold text-pink-300 text-[11px]">{tp.label}</div>
                    <div className="text-[10px] text-fuchsia-100/70 mt-0.5 line-clamp-2">
                      {tp.description}
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={customTurningPoint}
                  onChange={(e) => setCustomTurningPoint(e.target.value)}
                  placeholder="Hoặc tự đặt ra một điểm rẽ hoàn toàn mới..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-black/40 border border-pink-500/30 text-xs text-white placeholder-pink-300/40 outline-none"
                />
                <button
                  onClick={() => {
                    if (customTurningPoint.trim()) {
                      setSelectedTurningPoint(customTurningPoint.trim());
                      setCustomTurningPoint("");
                      setIsEditingTurningPoint(false);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* STORY BRANCH — CÂY CỐT TRUYỆN TRỰC QUAN (Section VI) */}
      <div className="p-6 rounded-3xl bg-[#11072b]/95 border border-fuchsia-500/30 shadow-xl text-left space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-fuchsia-500/20 flex items-center justify-center text-pink-300 font-bold">
              🌿
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-['Outfit',sans-serif]">
                Cây Cốt Truyện & Nhánh Phát Triển
              </h3>
              <p className="text-[11px] text-fuchsia-200/70">
                Mỗi lựa chọn mới của bạn mở ra một nhánh tương lai độc đáo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {branches.length > 2 && (
              <button
                id="undo-step-btn"
                onClick={handleUndoStep}
                className="px-3 py-1.5 rounded-xl bg-fuchsia-950/70 hover:bg-fuchsia-900 border border-fuchsia-400/30 text-fuchsia-200 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                title="Quay lại nhánh trước"
              >
                <RotateCcw className="w-3.5 h-3.5 text-pink-300" />
                ↩ Quay lại nhánh trước
              </button>
            )}
          </div>
        </div>

        {/* Tree Visual Flow Diagram */}
        <div className="relative p-4 rounded-2xl bg-[#09031a]/80 border border-fuchsia-500/20 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max pb-1">
            {branches.map((node, idx) => {
              const isOrig = node.stepType === "original_plot";
              const isTP = node.stepType === "turning_point";
              const isLast = idx === branches.length - 1;

              return (
                <React.Fragment key={node.id}>
                  <div
                    className={`p-3.5 rounded-2xl border max-w-xs transition-all relative ${
                      isOrig
                        ? "bg-slate-900/90 border-slate-700 text-slate-200"
                        : isTP
                        ? "bg-purple-950/90 border-purple-400 text-purple-100 shadow-[0_0_15px_rgba(168,85,247,0.25)]"
                        : "bg-gradient-to-br from-pink-950/90 to-fuchsia-950/90 border-pink-400 text-pink-50 shadow-[0_0_15px_rgba(244,114,182,0.3)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-pink-300">
                        {isOrig ? "📖 CỐT TRUYỆN GỐC" : isTP ? "✦ ĐIỂM RẼ" : `🌱 ${node.stepTitle}`}
                      </span>
                      {node.timestamp && (
                        <span className="text-[9px] text-fuchsia-300/60 font-mono">
                          {node.timestamp}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/90 font-serif leading-relaxed line-clamp-3">
                      {node.content}
                    </p>
                  </div>

                  {!isLast && (
                    <div className="flex items-center text-pink-400/60 px-1 shrink-0">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* WORKSPACE: KHU VỰC NHẬP LIỆU CHÍNH (Section III & IV) */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#150a30]/95 border border-fuchsia-400/40 shadow-2xl text-left space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-fuchsia-500/20 flex-wrap gap-2">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-pink-300 block">
              KHÔNG GIAN SÁNG TẠO ĐỘC LẬP
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white font-['Outfit',sans-serif] mt-0.5 flex items-center gap-2">
              <span>✍️</span> Ý TƯỞNG CỦA BẠN
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-fuchsia-200/70">
              {currentIdeaDraft.trim() ? currentIdeaDraft.trim().split(/\s+/).length : 0} từ
            </span>
          </div>
        </div>

        {/* Text Input Area */}
        <div className="space-y-2">
          <textarea
            id="creative-idea-input"
            rows={7}
            value={currentIdeaDraft}
            onChange={(e) => setCurrentIdeaDraft(e.target.value)}
            placeholder="Nếu câu chuyện rẽ sang một hướng khác, bạn muốn điều gì xảy ra? Hãy viết một ý tưởng, một lựa chọn khác, một đoạn diễn biến hay một cái kết mới..."
            className="w-full p-4 sm:p-5 rounded-2xl bg-[#0b031d]/90 border border-fuchsia-400/40 text-sm sm:text-base text-white placeholder-purple-300/40 outline-none focus:border-pink-300 resize-none font-serif leading-relaxed shadow-inner"
          />
          <p className="text-[11px] text-fuchsia-300/60 italic">
            * Bạn là người sáng tạo. Hãy tự do thể hiện suy nghĩ chân thực, không có đáp án đúng sai.
          </p>
        </div>

        {/* Main Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Button: ✨ Cùng AI phát triển */}
          <button
            id="consult-ai-partner-btn"
            onClick={handleConsultAIStoryPartner}
            disabled={!currentIdeaDraft.trim() || isConsultingAI}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-600 to-fuchsia-700 hover:from-purple-600 hover:to-fuchsia-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-900/40 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-40"
          >
            {isConsultingAI ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>AI đang cùng bạn suy ngẫm...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-pink-300" />
                <span>✨ Cùng AI phát triển</span>
              </>
            )}
          </button>

          {/* Branch Step Commit Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleCommitStepToTree("user_choice")}
              disabled={!currentIdeaDraft.trim()}
              className="px-3.5 py-2 rounded-xl bg-pink-950/70 hover:bg-pink-900/90 border border-pink-400/40 text-pink-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-30"
              title="Thêm ý tưởng này làm nhánh lựa chọn mới"
            >
              <Plus className="w-3.5 h-3.5" />
              ＋ Thêm vào nhánh
            </button>

            <button
              onClick={() => handleCommitStepToTree("climax_ending")}
              disabled={!currentIdeaDraft.trim()}
              className="px-3.5 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800/80 border border-purple-400/40 text-purple-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-30"
              title="Đặt đoạn này làm đoạn kết của câu chuyện"
            >
              <Feather className="w-3.5 h-3.5 text-pink-300" />
              Đặt làm kết cục
            </button>

            {/* Complete Story Button */}
            <button
              id="finish-story-btn"
              onClick={handleOpenFinishModal}
              disabled={branches.length <= 2 && !currentIdeaDraft.trim()}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-extrabold text-xs sm:text-sm shadow-[0_4px_20px_rgba(16,185,129,0.4)] flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-40"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>✓ Hoàn thành câu chuyện</span>
            </button>
          </div>
        </div>

        {/* AI STORY PARTNER FEEDBACK PANEL (Section IV & V) */}
        {aiPartnerAdvice && (
          <div className="mt-6 p-6 rounded-3xl bg-[#0e0424]/95 border border-pink-400/50 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-3">
            <div className="flex items-center justify-between pb-3 border-b border-fuchsia-500/20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  🤖
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-['Outfit',sans-serif]">
                    AI Story Partner — Gợi Ý Đồng Sáng Tạo
                  </h4>
                  <span className="text-[10px] text-pink-300/80">
                    AI chỉ đưa ra phân tích và gợi ý mở rộng, không thay thế quyền sáng tạo của bạn.
                  </span>
                </div>
              </div>

              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-200 border border-pink-400/30 font-semibold">
                Đồng hành văn học
              </span>
            </div>

            {/* 1. Ý tưởng của bạn đang mở ra điều gì? */}
            <div className="p-4 rounded-2xl bg-pink-950/40 border border-pink-500/30 space-y-1">
              <div className="text-xs font-bold text-pink-300 flex items-center gap-1.5">
                <span>💡</span> 1. Ý tưởng của bạn đang mở ra điều gì?
              </div>
              <p className="text-xs sm:text-sm text-pink-50 leading-relaxed font-serif">
                {aiPartnerAdvice.ideaOpens}
              </p>
            </div>

            {/* 2 & 3: Điểm hợp lý & Điều đáng cân nhắc */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 2. Điểm hợp lý */}
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-1.5 text-xs">
                <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <span>🌿</span> 2. Điểm hợp lý
                </div>
                <ul className="space-y-1 text-emerald-100/90 leading-relaxed list-disc list-inside">
                  {aiPartnerAdvice.rationalPoints.map((pt, i) => (
                    <li key={i}>{pt}</li>
                  ))}
                </ul>
              </div>

              {/* 3. Điều đáng cân nhắc */}
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 space-y-1.5 text-xs">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <span>🔎</span> 3. Điều đáng cân nhắc
                </div>
                <ul className="space-y-1 text-amber-100/90 leading-relaxed list-disc list-inside">
                  {aiPartnerAdvice.considerations.map((pt, i) => (
                    <li key={i}>{pt}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 4. Gợi ý phát triển */}
            <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 space-y-1.5 text-xs">
              <div className="font-bold text-purple-300 flex items-center gap-1.5">
                <span>🌱</span> 4. Gợi ý phát triển (Bạn có thể tự viết tiếp theo hướng này)
              </div>
              <div className="space-y-1.5 text-purple-100">
                {aiPartnerAdvice.growthSuggestions.map((sug, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-pink-400 font-bold">•</span>
                    <span>{sug}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Câu hỏi mở */}
            <div className="p-4 rounded-2xl bg-sky-950/50 border border-sky-500/30 space-y-1.5 text-xs">
              <div className="font-bold text-sky-300 flex items-center gap-1.5">
                <span>❓</span> 5. Câu hỏi gợi mở suy ngẫm
              </div>
              <div className="space-y-1 text-sky-100 font-serif italic">
                {aiPartnerAdvice.openQuestions.map((q, i) => (
                  <p key={i}>“{q}”</p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FINISH & PUBLISHING MODAL (Section VIII & XVI) */}
      {isFinishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl bg-[#160a2d] border border-fuchsia-400/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-left text-sky-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-fuchsia-500/20">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌟</span>
                <div>
                  <h3 className="text-lg font-bold text-white font-['Outfit',sans-serif]">
                    Hoàn Thành Bản Sáng Tạo
                  </h3>
                  <p className="text-xs text-fuchsia-300">
                    Bản sáng tạo của bạn đã sẵn sàng được lưu giữ hoặc thắp sáng trên vũ trụ.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFinishModalOpen(false)}
                className="text-gray-400 hover:text-white text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Field: Tên bản sáng tạo */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-pink-300 block">
                Tên bản sáng tạo *
              </label>
              <input
                type="text"
                value={perspectiveTitle}
                onChange={(e) => setPerspectiveTitle(e.target.value)}
                placeholder="Ví dụ: Khúc rẽ nhân văn cho Tràng và Thị..."
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-fuchsia-500/30 text-sm text-white placeholder-purple-300/40 outline-none focus:border-pink-400"
              />
            </div>

            {/* Field: Một câu giới thiệu */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-pink-300 block">
                Một câu giới thiệu góc nhìn *
              </label>
              <textarea
                rows={2}
                value={introduction}
                onChange={(e) => setIntroduction(e.target.value)}
                placeholder="Tóm tắt ngắn gọn góc nhìn của bạn trong 1-2 câu..."
                className="w-full px-4 py-2 rounded-xl bg-black/40 border border-fuchsia-500/30 text-xs text-white placeholder-purple-300/40 outline-none focus:border-pink-400 resize-none"
              />
            </div>

            {/* Grid: Chủ đề & Tên hiển thị (Nickname) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-pink-300 block">
                  Chủ đề / Lăng kính
                </label>
                <input
                  type="text"
                  value={themeTag}
                  onChange={(e) => setThemeTag(e.target.value)}
                  placeholder="Ví dụ: Tình người, Lương thiện, Tự do..."
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-fuchsia-500/30 text-xs text-white placeholder-purple-300/40 outline-none focus:border-pink-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-pink-300 block">
                  Tên hiển thị (Nickname)
                </label>
                <input
                  type="text"
                  value={creatorDisplayName}
                  onChange={(e) => setCreatorDisplayName(e.target.value)}
                  placeholder="Tên bút danh bạn muốn dùng..."
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-fuchsia-500/30 text-xs text-white placeholder-purple-300/40 outline-none focus:border-pink-400"
                />
                <span className="text-[10px] text-fuchsia-300/60 block">
                  Không yêu cầu tên thật. Bạn có thể dùng nickname tự do.
                </span>
              </div>
            </div>

            {/* Visibility choice: Private (default) vs Public */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-white block">
                Chế độ lưu trữ:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1: Private (Default) */}
                <button
                  type="button"
                  onClick={() => setVisibilityChoice("private")}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    visibilityChoice === "private"
                      ? "bg-purple-950/80 border-purple-400 text-white shadow-md"
                      : "bg-black/30 border-purple-500/20 text-fuchsia-300 hover:bg-white/5"
                  }`}
                >
                  <Lock className="w-5 h-5 text-purple-300 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1">
                      🔒 Lưu riêng tư
                      <span className="text-[10px] text-emerald-400 font-normal">(Mặc định)</span>
                    </div>
                    <div className="text-[11px] text-fuchsia-200/70 mt-0.5 leading-snug">
                      Chỉ mình bạn xem và chỉnh sửa trong kho lưu trữ cá nhân.
                    </div>
                  </div>
                </button>

                {/* Option 2: Public */}
                <button
                  type="button"
                  onClick={() => setVisibilityChoice("public")}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    visibilityChoice === "public"
                      ? "bg-pink-950/80 border-pink-400 text-white shadow-md"
                      : "bg-black/30 border-pink-500/20 text-pink-300 hover:bg-white/5"
                  }`}
                >
                  <Globe2 className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold">🌌 Đăng lên Hành tinh Trích dẫn</div>
                    <div className="text-[11px] text-pink-200/70 mt-0.5 leading-snug">
                      Thắp lên một ngôi sao góc nhìn để cộng đồng cùng khám phá.
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Safety Warning if triggered */}
            {safetyWarning && (
              <div className="p-3.5 rounded-2xl bg-amber-950/70 border border-amber-400/50 text-amber-200 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">
                    Bản sáng tạo cần được chỉnh sửa trước khi công khai:
                  </strong>
                  {safetyWarning}
                </div>
              </div>
            )}

            {/* Attribution note */}
            <div className="p-3 rounded-xl bg-white/5 text-[11px] text-fuchsia-200/70">
              Được sáng tạo bởi <strong>{creatorDisplayName || "bạn"}</strong>, với sự hỗ trợ của READVERSE AI.
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsFinishModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-sky-300 hover:text-white cursor-pointer"
              >
                Quay lại viết tiếp
              </button>
              <button
                type="button"
                onClick={handleConfirmFinish}
                disabled={isPublishing}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-pink-500/30 flex items-center gap-2 cursor-pointer disabled:opacity-40"
              >
                {isPublishing ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Đang kiểm tra an toàn & lưu trữ...
                  </>
                ) : visibilityChoice === "public" ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Thắp sao lên Hành Tinh Trích Dẫn
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" /> Lưu vào Kho Cá Nhân
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from "react";
import {
  Heart,
  Bookmark,
  MessageCircle,
  Sparkles,
  BookOpen,
  ArrowLeft,
  Share2,
  Lock,
  Globe2,
  Trash2,
  Check,
  Send,
  GitBranch,
} from "lucide-react";
import { CreativePerspective, PerspectiveComment, UserProfile } from "../../types";
import {
  getBookmarkedPerspectiveIds,
  togglePerspectiveBookmark,
  saveLocalPerspective,
} from "../../utils/perspectiveManager";
import { playPop, playSuccess, playTwinkle } from "../../utils/audio";

interface PerspectiveDetailViewProps {
  perspective: CreativePerspective;
  currentUser: UserProfile;
  onBack: () => void;
  onCreateYourOwnPerspective: (workTitle: string) => void;
  onExploreOriginalWork?: (workTitle: string) => void;
  onDeletePerspective?: (id: string) => void;
  onUpdatePerspective?: (updated: CreativePerspective) => void;
}

export const PerspectiveDetailView: React.FC<PerspectiveDetailViewProps> = ({
  perspective: initialData,
  currentUser,
  onBack,
  onCreateYourOwnPerspective,
  onExploreOriginalWork,
  onDeletePerspective,
  onUpdatePerspective,
}) => {
  const [data, setData] = useState<CreativePerspective>(initialData);
  const [hasEmpathy, setHasEmpathy] = useState(
    Array.isArray(initialData.empathyUsers) && initialData.empathyUsers.includes(currentUser.id)
  );
  const [isBookmarked, setIsBookmarked] = useState(
    getBookmarkedPerspectiveIds().includes(initialData.id)
  );
  const [commentInput, setCommentInput] = useState("");
  const [selectedStarter, setSelectedStarter] = useState<string | null>(null);
  const [commentStarters, setCommentStarters] = useState<
    Array<{ type: string; label: string; text: string }>
  >([]);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const isAuthor = data.authorId === currentUser.id || data.authorId === "user-local";

  // Fetch AI comment starters
  useEffect(() => {
    fetch("/api/create/comment-starters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        perspectiveTitle: data.title,
        originalWork: data.originalWorkTitle,
        introduction: data.introduction,
      }),
    })
      .then((res) => res.json())
      .then((resData) => {
        if (Array.isArray(resData?.starters)) {
          setCommentStarters(resData.starters);
        }
      })
      .catch((e) => console.warn("Could not load comment starters:", e));
  }, [data.id]);

  // Handle empathy toggle: "♡ Mình cũng từng nghĩ vậy"
  const handleToggleEmpathy = async () => {
    playTwinkle();
    const nextState = !hasEmpathy;
    setHasEmpathy(nextState);

    const nextCount = nextState ? data.empathyCount + 1 : Math.max(0, data.empathyCount - 1);
    const updatedUsers = nextState
      ? [...(data.empathyUsers || []), currentUser.id]
      : (data.empathyUsers || []).filter((u) => u !== currentUser.id);

    const updated = {
      ...data,
      empathyCount: nextCount,
      empathyUsers: updatedUsers,
    };
    setData(updated);
    if (onUpdatePerspective) onUpdatePerspective(updated);
    saveLocalPerspective(updated);

    try {
      await fetch(`/api/creative-perspectives/${data.id}/interact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "empathy",
          userId: currentUser.id,
        }),
      });
    } catch (e) {
      console.warn("Empathy sync error:", e);
    }
  };

  // Handle bookmark
  const handleToggleBookmark = () => {
    playPop();
    const state = togglePerspectiveBookmark(data.id);
    setIsBookmarked(state);
  };

  // Handle Add Comment
  const handleSendComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const textToSend = commentInput.trim();
    if (!textToSend || isSubmittingComment) return;

    setIsSubmittingComment(true);
    playSuccess();

    const newComment: PerspectiveComment = {
      id: `cmt-${Date.now()}`,
      userName: currentUser.name || "Bạn đọc",
      text: textToSend,
      timestamp: "Vừa xong",
      starterType: (selectedStarter as any) || "custom",
    };

    const updatedComments = [...(data.comments || []), newComment];
    const updated = { ...data, comments: updatedComments };
    setData(updated);
    setCommentInput("");
    setSelectedStarter(null);
    if (onUpdatePerspective) onUpdatePerspective(updated);
    saveLocalPerspective(updated);

    try {
      await fetch(`/api/creative-perspectives/${data.id}/interact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "comment",
          userName: currentUser.name || "Bạn đọc",
          commentText: textToSend,
          starterType: selectedStarter || "custom",
        }),
      });
    } catch (err) {
      console.warn("Comment sync error:", err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle visibility toggle for author
  const handleToggleVisibility = async () => {
    if (!isAuthor) return;
    playPop();
    const nextVis = data.visibility === "public" ? "private" : "public";
    const updated = { ...data, visibility: nextVis as "public" | "private" };
    setData(updated);
    if (onUpdatePerspective) onUpdatePerspective(updated);
    saveLocalPerspective(updated);

    try {
      await fetch(`/api/creative-perspectives/${data.id}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visibility: nextVis,
          authorId: currentUser.id,
        }),
      });
    } catch (e) {
      console.warn("Visibility toggle error:", e);
    }
  };

  return (
    <div id="perspective-detail-view" className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-16 text-left">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => {
            playPop();
            onBack();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-sky-950/70 hover:bg-sky-900 border border-sky-400/30 text-sky-200 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-pink-400" />
          <span>Quay lại Dải Ngân Hà</span>
        </button>

        <div className="flex items-center gap-2">
          {isAuthor && (
            <button
              onClick={handleToggleVisibility}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                data.visibility === "public"
                  ? "bg-pink-950/60 border-pink-400/40 text-pink-300"
                  : "bg-purple-950/60 border-purple-400/40 text-purple-300"
              }`}
            >
              {data.visibility === "public" ? (
                <>
                  <Globe2 className="w-3.5 h-3.5" /> Đang công khai
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" /> Riêng tư
                </>
              )}
            </button>
          )}

          {isAuthor && onDeletePerspective && (
            <button
              onClick={() => {
                if (window.confirm("Bạn có chắc muốn xóa góc nhìn sáng tạo này không?")) {
                  onDeletePerspective(data.id);
                  onBack();
                }
              }}
              className="p-2 rounded-xl bg-red-950/50 hover:bg-red-900/70 border border-red-500/30 text-red-300 hover:text-white cursor-pointer"
              title="Xóa góc nhìn này"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Hero Header: 🌌 GÓC NHÌN CỦA MỘT NGƯỜI ĐỌC */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#2c084f]/95 via-[#37135e]/90 to-[#120f38]/95 border border-pink-400/40 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black uppercase tracking-widest text-pink-300 px-3 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/30 flex items-center gap-1">
              🌌 GÓC NHÌN CỦA MỘT NGƯỜI ĐỌC
            </span>
            {data.themes?.map((th, i) => (
              <span
                key={i}
                className="text-[11px] font-semibold text-purple-200 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30"
              >
                #{th}
              </span>
            ))}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-['Outfit',sans-serif] tracking-tight">
            {data.title}
          </h1>

          <div className="flex items-center gap-3 text-xs text-fuchsia-200/90 flex-wrap">
            <span>
              Tác phẩm gốc: <strong className="text-pink-300 font-bold">{data.originalWorkTitle}</strong>
              {data.originalWorkAuthor ? ` (${data.originalWorkAuthor})` : ""}
            </span>
            <span>•</span>
            <span>
              Người sáng tạo: <strong className="text-white font-bold">{data.displayName}</strong>
            </span>
          </div>

          {data.introduction && (
            <p className="text-sm sm:text-base text-pink-100 font-serif italic pt-1 border-t border-fuchsia-500/20 leading-relaxed">
              “{data.introduction}”
            </p>
          )}
        </div>
      </div>

      {/* Official Disclaimer Label (Section XI) */}
      <div className="p-3.5 rounded-2xl bg-[#140b2b]/80 border border-pink-500/30 text-xs text-pink-200/90 flex items-center gap-2.5">
        <span className="text-base">📌</span>
        <span>
          <strong>Lưu ý:</strong> Đây là nội dung sáng tạo của người đọc, không phải diễn biến chính thức của tác phẩm.
        </span>
      </div>

      {/* Story Reconstruction Flow (Cốt truyện gốc -> Điểm rẽ -> Góc nhìn mới -> Kết cục) */}
      <div className="space-y-4">
        {/* Section A: Cốt truyện gốc & Điểm rẽ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-3xl bg-[#0f0724]/90 border border-purple-500/30 space-y-2">
            <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5 uppercase">
              <BookOpen className="w-4 h-4 text-purple-400" />
              📖 CỐT TRUYỆN GỐC
            </div>
            <p className="text-xs text-purple-100 font-serif leading-relaxed">
              {data.originalSituationSummary || `Tình huống cao trào thử thách nhân vật trong "${data.originalWorkTitle}".`}
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-[#190933]/90 border border-pink-400/40 space-y-2">
            <div className="text-xs font-bold text-pink-300 flex items-center gap-1.5 uppercase">
              <GitBranch className="w-4 h-4 text-pink-400" />
              ✦ ĐIỂM RẼ ĐÃ CHỌN
            </div>
            <p className="text-xs text-pink-100 font-serif leading-relaxed">
              {data.turningPoint || "Nhân vật đã đưa ra một lựa chọn khác biệt."}
            </p>
          </div>
        </div>

        {/* Section B: Toàn văn Bản Sáng Tạo / Nhánh Tái Thiết */}
        <div className="p-6 sm:p-7 rounded-3xl bg-[#13072b]/95 border border-fuchsia-400/30 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-fuchsia-500/20">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              🌱 DIỄN BIẾN & KẾT CỤC TÁI THIẾT
            </h3>
          </div>

          <div className="prose prose-invert max-w-none text-sm sm:text-base font-serif text-pink-50 leading-relaxed space-y-4 whitespace-pre-wrap">
            {data.creativeContent}
          </div>

          {/* Attribution footer inside work */}
          <div className="pt-4 border-t border-fuchsia-500/20 flex items-center justify-between text-xs text-fuchsia-300/70">
            <span>
              Được sáng tạo bởi <strong>{data.displayName}</strong>
            </span>
            <span>READVERSE Creative Studio</span>
          </div>
        </div>
      </div>

      {/* INTERACTIONS BAR: ♡ "Mình cũng từng nghĩ vậy", 🔖 Lưu góc nhìn, 💬 Bình luận (Section XII) */}
      <div className="p-5 rounded-3xl bg-[#110626]/90 border border-fuchsia-500/30 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          {/* Heart / Empathy: "Mình cũng từng nghĩ vậy" */}
          <button
            onClick={handleToggleEmpathy}
            className={`px-4 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              hasEmpathy
                ? "bg-pink-600 border-pink-400 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]"
                : "bg-pink-950/40 hover:bg-pink-900/60 border-pink-500/30 text-pink-200"
            }`}
          >
            <Heart className={`w-4 h-4 ${hasEmpathy ? "fill-white text-white" : "text-pink-400"}`} />
            <span>♡ Mình cũng từng nghĩ vậy ({data.empathyCount || 0})</span>
          </button>

          {/* Bookmark */}
          <button
            onClick={handleToggleBookmark}
            className={`px-3.5 py-2 rounded-2xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              isBookmarked
                ? "bg-amber-950/70 border-amber-400 text-amber-300"
                : "bg-black/30 hover:bg-white/5 border-purple-500/30 text-purple-200"
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-amber-300 text-amber-300" : ""}`} />
            <span>{isBookmarked ? "Đã lưu góc nhìn" : "Lưu góc nhìn"}</span>
          </button>
        </div>

        {/* Primary CTAs (Section XIII) */}
        <div className="flex items-center gap-2">
          {/* CTA 1: Tạo góc nhìn của riêng bạn */}
          <button
            onClick={() => {
              playTwinkle();
              onCreateYourOwnPerspective(data.originalWorkTitle);
            }}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-pink-500/30 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-200" />
            <span>✨ Tạo góc nhìn của riêng bạn</span>
          </button>

          {/* CTA 2: Khám phá tác phẩm gốc */}
          {onExploreOriginalWork && (
            <button
              onClick={() => {
                playPop();
                onExploreOriginalWork(data.originalWorkTitle);
              }}
              className="px-3.5 py-2 rounded-2xl bg-purple-950/60 hover:bg-purple-900 border border-purple-400/40 text-purple-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-pink-300" />
              <span>📖 Khám phá tác phẩm gốc</span>
            </button>
          )}
        </div>
      </div>

      {/* COMMENTS & REFLECTIONS SECTION WITH AI COMMENT STARTERS (Section XII) */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#14082e]/95 border border-fuchsia-500/30 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-fuchsia-500/20">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-pink-400" />
            <h3 className="text-base font-bold text-white font-['Outfit',sans-serif]">
              Chia Sẻ Cảm Nhận & Đối Thoại ({data.comments?.length || 0})
            </h3>
          </div>
          <span className="text-[11px] text-fuchsia-300/80">
            Cùng trao đổi văn minh, lắng nghe đa chiều
          </span>
        </div>

        {/* AI Comment Starters Chips */}
        {commentStarters.length > 0 && (
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-pink-300 flex items-center gap-1">
              <span>💡</span> Gợi ý câu mở đầu từ AI để thảo luận sâu hơn:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {commentStarters.map((starter) => (
                <button
                  key={starter.type}
                  onClick={() => {
                    playPop();
                    setSelectedStarter(starter.type);
                    setCommentInput(starter.text + " ");
                  }}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    selectedStarter === starter.type
                      ? "bg-pink-900/60 border-pink-400 text-white font-medium"
                      : "bg-black/30 hover:bg-white/5 border-fuchsia-500/20 text-fuchsia-200"
                  }`}
                >
                  <span className="font-bold text-pink-300 block text-[10px] uppercase">
                    {starter.label}
                  </span>
                  <span className="text-[11px] text-fuchsia-100/80 line-clamp-1 italic">
                    “{starter.text}”
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* New Comment Input Box */}
        <form onSubmit={handleSendComment} className="space-y-2 pt-1">
          <div className="relative">
            <textarea
              rows={3}
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Viết cảm nhận của bạn về góc nhìn này..."
              className="w-full p-3.5 pr-12 rounded-2xl bg-black/40 border border-fuchsia-500/30 text-xs sm:text-sm text-white placeholder-purple-300/40 outline-none focus:border-pink-400 resize-none font-serif leading-relaxed"
            />
            <button
              type="submit"
              disabled={!commentInput.trim() || isSubmittingComment}
              className="absolute right-3 bottom-3 p-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white cursor-pointer disabled:opacity-30 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Comments List */}
        <div className="space-y-3 pt-2">
          {data.comments && data.comments.length > 0 ? (
            data.comments.map((cmt) => (
              <div
                key={cmt.id}
                className="p-3.5 rounded-2xl bg-black/30 border border-fuchsia-500/20 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-pink-300">{cmt.userName}</span>
                  <span className="text-fuchsia-400/60 font-mono text-[10px]">{cmt.timestamp}</span>
                </div>
                <p className="text-sky-100 font-serif leading-relaxed">{cmt.text}</p>
              </div>
            ))
          ) : (
            <div className="p-4 rounded-2xl bg-black/20 text-center text-xs text-fuchsia-300/60 italic">
              Chưa có cảm nhận nào. Hãy là người đầu tiên chia sẻ suy nghĩ của bạn nhé!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

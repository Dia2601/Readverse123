import React, { useState, useEffect } from "react";
import { Sparkles, BookOpen, Compass, Bookmark, Check, RefreshCw, HelpCircle, Quote } from "lucide-react";
import { BookRecommendation, UserProfile } from "../types";
import { INITIAL_RECOMMENDATIONS } from "../data/mockData";
import { playPop, playSuccess, playTwinkle } from "../utils/audio";

interface WeeklyRecommendationsProps {
  user: UserProfile;
  onSaveToJourney: (bookTitle: string) => void;
}

export const WeeklyRecommendations: React.FC<WeeklyRecommendationsProps> = ({
  user,
  onSaveToJourney,
}) => {
  const [recommendations, setRecommendations] = useState<BookRecommendation[]>(INITIAL_RECOMMENDATIONS);
  const [savedBooks, setSavedBooks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFreshRecommendations = async () => {
    setIsLoading(true);
    playTwinkle();
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interests: user.interests,
          readWorks: user.readWorks,
          readingStyle: user.readingStyle,
        }),
      });
      const data = await res.json();
      if (Array.isArray(data.recommendations) && data.recommendations.length > 0) {
        setRecommendations(data.recommendations);
      }
    } catch {
      // Fallback preserves initial curated recommendations
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = (title: string) => {
    playSuccess();
    if (!savedBooks.includes(title)) {
      setSavedBooks([...savedBooks, title]);
      onSaveToJourney(title);
    }
  };

  return (
    <div id="weekly-recommendations" className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 text-left">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0c2e68]/90 via-[#0a3575]/80 to-[#08285a]/90 border border-sky-400/40 shadow-[0_12px_32px_rgba(2,132,199,0.35)] backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-200 p-0.5 shadow-[0_0_20px_rgba(251,191,36,0.5)] shrink-0 flex items-center justify-center">
            <div className="w-full h-full rounded-2xl bg-[#082046] flex items-center justify-center text-3xl">
              🔭
            </div>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30">
              TUYỂN TẬP ĐƯỢC AI CÁ NHÂN HÓA
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit',sans-serif] mt-1">
              Vũ Trụ Đề Xuất
            </h2>
            <p className="text-xs sm:text-sm text-sky-200/80">
              3 tác phẩm được tinh tuyển dành riêng cho phong cách đọc của{" "}
              <strong className="text-cyan-300">{user.name}</strong>.
            </p>
          </div>
        </div>

        <button
          onClick={fetchFreshRecommendations}
          disabled={isLoading}
          className="px-4 py-2.5 rounded-xl bg-sky-900/60 hover:bg-sky-800/60 border border-sky-400/30 text-sky-200 text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Tạo lại đề xuất mới
        </button>
      </div>

      {/* 3 Cosmic Recommended Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendations.map((rec) => {
          const isSaved = savedBooks.includes(rec.title);
          return (
            <div
              key={rec.id}
              className="p-5 rounded-3xl bg-[#09224f]/90 border border-sky-400/30 shadow-lg backdrop-blur-sm flex flex-col justify-between space-y-4 hover:border-cyan-400/60 transition-all text-left"
            >
              {/* Top info */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                    Gợi ý tuần này
                  </span>
                  <span className="text-xs text-yellow-300">★ Tương thích cao</span>
                </div>

                <h4 className="text-base sm:text-lg font-bold text-white font-serif">{rec.title}</h4>
                <p className="text-xs text-sky-300/80 italic mb-2.5">— {rec.author}</p>

                {/* Reason */}
                <div className="p-3 rounded-xl bg-sky-950/60 border border-sky-500/20 text-xs text-sky-200 mb-3 leading-relaxed">
                  <strong className="text-cyan-300 block text-[11px] mb-0.5">
                    💡 Tại sao phù hợp với bạn:
                  </strong>
                  {rec.whyRecommended}
                </div>

                {/* Question before reading */}
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20 text-xs text-amber-100 mb-3 leading-relaxed">
                  <span className="text-[11px] font-bold text-yellow-300 flex items-center gap-1 mb-1">
                    <HelpCircle className="w-3 h-3" /> Câu hỏi gợi mở trước khi đọc:
                  </span>
                  “{rec.ponderQuestion}”
                </div>

                {/* Quote snippet */}
                <div className="text-xs text-sky-300/90 italic font-serif pl-3 border-l-2 border-cyan-400">
                  “{rec.quoteSnippet}”
                </div>
              </div>

              {/* Action Button: Lưu vào hành trình đọc */}
              <div className="pt-2 border-t border-sky-500/20">
                <button
                  onClick={() => handleSave(rec.title)}
                  disabled={isSaved}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isSaved
                      ? "bg-teal-500/20 text-teal-300 border border-teal-400/40"
                      : "bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-300 hover:to-sky-400 text-[#071330] shadow-md active:scale-95"
                  }`}
                >
                  {isSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Đã lưu vào Hành Trình Đọc
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-3.5 h-3.5" /> Lưu vào hành trình đọc
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

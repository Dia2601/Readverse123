import React, { useState, useMemo, useEffect } from "react";
import { Sparkles, Heart, Lightbulb, Rocket, MessageSquare, Plus, Search, Filter, Share2, BookOpen, Check, Bookmark, Play, Clock, HelpCircle, History, Compass, Send, Star, GitBranch, ArrowRight } from "lucide-react";
import { CommunityQuote, UserProfile, WorkStatus, CreativePerspective } from "../../types";
import { INITIAL_QUOTES } from "../../data/mockData";
import { playPop, playSuccess, playTwinkle } from "../../utils/audio";
import { fetchPublicPerspectives, deleteLocalPerspective } from "../../utils/perspectiveManager";
import { PerspectiveDetailView } from "./PerspectiveDetailView";

interface ExplorePlanetProps {
  user: UserProfile;
  onActivityComplete: (title: string, score: number, badge: string, planetId?: string) => void;
  onUpdateWorkStatus?: (title: string, author: string, status: WorkStatus) => void;
  onOpenReconstruction?: (workTitle: string) => void;
  onSelectPerspective?: (perspective: CreativePerspective) => void;
}

interface ExploreBook {
  id: string;
  title: string;
  author: string;
  category: string;
  coverEmoji: string;
  heartQuote: string;
  thoughtQuestion: string;
  historicalContext: string;
}

const EXPLORE_CATALOG: ExploreBook[] = [
  {
    id: "eb-1",
    title: "Vợ Nhặt",
    author: "Kim Lân",
    category: "Hiện thực & Nhân đạo",
    coverEmoji: "🌾",
    heartQuote: "Trong cái đói quay đói quắt, người ta không nghĩ đến cái chết, mà chỉ nghĩ đến sự sống.",
    thoughtQuestion: "Nếu là Tràng giữa nạn đói năm 1945, bạn có dám liều lĩnh chia sẻ phần lương thực ít ỏi cho một người xa lạ?",
    historicalContext: "Nạn đói Ất Dậu 1945 cướp đi hơn 2 triệu sinh mạng, đẩy con người vào ranh giới mong manh giữa cái chết và khát vọng sống.",
  },
  {
    id: "eb-2",
    title: "Lão Hạc",
    author: "Nam Cao",
    category: "Hiện thực & Nhân đạo",
    coverEmoji: "🐕",
    heartQuote: "Cuộc đời chưa hẳn đã đáng buồn, hay vẫn đáng buồn nhưng lại đáng buồn theo một nghĩa khác.",
    thoughtQuestion: "Hành động chọn cái chết bằng bả chó của Lão Hạc là bi kịch cùng quẫn hay là sự kiêu hãnh tuyệt đối của lương tri?",
    historicalContext: "Xã hội nông thôn Việt Nam trước Cách mạng tháng Tám, nơi người nông dân nghèo bị bần cùng hóa và đẩy vào ngõ cụt sinh tồn.",
  },
  {
    id: "eb-3",
    title: "Chí Phèo",
    author: "Nam Cao",
    category: "Tâm lý & Triết lý",
    coverEmoji: "🥣",
    heartQuote: "Ai cho tao lương thiện? Làm sao cho mất được những vết mảnh chai trên mặt này?",
    thoughtQuestion: "Bát cháo hành của Thị Nở đánh thức nhân tính, nhưng tại sao chỉ tình thương thôi lại không đủ cứu rỗi Chí Phèo khỏi sự ruồng bỏ của xã hội?",
    historicalContext: "Làng Vũ Đại điển hình cho sự áp bức giai cấp phong kiến, tha hóa con người từ thể xác đến linh hồn.",
  },
  {
    id: "eb-4",
    title: "Hai Đứa Trẻ",
    author: "Thạch Lam",
    category: "Cảm xúc & Trữ tình",
    coverEmoji: "🚂",
    heartQuote: "Chuyến tàu đêm đi qua, mang theo một thế giới khác hẳn đối với vầng sáng ngọn đèn của chị Tí và ánh lửa của bác Siêu.",
    thoughtQuestion: "Chuyến tàu đêm chỉ lướt qua vài phút, tại sao chị em Liên đêm nào cũng cố thức đợi tàu trong sự mỏi mòn?",
    historicalContext: "Cuộc sống quẩn quanh, tù túng và buồn tẻ của tầng lớp thị dân nghèo nơi phố huyện trước năm 1945.",
  },
  {
    id: "eb-5",
    title: "Hoàng Tử Bé",
    author: "Antoine de Saint-Exupéry",
    category: "Triết lý & Khám phá",
    coverEmoji: "🌹",
    heartQuote: "Người ta chỉ thấy rõ với trái tim. Điều cốt lõi vô hình trong mắt trần.",
    thoughtQuestion: "Bí mật của con cáo về sự 'thuần hóa' có ý nghĩa gì đối với cách người trẻ hôm nay xây dựng các mối quan hệ bền vững?",
    historicalContext: "Tác phẩm ra đời giữa Thế chiến II (1943), lời kêu gọi tìm lại sự ngây thơ và bản chất tình người giữa bom đạn hỗn loạn.",
  },
  {
    id: "eb-6",
    title: "Truyện Kiều",
    author: "Nguyễn Du",
    category: "Cổ điển & Bi kịch",
    coverEmoji: "🌸",
    heartQuote: "Đau đớn thay phận đàn bà, Lời rằng bạc mệnh cũng là lời chung.",
    thoughtQuestion: "Quyết định bán mình chuộc cha của Thúy Kiều là sự hy sinh tuyệt đỉnh hay là biểu hiện của sự bất lực trước trật tự gia trưởng phong kiến?",
    historicalContext: "Thời kỳ phong kiến suy tàn đầy biến động, đồng tiền lấn át đạo lý và quyền sống của con người, đặc biệt là phụ nữ tài hoa.",
  },
  {
    id: "eb-7",
    title: "Chiếc Thuyền Ngoài Xa",
    author: "Nguyễn Minh Châu",
    category: "Góc nhìn Đa chiều",
    coverEmoji: "⛵",
    heartQuote: "Không thể nhìn đời một cách đơn giản, xuôi chiều; nghệ thuật phải đi sâu vào bề sâu đa sự của đời sống con người.",
    thoughtQuestion: "Tại sao người đàn bà hàng chài lại kiên quyết không bỏ người chồng vũ phu trước tòa án?",
    historicalContext: "Giai đoạn đổi mới sau chiến tranh, văn học chuyển dịch từ sử thi sang khám phá những góc khuất số phận đời thường.",
  },
];

export const ExplorePlanet: React.FC<ExplorePlanetProps> = ({
  user,
  onActivityComplete,
  onUpdateWorkStatus,
  onOpenReconstruction,
  onSelectPerspective,
}) => {
  const [activeTab, setActiveTab] = useState<"perspectives" | "catalog" | "quotes">("perspectives");
  const [perspectives, setPerspectives] = useState<CreativePerspective[]>([]);
  const [isLoadingPerspectives, setIsLoadingPerspectives] = useState(false);
  const [selectedPerspectiveWork, setSelectedPerspectiveWork] = useState<string>("Tất cả");
  const [activeDetailPerspective, setActiveDetailPerspective] = useState<CreativePerspective | null>(null);

  const [quotes, setQuotes] = useState<CommunityQuote[]>(INITIAL_QUOTES);
  const [selectedTag, setSelectedTag] = useState<string>("Tất cả");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Load public perspectives on mount
  useEffect(() => {
    setIsLoadingPerspectives(true);
    fetchPublicPerspectives()
      .then((data) => {
        setPerspectives(data);
      })
      .catch((e) => console.warn("Failed to load perspectives:", e))
      .finally(() => setIsLoadingPerspectives(false));
  }, []);

  // Filtered perspectives
  const filteredPerspectives = useMemo(() => {
    if (selectedPerspectiveWork === "Tất cả") return perspectives;
    return perspectives.filter((p) =>
      (p.originalWorkTitle || "").toLowerCase().includes(selectedPerspectiveWork.toLowerCase())
    );
  }, [perspectives, selectedPerspectiveWork]);

  // New quote modal form
  const [newWork, setNewWork] = useState(user.readWorks?.[0] || "Vợ Nhặt");
  const [newAuthor, setNewAuthor] = useState("Kim Lân");
  const [newQuoteText, setNewQuoteText] = useState("");
  const [newReflection, setNewReflection] = useState("");
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);

  // Filter catalog based on user interests if available
  const filteredCatalog = useMemo(() => {
    const q = (searchTerm || "").toLowerCase().trim();
    const tag = (selectedTag || "").toLowerCase().trim();

    return EXPLORE_CATALOG.filter((book) => {
      const bookTitle = (book.title || "").toLowerCase();
      const bookAuthor = (book.author || "").toLowerCase();
      const bookCategory = (book.category || "").toLowerCase();

      const matchesSearch =
        !q ||
        bookTitle.includes(q) ||
        bookAuthor.includes(q) ||
        bookCategory.includes(q);

      const matchesTag =
        !selectedTag ||
        selectedTag === "Tất cả" ||
        bookCategory.includes(tag);

      return matchesSearch && matchesTag;
    });
  }, [searchTerm, selectedTag]);

  // Status helper for books in catalog
  const getWorkStatus = (title: string): WorkStatus | null => {
    if (!title) return null;
    const cleanTitle = title.toLowerCase().trim();
    const item = user.workItems?.find((w) => {
      const itemTitle = (w?.title || w?.workTitle || "").toLowerCase().trim();
      return itemTitle === cleanTitle;
    });
    if (item) return item.status;
    if (user.readWorks?.some((rw) => (rw || "").toLowerCase().trim() === cleanTitle)) {
      return "read";
    }
    return null;
  };

  const handleSetStatus = (book: ExploreBook, status: WorkStatus) => {
    playPop();
    if (onUpdateWorkStatus) {
      onUpdateWorkStatus(book.title, book.author, status);
    }
  };

  const handleLike = (id: string) => {
    playPop();
    setQuotes((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              likes: q.hasLiked ? q.likes - 1 : q.likes + 1,
              hasLiked: !q.hasLiked,
            }
          : q
      )
    );
  };

  const handleInsight = (id: string) => {
    playTwinkle();
    setQuotes((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              insights: q.hasInsight ? q.insights - 1 : q.insights + 1,
              hasInsight: !q.hasInsight,
            }
          : q
      )
    );
  };

  const handleShareQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuoteText.trim() || !newReflection.trim() || isSubmittingQuote) return;

    setIsSubmittingQuote(true);
    playTwinkle();

    try {
      // Call AI to be the FIRST responder with warm encouragement (no grading!)
      const res = await fetch("/api/quotes/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workTitle: newWork,
          quote: newQuoteText,
          reflection: newReflection,
          userName: user.name,
        }),
      });
      const aiResponse = await res.json();

      const createdQuote: CommunityQuote = {
        id: "q-" + Date.now(),
        workTitle: newWork.trim(),
        author: newAuthor.trim() || "Tác giả",
        quote: newQuoteText.trim(),
        reflection: newReflection.trim(),
        userName: user.name || "Phi hành gia",
        userStyle: user.readingStyle || "Độc giả sâu lắng",
        likes: 1,
        insights: 1,
        hasLiked: true,
        tags: ["Cộng đồng", "Cảm xúc"],
        comments: [
          {
            id: "c-ai-" + Date.now(),
            userName: "Komi (AI Đồng Hành)",
            avatar: "🤖",
            text: `${aiResponse.aiComment || "Cảm nhận tuyệt vời!"} — ${aiResponse.warmQuestion || ""}`,
            timeAgo: "Vừa xong",
          },
        ],
      };

      setQuotes([createdQuote, ...quotes]);
      setIsShareModalOpen(false);
      setNewQuoteText("");
      setNewReflection("");
      playSuccess();

      // Record in user profile as completed activity!
      onActivityComplete(
        `Chia sẻ cảm nghĩ về "${newWork}"`,
        90,
        "Ngôi Sao Khởi Nguồn",
        "explore"
      );
    } catch {
      const fallbackQuote: CommunityQuote = {
        id: "q-" + Date.now(),
        workTitle: newWork.trim(),
        author: newAuthor.trim() || "Tác giả",
        quote: newQuoteText.trim(),
        reflection: newReflection.trim(),
        userName: user.name || "Phi hành gia",
        userStyle: user.readingStyle || "Độc giả sâu lắng",
        likes: 1,
        insights: 1,
        hasLiked: true,
        tags: ["Cộng đồng"],
        comments: [
          {
            id: "c-ai-" + Date.now(),
            userName: "Komi (AI Đồng Hành)",
            avatar: "🤖",
            text: `Cảm ơn bạn đã thắp lên một đốm sáng cảm xúc tại Hành Tinh Khám Phá! Câu trích từ "${newWork}" thật sâu sắc.`,
            timeAgo: "Vừa xong",
          },
        ],
      };
      setQuotes([fallbackQuote, ...quotes]);
      setIsShareModalOpen(false);
      playSuccess();
      onActivityComplete(
        `Chia sẻ cảm nghĩ về "${newWork}"`,
        90,
        "Ngôi Sao Khởi Nguồn",
        "explore"
      );
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  if (activeDetailPerspective) {
    return (
      <PerspectiveDetailView
        perspective={activeDetailPerspective}
        currentUser={user}
        onBack={() => {
          setActiveDetailPerspective(null);
        }}
        onCreateYourOwnPerspective={(workTitle) => {
          if (onOpenReconstruction) {
            onOpenReconstruction(workTitle);
          }
        }}
        onExploreOriginalWork={(workTitle) => {
          setActiveDetailPerspective(null);
          setActiveTab("catalog");
          setSearchTerm(workTitle);
        }}
        onDeletePerspective={(id) => {
          deleteLocalPerspective(id);
          setPerspectives((prev) => prev.filter((p) => p.id !== id));
          setActiveDetailPerspective(null);
        }}
        onUpdatePerspective={(updated) => {
          setPerspectives((prev) =>
            prev.map((p) => (p.id === updated.id ? updated : p))
          );
        }}
      />
    );
  }

  return (
    <div id="planet-explore" className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0c2e68]/90 via-[#0a3575]/80 to-[#08285a]/90 border border-sky-400/40 shadow-[0_12px_32px_rgba(2,132,199,0.35)] backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-left">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-400 to-cyan-200 p-0.5 shadow-[0_0_20px_rgba(56,189,248,0.5)] shrink-0 flex items-center justify-center">
            <div className="w-full h-full rounded-2xl bg-[#082046] flex items-center justify-center text-3xl">
              🌌
            </div>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/30">
              VŨ TRỤ TÁC PHẨM & GÓC NHÌN ĐA CHIỀU
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit',sans-serif] mt-1">
              Hành Tinh Trích Dẫn
            </h2>
            <p className="text-xs sm:text-sm text-sky-200/90 font-serif italic">
              “Mỗi người đọc nhìn thấy một thế giới theo một cách khác nhau.”
            </p>
          </div>
        </div>

        {/* View switcher tabs */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-sky-950/80 border border-sky-400/30 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => {
              playPop();
              setActiveTab("perspectives");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "perspectives"
                ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-sm"
                : "text-sky-300 hover:text-white"
            }`}
          >
            🌌 Ngôi Sao Góc Nhìn ({perspectives.length})
          </button>
          <button
            onClick={() => {
              playPop();
              setActiveTab("catalog");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "catalog"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-sky-300 hover:text-white"
            }`}
          >
            📚 Thư Viện Tác Phẩm
          </button>
          <button
            onClick={() => {
              playPop();
              setActiveTab("quotes");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "quotes"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-sky-300 hover:text-white"
            }`}
          >
            💬 Trạm Cảm Nghĩ ({quotes.length})
          </button>
        </div>
      </div>

      {/* TAB 0: PERSPECTIVE STARS (HÀNH TINH TRÍCH DẪN - GÓC NHÌN ĐỘC GIẢ) */}
      {activeTab === "perspectives" && (
        <div className="space-y-5 text-left animate-in fade-in">
          {/* Subtitle & Filter Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#091b38]/80 border border-sky-400/20">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-sky-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                <span>Chòm Sao Góc Nhìn Độc Giả</span>
              </div>
              <p className="text-[11px] text-sky-300/70">
                Mỗi bản tái thiết công khai là một ngôi sao tỏa sáng mang thông điệp riêng.
              </p>
            </div>

            {/* Work filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {["Tất cả", "Vợ Nhặt", "Lão Hạc", "Chí Phèo", "Hai Đứa Trẻ", "Truyện Kiều", "Hoàng Tử Bé"].map((w) => (
                <button
                  key={w}
                  onClick={() => {
                    playPop();
                    setSelectedPerspectiveWork(w);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
                    selectedPerspectiveWork === w
                      ? "bg-pink-600 text-white font-bold shadow-sm"
                      : "bg-sky-950/60 hover:bg-sky-900/60 text-sky-300 border border-sky-500/20"
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Empty State (Section XX) */}
          {filteredPerspectives.length === 0 ? (
            <div className="p-10 sm:p-12 rounded-3xl bg-gradient-to-b from-[#0c1a3b]/90 to-[#081228]/90 border border-sky-400/30 text-center space-y-4 max-w-xl mx-auto shadow-xl">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500/20 to-purple-500/20 border border-pink-400/30 flex items-center justify-center text-3xl mx-auto shadow-[0_0_25px_rgba(236,72,153,0.3)]">
                🌌
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-white font-['Outfit',sans-serif]">
                  Hành tinh này vẫn đang chờ những góc nhìn đầu tiên.
                </h3>
                <p className="text-xs sm:text-sm text-sky-200/80 font-serif italic max-w-md mx-auto leading-relaxed">
                  “Hoàn thành một hành trình sáng tạo và thắp lên ngôi sao của riêng bạn.”
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => {
                    playTwinkle();
                    if (onOpenReconstruction) {
                      onOpenReconstruction(selectedPerspectiveWork !== "Tất cả" ? selectedPerspectiveWork : "Vợ Nhặt");
                    }
                  }}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-pink-500/30 inline-flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-pink-200" />
                  <span>Bắt đầu sáng tạo</span>
                </button>
              </div>
            </div>
          ) : (
            /* Perspective Stars Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredPerspectives.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-3xl bg-gradient-to-br from-[#180d38]/90 to-[#0d0724]/90 border border-pink-400/30 hover:border-pink-400/70 shadow-lg hover:shadow-[0_0_25px_rgba(244,114,182,0.25)] transition-all flex flex-col justify-between text-left group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-pink-300 px-2.5 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/30">
                        {item.originalWorkTitle}
                      </span>
                      <span className="text-[11px] text-fuchsia-300/80 flex items-center gap-1 font-semibold">
                        ♡ {item.empathyCount || 0}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white font-['Outfit',sans-serif] group-hover:text-pink-200 transition-colors">
                      {item.title}
                    </h4>

                    {item.introduction && (
                      <p className="text-xs text-purple-100/80 font-serif line-clamp-2 leading-relaxed">
                        “{item.introduction}”
                      </p>
                    )}
                  </div>

                  <div className="pt-4 mt-3 border-t border-fuchsia-500/20 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-fuchsia-300/70">
                      Người sáng tạo: <strong className="text-white font-bold">{item.displayName}</strong>
                    </span>

                    <button
                      onClick={() => {
                        playTwinkle();
                        if (onSelectPerspective) {
                          onSelectPerspective(item);
                        } else {
                          setActiveDetailPerspective(item);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
                    >
                      <span>Khám phá</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* User Interests Reminder Banner if set */}
      {user.interests && user.interests.length > 0 ? (
        <div className="px-4 py-2.5 rounded-2xl bg-sky-950/50 border border-sky-400/30 text-xs text-sky-200 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-cyan-400" />
            Đang gợi ý tác phẩm phù hợp với sở thích của bạn:{" "}
            <strong className="text-cyan-300">{user.interests.join(", ")}</strong>
          </span>
        </div>
      ) : (
        <div className="px-4 py-2.5 rounded-2xl bg-sky-950/40 border border-sky-400/20 text-xs text-sky-300">
          ✨ Đang hiển thị danh mục đa dạng để bạn tự do khám phá và đánh dấu tác phẩm.
        </div>
      )}

      {/* TAB 1: CATALOG OF WORKS WITH 3 STATUS BUTTONS */}
      {activeTab === "catalog" && (
        <div className="space-y-4 text-left">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm tác phẩm, tác giả hoặc bối cảnh..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-sky-950/70 border border-sky-400/30 text-xs sm:text-sm text-white placeholder-sky-400/40 outline-none focus:border-cyan-300"
            />
          </div>

          {/* Book Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCatalog.map((book) => {
              const currentStatus = getWorkStatus(book.title);

              return (
                <div
                  key={book.id}
                  className="p-5 rounded-3xl bg-[#081e42]/90 border border-sky-400/30 shadow-md hover:border-cyan-300/60 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Title & Author */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl p-2 rounded-2xl bg-sky-900/40 border border-sky-400/20">
                          {book.coverEmoji}
                        </span>
                        <div>
                          <h3 className="text-base font-bold text-white font-serif">{book.title}</h3>
                          <span className="text-xs text-sky-300">{book.author}</span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-sky-900/60 text-cyan-200 border border-sky-500/30">
                        {book.category}
                      </span>
                    </div>

                    {/* Heart Quote */}
                    <div className="p-3 rounded-2xl bg-sky-950/70 border border-sky-500/20">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-pink-300 block mb-1">
                        💖 Câu trích chạm đến trái tim:
                      </span>
                      <p className="text-xs text-sky-100 font-serif italic leading-relaxed">
                        “{book.heartQuote}”
                      </p>
                    </div>

                    {/* Thought Provoking Question */}
                    <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/20">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-300 block mb-1">
                        ❓ Câu hỏi kích thích tư duy:
                      </span>
                      <p className="text-xs text-indigo-100 leading-relaxed">
                        {book.thoughtQuestion}
                      </p>
                    </div>

                    {/* Historical Context */}
                    <div className="text-[11px] text-sky-300/80 leading-relaxed px-1">
                      <strong className="text-sky-200">Bối cảnh: </strong>
                      {book.historicalContext}
                    </div>
                  </div>

                  {/* 3 STATUS BUTTONS: [Đã đọc] [Muốn đọc] [Đang đọc] */}
                  <div className="pt-3 border-t border-sky-500/20 space-y-1.5">
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                      Trạng thái trong hồ sơ:
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => handleSetStatus(book, "read")}
                        className={`px-2 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          currentStatus === "read"
                            ? "bg-emerald-500 text-white shadow-sm"
                            : "bg-sky-950/70 hover:bg-sky-900 text-sky-300 border border-sky-400/20"
                        }`}
                      >
                        <Check className="w-3 h-3" /> Đã đọc
                      </button>

                      <button
                        onClick={() => handleSetStatus(book, "want_to_read")}
                        className={`px-2 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          currentStatus === "want_to_read"
                            ? "bg-amber-500 text-white shadow-sm"
                            : "bg-sky-950/70 hover:bg-sky-900 text-sky-300 border border-sky-400/20"
                        }`}
                      >
                        <Bookmark className="w-3 h-3" /> Muốn đọc
                      </button>

                      <button
                        onClick={() => handleSetStatus(book, "reading")}
                        className={`px-2 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          currentStatus === "reading"
                            ? "bg-cyan-500 text-[#071330] shadow-sm"
                            : "bg-sky-950/70 hover:bg-sky-900 text-sky-300 border border-sky-400/20"
                        }`}
                      >
                        <Play className="w-3 h-3" /> Đang đọc
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: COMMUNITY QUOTES & SHARING (WITH AI WARM RESPONSE) */}
      {activeTab === "quotes" && (
        <div className="space-y-4 text-left">
          {/* Share Action Trigger */}
          <div className="p-4 rounded-3xl bg-[#081e42]/90 border border-sky-400/30 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-white">Bạn vừa có một rung cảm đặc biệt từ trang sách?</h4>
              <p className="text-xs text-sky-300">
                Chia sẻ câu trích dẫn và cảm nghĩ để AI Komi và bạn bè cùng lắng nghe.
              </p>
            </div>
            <button
              onClick={() => {
                playPop();
                setIsShareModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-400 hover:brightness-110 text-[#071330] font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Share2 className="w-3.5 h-3.5" /> Chia sẻ cảm nghĩ
            </button>
          </div>

          {/* Quotes Feed */}
          <div className="space-y-4">
            {quotes.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-3xl bg-[#081e42]/80 border border-sky-400/30 shadow-md space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-sky-500/20">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center text-xs font-bold text-cyan-200">
                      {item.userName[0]}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-white block">{item.userName}</span>
                      <span className="text-[10px] text-sky-400">{item.userStyle}</span>
                    </div>
                  </div>
                  <span className="text-xs font-serif font-bold text-cyan-300">
                    {item.workTitle} ({item.author})
                  </span>
                </div>

                {/* Quote */}
                <p className="text-sm text-white font-serif italic pl-3 border-l-2 border-cyan-400 leading-relaxed">
                  “{item.quote}”
                </p>

                {/* Student's Reflection */}
                <div className="p-3 rounded-2xl bg-sky-950/60 border border-sky-500/20 text-xs text-sky-200">
                  <strong className="text-yellow-300 block mb-0.5">Cảm nhận độc giả:</strong>
                  {item.reflection}
                </div>

                {/* AI Komi's Warm Comment (First Responder!) */}
                {item.comments && item.comments.length > 0 && (
                  <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-300">
                      <span>🤖</span> {item.comments[0].userName}
                    </div>
                    <p className="text-xs text-cyan-100 leading-relaxed">
                      {item.comments[0].text}
                    </p>
                  </div>
                )}

                {/* Likes & Insights */}
                <div className="flex items-center gap-4 pt-1 text-xs">
                  <button
                    onClick={() => handleLike(item.id)}
                    className={`flex items-center gap-1 font-semibold cursor-pointer ${
                      item.hasLiked ? "text-pink-400" : "text-sky-300 hover:text-pink-300"
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${item.hasLiked ? "fill-pink-400" : ""}`} />
                    {item.likes} Đồng cảm
                  </button>

                  <button
                    onClick={() => handleInsight(item.id)}
                    className={`flex items-center gap-1 font-semibold cursor-pointer ${
                      item.hasInsight ? "text-yellow-300" : "text-sky-300 hover:text-yellow-200"
                    }`}
                  >
                    <Lightbulb className={`w-3.5 h-3.5 ${item.hasInsight ? "fill-yellow-300" : ""}`} />
                    {item.insights} Khai sáng
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#051126]/80 backdrop-blur-md">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-gradient-to-b from-[#0a234f] to-[#07193a] border-2 border-sky-400/50 shadow-2xl text-left space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-sky-500/30">
              <h3 className="text-base font-bold text-white font-['Outfit',sans-serif] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-300" /> Chia Sẻ Trích Dẫn & Cảm Nghĩ
              </h3>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-xs text-sky-400 hover:text-white cursor-pointer"
              >
                ✕ Đóng
              </button>
            </div>

            <form onSubmit={handleShareQuote} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-sky-200 block mb-1">Tên tác phẩm:</label>
                <input
                  type="text"
                  value={newWork}
                  onChange={(e) => setNewWork(e.target.value)}
                  placeholder="Ví dụ: Vợ Nhặt, Lão Hạc, Hoàng Tử Bé..."
                  className="w-full px-3.5 py-2 rounded-xl bg-sky-950/80 border border-sky-400/40 text-xs text-white placeholder-sky-400/40 outline-none focus:border-cyan-300"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-sky-200 block mb-1">Tác giả:</label>
                <input
                  type="text"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  placeholder="Tên tác giả..."
                  className="w-full px-3.5 py-2 rounded-xl bg-sky-950/80 border border-sky-400/40 text-xs text-white placeholder-sky-400/40 outline-none focus:border-cyan-300"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-pink-300 block mb-1">
                  💖 Câu trích dẫn bạn tâm đắc nhất:
                </label>
                <textarea
                  rows={2}
                  value={newQuoteText}
                  onChange={(e) => setNewQuoteText(e.target.value)}
                  placeholder="Nhập nguyên văn câu trích chạm đến trái tim bạn..."
                  className="w-full px-3.5 py-2 rounded-xl bg-sky-950/80 border border-sky-400/40 text-xs text-white placeholder-sky-400/40 outline-none focus:border-cyan-300 resize-none font-serif italic"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-cyan-300 block mb-1">
                  💭 Cảm nghĩ / góc nhìn cá nhân của bạn:
                </label>
                <textarea
                  rows={3}
                  value={newReflection}
                  onChange={(e) => setNewReflection(e.target.value)}
                  placeholder="Vì sao câu trích này làm bạn rung động? Nó liên hệ gì đến bạn hoặc cuộc sống hôm nay?..."
                  className="w-full px-3.5 py-2 rounded-xl bg-sky-950/80 border border-sky-400/40 text-xs text-white placeholder-sky-400/40 outline-none focus:border-cyan-300 resize-none"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-sky-950 text-xs text-sky-300 hover:text-white cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!newQuoteText.trim() || !newReflection.trim() || isSubmittingQuote}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-400 hover:brightness-110 text-[#071330] font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  {isSubmittingQuote ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border border-[#071330] border-t-transparent animate-spin" />
                      Komi đang lắng nghe & phản hồi...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Gửi & Nhận phản hồi từ AI
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

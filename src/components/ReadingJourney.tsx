import React, { useState } from "react";
import { Sparkles, Award, Star, Compass, CheckCircle2, ChevronRight, BookOpen, Layers, Trash2, Plus, Bookmark, Play, Check, Search, Calendar, Trophy } from "lucide-react";
import { ConstellationItem, UserProfile, UserWorkItem, WorkStatus } from "../types";
import { playPop, playSuccess } from "../utils/audio";
import { SUGGESTED_READING_WORKS } from "../data/mockData";

interface ReadingJourneyProps {
  user: UserProfile;
  onUpdateWorkStatus?: (title: string, author: string, status: WorkStatus) => void;
  onRemoveWorkItem?: (title: string) => void;
  onAddWorkItem?: (title: string, author: string, status: WorkStatus) => void;
}

export const ReadingJourney: React.FC<ReadingJourneyProps> = ({
  user,
  onUpdateWorkStatus,
  onRemoveWorkItem,
  onAddWorkItem,
}) => {
  const [activeWorksTab, setActiveWorksTab] = useState<WorkStatus>("read");
  const [newBookTitle, setNewBookTitle] = useState("");
  const [newBookAuthor, setNewBookAuthor] = useState("");
  const [newBookStatus, setNewBookStatus] = useState<WorkStatus>("read");
  const [isAddingBook, setIsAddingBook] = useState(false);

  // Group work items by status
  const workItems = user.workItems || [];
  const readList = workItems.filter((w) => w.status === "read");
  const readingList = workItems.filter((w) => w.status === "reading");
  const wantToReadList = workItems.filter((w) => w.status === "want_to_read");

  const currentTabItems =
    activeWorksTab === "read"
      ? readList
      : activeWorksTab === "reading"
      ? readingList
      : wantToReadList;

  // Real thinking dimensions based strictly on user.stats
  const stats = user.stats || {
    analysis: 0,
    multiPerspective: 0,
    criticalReasoning: 0,
    connection: 0,
    creativity: 0,
  };

  const thinkingDimensions = [
    { label: "Tư duy Phân tích (Thám tử)", score: stats.analysis, color: "#a855f7" },
    { label: "Tư duy Đa chiều (Đấu trí)", score: stats.multiPerspective, color: "#38bdf8" },
    { label: "Lập luận Phản biện", score: stats.criticalReasoning, color: "#facc15" },
    { label: "Năng lực Liên kết (Chòm sao)", score: stats.connection, color: "#2dd4bf" },
    { label: "Sáng tạo Văn học", score: stats.creativity, color: "#f472b6" },
  ];

  const handleAddNewBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookTitle.trim()) return;

    if (onAddWorkItem) {
      onAddWorkItem(newBookTitle.trim(), newBookAuthor.trim() || "Khuyết danh", newBookStatus);
    }
    playSuccess();
    setNewBookTitle("");
    setNewBookAuthor("");
    setIsAddingBook(false);
  };

  return (
    <div id="reading-journey" className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 text-left">
      {/* Header Profile Badge */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0c2e68]/90 via-[#0a3575]/80 to-[#08285a]/90 border border-sky-400/40 shadow-[0_12px_32px_rgba(2,132,199,0.35)] backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-400 to-sky-500 p-0.5 shadow-[0_0_20px_rgba(56,189,248,0.5)] shrink-0 flex items-center justify-center">
            <div className="w-full h-full rounded-2xl bg-[#082046] flex items-center justify-center text-3xl">
              🌌
            </div>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/30">
              NHẬT KÝ VŨ TRỤ THỰC TẾ
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit',sans-serif] mt-1">
              Hành Trình Đọc Của {user.name || "Phi Hành Gia"}
            </h2>
            <p className="text-xs sm:text-sm text-sky-200/80">
              Phong cách đọc: <strong className="text-cyan-300">{user.readingStyle || "Đang khám phá"}</strong> • Tham gia: {user.joinedDate || "Hôm nay"}
            </p>
          </div>
        </div>

        {/* Real Summary Metrics */}
        <div className="flex items-center gap-2.5">
          <div className="px-3.5 py-2 rounded-2xl bg-sky-950/70 border border-sky-400/40 text-center">
            <span className="text-[10px] text-sky-400 font-bold block">ĐÃ ĐỌC</span>
            <span className="text-lg font-extrabold text-emerald-300">
              {readList.length}
            </span>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-sky-950/70 border border-sky-400/40 text-center">
            <span className="text-[10px] text-sky-400 font-bold block">CHÒM SAO</span>
            <span className="text-lg font-extrabold text-teal-300">
              {user.createdConstellations?.length || 0}
            </span>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-sky-950/70 border border-sky-400/40 text-center">
            <span className="text-[10px] text-sky-400 font-bold block">HOẠT ĐỘNG</span>
            <span className="text-lg font-extrabold text-cyan-300">
              {user.completedActivities?.length || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Thinking Statistics Radar / Bars (Starts at 0, grows with completion) */}
      <div className="p-6 rounded-3xl bg-[#09224f]/90 border border-sky-400/30 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            Điểm Tư Duy Phi Hành Gia (Chỉ tăng khi bạn thực sự hoàn thành thử thách)
          </h3>
          <span className="text-xs text-sky-300">
            {user.completedActivities?.length === 0 ? "Chưa có điểm — hãy khám phá các hành tinh!" : "Đang phát triển"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {thinkingDimensions.map((dim, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-sky-950/60 border border-sky-500/20 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-sky-200">{dim.label}</span>
                <span className="text-sm font-extrabold" style={{ color: dim.color }}>
                  {dim.score} điểm
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-sky-900/60 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, dim.score)}%`,
                    backgroundColor: dim.color,
                    boxShadow: dim.score > 0 ? `0 0 8px ${dim.color}` : "none",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WORKS MANAGEMENT SECTION (3 TABS: Đã đọc, Đang đọc, Muốn đọc) */}
      <div className="p-6 rounded-3xl bg-[#071a3e]/90 border border-sky-400/30 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-sky-500/20">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              Tủ Sách Không Gian Của Bạn
            </h3>
            <p className="text-xs text-sky-300">
              Quản lý danh sách tác phẩm bạn đã đọc, đang đọc và muốn đọc.
            </p>
          </div>

          {/* Add Book Button */}
          <button
            onClick={() => {
              playPop();
              setIsAddingBook(!isAddingBook);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#071330] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm tác phẩm mới
          </button>
        </div>

        {/* Add Book Inline Form */}
        {isAddingBook && (
          <form
            onSubmit={handleAddNewBook}
            className="p-4 rounded-2xl bg-sky-950/80 border border-cyan-400/40 space-y-3 animate-in slide-in-from-top-2 duration-200"
          >
            <span className="text-xs font-bold text-cyan-300 block">Thêm tác phẩm vào tủ sách:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={newBookTitle}
                onChange={(e) => setNewBookTitle(e.target.value)}
                placeholder="Tên tác phẩm (bắt buộc)..."
                className="px-3 py-2 rounded-xl bg-[#071330] border border-sky-400/30 text-xs text-white placeholder-sky-400/50 outline-none focus:border-cyan-300"
                required
              />
              <input
                type="text"
                value={newBookAuthor}
                onChange={(e) => setNewBookAuthor(e.target.value)}
                placeholder="Tên tác giả..."
                className="px-3 py-2 rounded-xl bg-[#071330] border border-sky-400/30 text-xs text-white placeholder-sky-400/50 outline-none focus:border-cyan-300"
              />
              <select
                value={newBookStatus}
                onChange={(e) => setNewBookStatus(e.target.value as WorkStatus)}
                className="px-3 py-2 rounded-xl bg-[#071330] border border-sky-400/30 text-xs text-white outline-none focus:border-cyan-300"
              >
                <option value="read">Đã đọc (read)</option>
                <option value="reading">Đang đọc (reading)</option>
                <option value="want_to_read">Muốn đọc (want to read)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingBook(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-sky-400 hover:text-white cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold cursor-pointer"
              >
                Lưu vào danh sách
              </button>
            </div>
          </form>
        )}

        {/* Status Tabs */}
        <div className="flex gap-2 border-b border-sky-500/20 pb-2">
          <button
            onClick={() => {
              playPop();
              setActiveWorksTab("read");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeWorksTab === "read"
                ? "bg-emerald-500 text-white shadow-sm"
                : "bg-sky-950/60 text-sky-300 hover:text-white"
            }`}
          >
            <Check className="w-3.5 h-3.5" /> Đã đọc ({readList.length})
          </button>

          <button
            onClick={() => {
              playPop();
              setActiveWorksTab("reading");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeWorksTab === "reading"
                ? "bg-cyan-500 text-[#071330] shadow-sm"
                : "bg-sky-950/60 text-sky-300 hover:text-white"
            }`}
          >
            <Play className="w-3.5 h-3.5" /> Đang đọc ({readingList.length})
          </button>

          <button
            onClick={() => {
              playPop();
              setActiveWorksTab("want_to_read");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeWorksTab === "want_to_read"
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-sky-950/60 text-sky-300 hover:text-white"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" /> Muốn đọc ({wantToReadList.length})
          </button>
        </div>

        {/* Tab Items List */}
        {currentTabItems.length === 0 ? (
          <div className="p-8 rounded-2xl bg-sky-950/30 border border-sky-500/10 text-center space-y-2">
            <p className="text-xs sm:text-sm text-sky-300/80">
              Danh sách "{activeWorksTab === "read" ? "Đã đọc" : activeWorksTab === "reading" ? "Đang đọc" : "Muốn đọc"}" đang trống.
            </p>
            <p className="text-[11px] text-sky-400">
              Hãy thêm tác phẩm bên trên hoặc ghé thăm Hành Tinh Khám Phá để đánh dấu tác phẩm!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {currentTabItems.map((item) => (
              <div
                key={item.id || item.title}
                className="p-3.5 rounded-2xl bg-sky-950/60 border border-sky-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-cyan-400/40 transition-all"
              >
                <div>
                  <h4 className="text-sm font-bold text-white font-serif">{item.title}</h4>
                  <span className="text-xs text-sky-300">{item.author || "Tác giả văn học"}</span>
                </div>

                {/* Status switcher buttons & remove */}
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  {activeWorksTab !== "read" && (
                    <button
                      onClick={() => onUpdateWorkStatus && onUpdateWorkStatus(item.title, item.author, "read")}
                      className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-400/30 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-900 cursor-pointer"
                      title="Chuyển sang Đã đọc"
                    >
                      ✓ Đã đọc
                    </button>
                  )}
                  {activeWorksTab !== "reading" && (
                    <button
                      onClick={() => onUpdateWorkStatus && onUpdateWorkStatus(item.title, item.author, "reading")}
                      className="px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-400/30 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-900 cursor-pointer"
                      title="Chuyển sang Đang đọc"
                    >
                      ▶ Đang đọc
                    </button>
                  )}
                  {activeWorksTab !== "want_to_read" && (
                    <button
                      onClick={() => onUpdateWorkStatus && onUpdateWorkStatus(item.title, item.author, "want_to_read")}
                      className="px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-400/30 text-[11px] font-semibold text-amber-300 hover:bg-amber-900 cursor-pointer"
                      title="Chuyển sang Muốn đọc"
                    >
                      ★ Muốn đọc
                    </button>
                  )}
                  {onRemoveWorkItem && (
                    <button
                      onClick={() => {
                        playPop();
                        onRemoveWorkItem(item.title);
                      }}
                      className="p-1.5 rounded-lg bg-red-950/60 border border-red-500/30 text-red-300 hover:bg-red-900/80 cursor-pointer"
                      title="Xóa khỏi tủ sách"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CONSTELLATION MAP: ONLY SHOW CONSTELLATIONS CREATED BY THE USER */}
      <div className="p-6 rounded-3xl bg-[#071a3e]/90 border border-teal-400/30 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-400" />
            Bản Đồ Chòm Sao Tư Duy (Tạo ra từ Hành Tinh Liên Kết)
          </h3>
          <span className="text-xs text-teal-300">
            {user.createdConstellations?.length || 0} chòm sao đã thắp sáng
          </span>
        </div>

        {(!user.createdConstellations || user.createdConstellations.length === 0) ? (
          <div className="p-8 rounded-2xl bg-teal-950/20 border border-teal-500/10 text-center space-y-2">
            <div className="text-2xl">✨</div>
            <p className="text-xs sm:text-sm text-teal-200/80">
              Bạn chưa tạo chòm sao nào trên bản đồ vũ trụ.
            </p>
            <p className="text-[11px] text-teal-300">
              Hãy đến <strong>Hành Tinh Liên Kết (Connect)</strong> để nối các tác phẩm, nhân vật và vấn đề xã hội thành chòm sao đầu tiên của bạn!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {user.createdConstellations.map((constellation) => (
              <div
                key={constellation.id}
                className="p-4 rounded-2xl bg-teal-950/40 border border-teal-400/30 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                    {constellation.name}
                  </h4>
                  <span className="text-[10px] text-teal-300">{constellation.unlockedAt || "Gần đây"}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {constellation.connectedThemes?.map((theme, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-teal-900/60 text-teal-200 text-[10px] border border-teal-500/30"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-teal-100/90 italic">
                  {constellation.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* REAL COMPLETED ACTIVITIES HISTORY */}
      <div className="p-6 rounded-3xl bg-[#071a3e]/90 border border-sky-400/30 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            Lịch Sử Hoạt Động Thực Tế ({user.completedActivities?.length || 0})
          </h3>
          <span className="text-xs text-sky-300">Ghi nhận tiến trình thực sự</span>
        </div>

        {(!user.completedActivities || user.completedActivities.length === 0) ? (
          <div className="p-8 rounded-2xl bg-sky-950/20 border border-sky-500/10 text-center space-y-2">
            <p className="text-xs sm:text-sm text-sky-200/80">
              Bạn chưa có hoạt động nào được ghi nhận hoàn thành.
            </p>
            <p className="text-[11px] text-sky-400">
              Hãy bước lên tàu hỏa tiễn và tham gia thử thách tại các hành tinh Thám Tử, Đấu Trí, Liên Kết, Sáng Tạo hay Khám Phá!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {user.completedActivities.map((act) => (
              <div
                key={act.id}
                className="p-3.5 rounded-2xl bg-sky-950/60 border border-sky-500/20 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 text-sm">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">{act.activityTitle}</h4>
                    <span className="text-[10px] text-sky-400">{act.completedAt || (act as any).date || "Hôm nay"} • {act.planetId ? `Hành tinh ${act.planetId}` : "Thử thách"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-yellow-300 px-2.5 py-1 rounded-xl bg-yellow-400/10 border border-yellow-400/30">
                    +{act.score} điểm
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* REAL BADGES WON (NO DEFAULT / FAKE ONES) */}
      <div className="p-6 rounded-3xl bg-[#071a3e]/90 border border-yellow-400/30 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-300" />
            Huy Hiệu Đã Đạt Được ({user.badgesWon?.length || 0})
          </h3>
          <span className="text-xs text-yellow-300/80">Vinh danh sự kiên trì</span>
        </div>

        {(!user.badgesWon || user.badgesWon.length === 0) ? (
          <div className="p-8 rounded-2xl bg-yellow-950/10 border border-yellow-500/10 text-center space-y-2">
            <div className="text-2xl">🎖️</div>
            <p className="text-xs sm:text-sm text-yellow-200/80">
              Bạn chưa sở hữu huy hiệu nào.
            </p>
            <p className="text-[11px] text-yellow-300/70">
              Huy hiệu sẽ được trao tặng khi bạn nộp báo cáo thám tử, hoàn thành tổng kết tranh biện hoặc xuất bản sáng tác ngoại truyện.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {user.badgesWon.map((badge, idx) => (
              <div
                key={idx}
                className="px-4 py-2.5 rounded-2xl bg-yellow-950/40 border border-yellow-400/40 text-xs font-bold text-yellow-200 flex items-center gap-2 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                {badge}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

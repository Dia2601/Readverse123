import React, { useState } from "react";
import {
  Sparkles,
  Plus,
  Check,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Compass,
  Heart,
  Clock,
  Search,
  Users,
  UserCheck,
} from "lucide-react";
import { INITIAL_READ_WORKS, INTEREST_BADGES } from "../data/mockData";
import { UserProfile, UserWorkItem } from "../types";
import { RocketAvatar, ROCKET_SKINS } from "./RocketAvatar";
import { playPop, playSuccess, playTwinkle, playWarp } from "../utils/audio";
import { getStoredAccounts, saveAccountToStorage } from "../utils/accountManager";

interface OnboardingFlowProps {
  onComplete: (profile: UserProfile) => void;
  onCancel?: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onCancel }) => {
  // Existing accounts list
  const existingAccounts = getStoredAccounts();

  // Mode: 'register' or 'switch_account'
  const [flowMode, setFlowMode] = useState<"register" | "switch_account">(
    existingAccounts.length > 0 ? "switch_account" : "register"
  );

  // Stepper: 1: Name, 2: Read Works, 3: Interests, 4: Frequency, 5: Experience Level & Rocket Skin
  const [currentStep, setCurrentStep] = useState<number>(1);

  // STEP 1: Name (STARTS COMPLETELY EMPTY AS PER USER SPECIFICATION)
  const [astronautName, setAstronautName] = useState<string>("");

  // STEP 2: Read Works (STARTS COMPLETELY EMPTY AS PER USER SPECIFICATION)
  const [selectedWorks, setSelectedWorks] = useState<string[]>([]);
  const [customWorkInput, setCustomWorkInput] = useState<string>("");
  const [workSearchQuery, setWorkSearchQuery] = useState<string>("");

  // STEP 3: Interests (STARTS COMPLETELY EMPTY AS PER USER SPECIFICATION)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // STEP 4: Reading Frequency (STARTS UNSELECTED AS PER USER SPECIFICATION)
  const [readingFrequency, setReadingFrequency] = useState<
    "daily" | "few_times_week" | "weekend" | "free_time" | ""
  >("");

  // STEP 5: Experience Level (STARTS UNSELECTED AS PER USER SPECIFICATION)
  const [experienceLevel, setExperienceLevel] = useState<
    "not_set" | "beginner" | "exploring" | "regular" | "avid"
  >("not_set");

  // Rocket Skin
  const [selectedSkinKey, setSelectedSkinKey] = useState<string>("cyan");

  // Validation
  const canProceed = () => {
    if (currentStep === 1) return astronautName.trim().length > 0;
    // Step 2, 3, 4, 5 can be selected or optionally skipped/advanced
    return true;
  };

  const handleToggleWork = (title: string) => {
    playPop();
    if (selectedWorks.includes(title)) {
      setSelectedWorks(selectedWorks.filter((w) => w !== title));
    } else {
      setSelectedWorks([...selectedWorks, title]);
    }
  };

  const handleAddCustomWork = () => {
    const trimmed = customWorkInput.trim();
    if (!trimmed) return;
    if (!selectedWorks.includes(trimmed)) {
      setSelectedWorks([...selectedWorks, trimmed]);
      playPop();
    }
    setCustomWorkInput("");
  };

  const handleToggleInterest = (label: string) => {
    playPop();
    if (selectedInterests.includes(label)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== label));
    } else {
      setSelectedInterests([...selectedInterests, label]);
    }
  };

  // Derive Reading Style purely from user-chosen fields
  const deriveReadingStyle = (): string => {
    if (selectedInterests.length === 0 && !readingFrequency && experienceLevel === "not_set") {
      return "Phi hành gia khám phá";
    }
    if (selectedInterests.includes("Triết lý") || selectedInterests.includes("Bí ẩn")) {
      return "🌙 Người Thám Hiểm Chiêm Nghiệm";
    }
    if (selectedInterests.includes("Phiêu lưu") || selectedInterests.includes("Trưởng thành")) {
      return "⚡ Kỵ Sĩ Khám Phá Chân Trời";
    }
    if (selectedInterests.includes("Cảm xúc") || selectedInterests.includes("Tình bạn")) {
      return "🌸 Nhà Thơ Ngân Hà Đồng Cảm";
    }
    if (experienceLevel === "avid") {
      return "🔥 Nhà Du Hành Đam Mê Sách";
    }
    if (experienceLevel === "regular") {
      return "🌟 Phi Hành Gia Chăm Chỉ";
    }
    return "🌱 Mầm Non Tri Thức Ngân Hà";
  };

  const handleFinalize = () => {
    playSuccess();

    // Map selected works into workItems with status 'read'
    const workItems: UserWorkItem[] = selectedWorks.map((title) => {
      const known = INITIAL_READ_WORKS.find((w) => w.title === title);
      return {
        title: title,
        workTitle: title,
        author: known?.author || "Khuyết danh",
        status: "read",
        dateAdded: "Hôm nay",
      };
    });

    const newProfile: UserProfile = {
      id: `astronaut_${Date.now()}`,
      name: astronautName.trim(),
      avatarRocket: ROCKET_SKINS[selectedSkinKey] || ROCKET_SKINS.cyan,
      readingStyle: deriveReadingStyle(),
      readWorks: selectedWorks,
      exploringWorks: [],
      workItems,
      interests: selectedInterests,
      readingFrequency: readingFrequency,
      experienceLevel: experienceLevel,
      joinedDate: new Date().toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      starsCount: 0, // Starts at 0!
      visitedPlanets: [], // Starts at []!
      stats: {
        analysis: 0,
        multiPerspective: 0,
        criticalReasoning: 0,
        connection: 0,
        creativity: 0,
      }, // Starts at 0, strictly no fake scores!
      completedActivities: [], // Starts at []!
      createdConstellations: [], // Starts at []!
      badgesWon: [],
      savedCreations: [],
    };

    saveAccountToStorage(newProfile);
    playWarp();
    onComplete(newProfile);
  };

  // Switch to existing account
  const handleSelectExisting = (acc: UserProfile) => {
    playSuccess();
    playWarp();
    saveAccountToStorage(acc);
    onComplete(acc);
  };

  const filteredCatalogWorks = INITIAL_READ_WORKS.filter((w) => {
    const q = (workSearchQuery || "").toLowerCase().trim();
    if (!q) return true;
    return (
      (w.title || "").toLowerCase().includes(q) ||
      (w.author || "").toLowerCase().includes(q) ||
      (w.category || "").toLowerCase().includes(q)
    );
  });

  return (
    <div
      id="onboarding-flow"
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 select-none font-['Plus_Jakarta_Sans',sans-serif]"
    >
      <div className="max-w-2xl w-full rounded-3xl bg-[#092350]/92 border-2 border-sky-400/50 p-6 sm:p-8 shadow-[0_20px_60px_rgba(2,132,199,0.55)] backdrop-blur-xl text-sky-100 animate-in fade-in duration-300 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        {/* Existing Accounts Bar if available */}
        {existingAccounts.length > 0 && (
          <div className="mb-6 flex rounded-2xl bg-sky-950/70 p-1 border border-sky-500/30">
            <button
              onClick={() => {
                playPop();
                setFlowMode("register");
              }}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                flowMode === "register"
                  ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-md"
                  : "text-sky-300 hover:text-white"
              }`}
            >
              🚀 Tạo Tài Khoản Mới (Trống 100%)
            </button>
            <button
              onClick={() => {
                playPop();
                setFlowMode("switch_account");
              }}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                flowMode === "switch_account"
                  ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-md"
                  : "text-sky-300 hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Chọn Tài Khoản Đã Có ({existingAccounts.length})
            </button>
          </div>
        )}

        {/* MODE: SWITCH ACCOUNT */}
        {flowMode === "switch_account" && existingAccounts.length > 0 && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-2xl font-extrabold text-white font-['Outfit',sans-serif]">
                Chọn Phi Hành Gia
              </h3>
              <p className="text-xs text-sky-300/80 mt-1">
                Đăng nhập vào hồ sơ đã tạo trên thiết bị này
              </p>
            </div>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {existingAccounts.map((acc) => (
                <div
                  key={acc.id}
                  onClick={() => handleSelectExisting(acc)}
                  className="p-4 rounded-2xl bg-sky-950/60 hover:bg-sky-900/60 border border-sky-400/30 hover:border-cyan-300 transition-all flex items-center justify-between cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-900/80 border border-cyan-400/40 flex items-center justify-center">
                      <RocketAvatar customization={acc.avatarRocket} size="sm" isFlying={false} />
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-300">
                        {acc.name}
                      </h4>
                      <p className="text-xs text-sky-300/80">
                        {acc.readingStyle || "Phi hành gia khám phá"} • {acc.starsCount || 0} ★
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                      {acc.readWorks?.length || 0} tác phẩm đã đọc
                    </span>
                    <ArrowRight className="w-4 h-4 text-cyan-300 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-sky-800/40 text-center">
              <button
                onClick={() => {
                  playPop();
                  setFlowMode("register");
                }}
                className="text-xs text-cyan-300 hover:underline cursor-pointer"
              >
                + Hoặc tạo một tài khoản mới hoàn toàn (hồ sơ trống)
              </button>
            </div>
          </div>
        )}

        {/* MODE: REGISTER NEW ACCOUNT WITH STRICT 5-STEP PROCESS */}
        {flowMode === "register" && (
          <div>
            {/* Top Stepper Indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-[11px] font-bold text-sky-300 mb-2">
                <span>BƯỚC {currentStep} / 5</span>
                <span>
                  {currentStep === 1 && "Tên hiển thị"}
                  {currentStep === 2 && "Tác phẩm đã đọc"}
                  {currentStep === 3 && "Chủ đề yêu thích"}
                  {currentStep === 4 && "Tần suất đọc"}
                  {currentStep === 5 && "Cấp độ & Ngoại trang"}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-sky-950/80 overflow-hidden flex gap-1 p-0.5 border border-sky-600/30">
                {[1, 2, 3, 4, 5].map((stepNum) => (
                  <div
                    key={stepNum}
                    className={`h-full flex-1 rounded-full transition-all duration-300 ${
                      stepNum <= currentStep
                        ? "bg-gradient-to-r from-cyan-400 to-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]"
                        : "bg-sky-900/40"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* STEP 1: Name (Mandatory, Starts Empty) */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-400 to-sky-500 p-0.5 shadow-[0_0_20px_rgba(56,189,248,0.5)] mb-3 flex items-center justify-center">
                    <span className="text-3xl">🧑‍🚀</span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-white font-['Outfit',sans-serif]">
                    Tên Hiển Thị Của Bạn
                  </h3>
                  <p className="text-xs text-sky-300/80 mt-1 max-w-md mx-auto">
                    Hãy nhập tên hoặc biệt danh phi hành gia của bạn. Hồ sơ mới sẽ bắt đầu sạch sẽ, không có bất kỳ dữ liệu mẫu nào.
                  </p>
                </div>

                <div className="max-w-md mx-auto space-y-2">
                  <label className="block text-xs font-bold text-sky-200 text-left">
                    Tên phi hành gia: <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={astronautName}
                    onChange={(e) => setAstronautName(e.target.value)}
                    placeholder="Nhập tên của bạn (ví dụ: Bảo Hân, Minh Triết...)"
                    className="w-full px-4 py-3 rounded-2xl bg-sky-950/80 border border-sky-400/40 text-white placeholder-sky-400/40 focus:border-cyan-300 outline-none text-base font-semibold shadow-inner"
                  />
                  <p className="text-[11px] text-sky-400/70 text-left">
                    * Bắt buộc để định danh phi hành gia trong ngân hà READVERSE.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 2: Read Works (Starts Empty, searchable, explicit check) */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="text-left">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white font-['Outfit',sans-serif] flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-cyan-400" />
                    Bạn đã đọc những tác phẩm nào?
                  </h3>
                  <p className="text-xs text-sky-300/80 mt-1">
                    Chỉ những tác phẩm bạn thực sự chọn mới trở thành nguồn câu hỏi và thử thách trong các hành tinh. Nếu chưa đọc cuốn nào trong danh sách, bạn có thể tự nhập thêm hoặc bỏ qua để bổ sung sau.
                  </p>
                </div>

                {/* Search bar & count */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={workSearchQuery}
                      onChange={(e) => setWorkSearchQuery(e.target.value)}
                      placeholder="Tìm kiếm tác phẩm phổ biến hoặc tác giả..."
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-sky-950/70 border border-sky-500/30 text-xs text-white placeholder-sky-400/50 outline-none focus:border-cyan-300"
                    />
                  </div>
                  <span className="text-xs font-bold text-cyan-300 px-3 py-2 rounded-xl bg-sky-900/60 border border-sky-500/30 shrink-0">
                    Đã chọn: {selectedWorks.length}
                  </span>
                </div>

                {/* Literary catalog options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                  {filteredCatalogWorks.map((work) => {
                    const isSelected = selectedWorks.includes(work.title);
                    return (
                      <button
                        key={work.id}
                        onClick={() => handleToggleWork(work.title)}
                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                          isSelected
                            ? "bg-gradient-to-r from-sky-900/90 to-cyan-900/90 border-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.4)]"
                            : "bg-sky-950/40 hover:bg-sky-900/40 border-sky-500/20 text-sky-200"
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            {isSelected ? (
                              <Check className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                            ) : (
                              <span className="text-sky-400">○</span>
                            )}
                            <span>{work.title}</span>
                          </div>
                          <p className="text-[10px] text-sky-300/70 italic mt-0.5">
                            {work.author} • {work.category}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom work input */}
                <div className="flex items-center gap-2 pt-2 border-t border-sky-800/40">
                  <input
                    type="text"
                    value={customWorkInput}
                    onChange={(e) => setCustomWorkInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCustomWork()}
                    placeholder="Tự gõ thêm tác phẩm bạn đã đọc (ví dụ: Hoàng Tử Bé, Dế Mèn...)"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-sky-950/70 border border-sky-500/30 text-xs text-white placeholder-sky-400/40 outline-none focus:border-cyan-300"
                  />
                  <button
                    onClick={handleAddCustomWork}
                    className="px-3.5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#071330] text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Interests (Starts Empty, user picks or skips) */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="text-left">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white font-['Outfit',sans-serif] flex items-center gap-2">
                    <Compass className="w-5 h-5 text-yellow-300" />
                    Bạn yêu thích chủ đề nào?
                  </h3>
                  <p className="text-xs text-sky-300/80 mt-1">
                    Chọn những chủ đề khơi gợi sự tò mò nhất của bạn (hoặc có thể bỏ qua).
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[280px] overflow-y-auto pr-1">
                  {INTEREST_BADGES.map((badge) => {
                    const isSelected = selectedInterests.includes(badge.label);
                    return (
                      <button
                        key={badge.id}
                        onClick={() => handleToggleInterest(badge.label)}
                        className={`p-3 rounded-2xl text-left transition-all border cursor-pointer ${
                          isSelected
                            ? "bg-gradient-to-br from-cyan-900/80 to-sky-900/90 border-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.4)] scale-102"
                            : "bg-[#0b295c]/50 hover:bg-sky-800/40 border-sky-500/20 text-sky-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base">{badge.icon}</span>
                          <span className="text-xs font-bold text-white">{badge.label}</span>
                        </div>
                        <p className="text-[10px] text-sky-300/70">{badge.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 4: Reading Frequency */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="text-left">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white font-['Outfit',sans-serif] flex items-center gap-2">
                    <Clock className="w-5 h-5 text-teal-300" />
                    Bạn thường đọc với tần suất nào?
                  </h3>
                  <p className="text-xs text-sky-300/80 mt-1">
                    Không có câu trả lời sai — READVERSE thiết kế nhịp độ phù hợp với thói quen thực tế của bạn.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: "daily",
                      label: "Hàng ngày",
                      desc: "Mỗi ngày dành một chút thời gian cho trang sách",
                      icon: "☀️",
                    },
                    {
                      id: "few_times_week",
                      label: "Vài lần một tuần",
                      desc: "Đọc đều đặn những ngày rảnh rỗi trong tuần",
                      icon: "⚡",
                    },
                    {
                      id: "weekend",
                      label: "Cuối tuần",
                      desc: "Dành thời gian chiêm nghiệm thư thái vào thứ 7, CN",
                      icon: "🌙",
                    },
                    {
                      id: "free_time",
                      label: "Khi rảnh rỗi hoặc có hứng",
                      desc: "Tùy cảm hứng và thời gian sau giờ học",
                      icon: "✨",
                    },
                  ].map((freq) => (
                    <button
                      key={freq.id}
                      onClick={() => {
                        playPop();
                        setReadingFrequency(freq.id as typeof readingFrequency);
                      }}
                      className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                        readingFrequency === freq.id
                          ? "bg-gradient-to-r from-sky-900/90 to-teal-900/90 border-teal-400 shadow-[0_0_16px_rgba(45,212,191,0.4)] scale-102"
                          : "bg-sky-950/40 hover:bg-sky-900/40 border-sky-500/20 text-sky-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{freq.icon}</span>
                        <h4 className="text-sm font-bold text-white">{freq.label}</h4>
                      </div>
                      <p className="text-xs text-sky-300/70">{freq.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 5: Experience Level & Rocket Avatar */}
            {currentStep === 5 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="text-left">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white font-['Outfit',sans-serif] flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-400" />
                    Cấp độ đọc & Ngoại trang Hỏa Tiễn
                  </h3>
                  <p className="text-xs text-sky-300/80 mt-1">
                    Bước cuối cùng: Chọn mức độ bạn cảm thấy phù hợp và thiết lập diện mạo hỏa tiễn của mình.
                  </p>
                </div>

                {/* Level choices */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-sky-200 text-left">
                    Bạn cảm thấy mình đang ở mức độ đọc nào?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "beginner", label: "Mới bắt đầu", icon: "🌱" },
                      { id: "exploring", label: "Đang khám phá", icon: "🌙" },
                      { id: "regular", label: "Thường xuyên", icon: "⚡" },
                      { id: "avid", label: "Người mê sách", icon: "🔥" },
                    ].map((lvl) => (
                      <button
                        key={lvl.id}
                        onClick={() => {
                          playPop();
                          setExperienceLevel(lvl.id as typeof experienceLevel);
                        }}
                        className={`p-3 rounded-xl text-center border transition-all cursor-pointer ${
                          experienceLevel === lvl.id
                            ? "bg-gradient-to-b from-sky-500/30 to-cyan-500/40 border-cyan-400 text-white shadow-md scale-102"
                            : "bg-[#0b295c]/50 hover:bg-sky-800/40 border-sky-500/20 text-sky-300"
                        }`}
                      >
                        <div className="text-xl mb-1">{lvl.icon}</div>
                        <div className="text-xs font-bold">{lvl.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rocket Customizer */}
                <div className="p-4 rounded-2xl bg-sky-950/60 border border-sky-500/30 flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#09224f] border border-cyan-400/30 w-24 h-28 shrink-0">
                    <RocketAvatar customization={ROCKET_SKINS[selectedSkinKey]} size="md" isFlying={false} />
                  </div>
                  <div className="flex-1 w-full text-left">
                    <h5 className="text-xs font-bold text-white mb-1">Màu sắc hỏa tiễn:</h5>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(ROCKET_SKINS).map(([k, skin]) => (
                        <button
                          key={k}
                          onClick={() => {
                            playPop();
                            setSelectedSkinKey(k);
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
                            selectedSkinKey === k
                              ? "bg-cyan-500 text-[#071330] border-white shadow-sm scale-105"
                              : "bg-[#0d3168] text-sky-200 border-sky-500/30"
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: skin.hullColor }}
                          />
                          {skin.styleName.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="mt-7 pt-4 border-t border-sky-800/40 flex items-center justify-between gap-3">
              {currentStep > 1 ? (
                <button
                  onClick={() => {
                    playPop();
                    setCurrentStep(currentStep - 1);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-sky-950/70 hover:bg-sky-900 border border-sky-500/30 text-sky-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Quay lại
                </button>
              ) : (
                <div />
              )}

              {currentStep < 5 ? (
                <button
                  onClick={() => {
                    playTwinkle();
                    setCurrentStep(currentStep + 1);
                  }}
                  disabled={!canProceed()}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-300 hover:to-sky-400 text-[#071330] text-xs sm:text-sm font-extrabold flex items-center gap-2 cursor-pointer disabled:opacity-40 shadow-md active:scale-95"
                >
                  Tiếp theo <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  id="complete-registration-btn"
                  onClick={handleFinalize}
                  disabled={!canProceed()}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-teal-300 hover:from-cyan-300 hover:to-sky-300 text-[#071330] text-sm font-extrabold flex items-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(56,189,248,0.6)] active:scale-95"
                >
                  <Sparkles className="w-4 h-4" /> Hoàn Tất & Bước Vào Vũ Trụ
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

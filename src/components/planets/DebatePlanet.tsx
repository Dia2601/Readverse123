import React, { useState, useEffect } from "react";
import { Swords, Shield, Sparkles, Award, ArrowRight, Brain, Scale, RefreshCw, BookOpen, AlertCircle, CheckCircle2, MessageSquare } from "lucide-react";
import { DebateTopic, UserProfile } from "../../types";
import { INITIAL_DEBATE_TOPICS, SUGGESTED_READING_WORKS } from "../../data/mockData";
import { playPop, playSuccess, playTwinkle } from "../../utils/audio";

interface DebatePlanetProps {
  user: UserProfile;
  onActivityComplete: (title: string, score: number, badge: string, planetId?: string) => void;
  onAddReadWork?: (work: string) => void;
}

export const DebatePlanet: React.FC<DebatePlanetProps> = ({
  user,
  onActivityComplete,
  onAddReadWork,
}) => {
  const [availableTopics, setAvailableTopics] = useState<DebateTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<DebateTopic | null>(null);
  const [chosenPosition, setChosenPosition] = useState<"A" | "B" | null>(null);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [playerInput, setPlayerInput] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isGeneratingTopic, setIsGeneratingTopic] = useState<boolean>(false);
  const [isConcluding, setIsConcluding] = useState<boolean>(false);
  const [newWorkInput, setNewWorkInput] = useState<string>("");

  // Debate conversation history
  const [debateHistory, setDebateHistory] = useState<
    Array<{
      round: number;
      speaker: "player" | "ai";
      text: string;
      tip?: string;
      strengths?: string;
    }>
  >([]);

  // Final evaluation from AI synthesis
  const [finalConclusion, setFinalConclusion] = useState<{
    logicScore: number;
    perspectiveScore: number;
    empathyScore: number;
    badge: string;
    synthesis: string;
    strengths: string;
    growthAreas: string;
  } | null>(null);

  // Load or generate debate topic based on user.readWorks
  useEffect(() => {
    if (!user.readWorks || user.readWorks.length === 0) {
      setAvailableTopics([]);
      setSelectedTopic(null);
      return;
    }

    const matched = INITIAL_DEBATE_TOPICS.filter((t) =>
      user.readWorks.some((rw) => {
        if (!rw || !t?.workTitle) return false;
        const rwLow = rw.toLowerCase().trim();
        const tLow = t.workTitle.toLowerCase().trim();
        return rwLow.includes(tLow) || tLow.includes(rwLow);
      })
    );

    if (matched.length > 0) {
      setAvailableTopics(matched);
      if (!selectedTopic || !matched.some((m) => m.id === selectedTopic.id)) {
        setSelectedTopic(matched[0]);
      }
    } else {
      generateTopicForWork(user.readWorks[0]);
    }
  }, [user.readWorks]);

  const generateTopicForWork = async (workTitle: string) => {
    setIsGeneratingTopic(true);
    playTwinkle();
    try {
      const res = await fetch("/api/debate/generate-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workTitle }),
      });
      const data = await res.json();
      if (data && data.dilemma) {
        const topic: DebateTopic = {
          id: "dyn-deb-" + Date.now(),
          workTitle: data.workRef || workTitle,
          title: data.title || `Tranh biện về ${workTitle}`,
          dilemma: data.dilemma,
          stanceA: data.stanceA,
          stanceB: data.stanceB,
          rounds: 3,
        };
        setAvailableTopics((prev) => [topic, ...prev]);
        setSelectedTopic(topic);
      }
    } catch {
      const fallback: DebateTopic = {
        id: "fb-deb-" + Date.now(),
        workTitle: workTitle,
        title: `Lựa chọn số phận trong ${workTitle}`,
        dilemma: `Trong ${workTitle}, hành động then chốt của nhân vật là sự lựa chọn dũng cảm hay là biểu hiện của sự buông xuôi trước thời cuộc?`,
        stanceA: "Đó là quyết định can đảm để giữ gìn nhân phẩm và tình cảm cốt lõi.",
        stanceB: "Đó là sự đầu hàng bi kịch trước những áp bức nặng nề của hoàn cảnh.",
        rounds: 3,
      };
      setAvailableTopics((prev) => [fallback, ...prev]);
      setSelectedTopic(fallback);
    } finally {
      setIsGeneratingTopic(false);
    }
  };

  const handleSelectTopic = (t: DebateTopic) => {
    playPop();
    setSelectedTopic(t);
    setChosenPosition(null);
    setCurrentRound(1);
    setPlayerInput("");
    setDebateHistory([]);
    setFinalConclusion(null);
  };

  const handleChoosePosition = (pos: "A" | "B") => {
    if (!selectedTopic) return;
    playTwinkle();
    setChosenPosition(pos);
    setCurrentRound(1);
    const chosenStanceText = pos === "A" ? selectedTopic.stanceA : selectedTopic.stanceB;
    const initialPrompt = `Chào bạn! Bạn đã chọn đứng về lập trường: "${chosenStanceText}". Hãy khởi động Vòng 1 bằng luận cứ nòng cốt mạnh nhất của bạn!`;
    setDebateHistory([{ round: 1, speaker: "ai", text: initialPrompt }]);
  };

  const handleAdvanceRound = async () => {
    if (!selectedTopic || !chosenPosition || !playerInput.trim() || isProcessing) return;

    playTwinkle();
    setIsProcessing(true);
    const updatedHistory = [
      ...debateHistory,
      { round: currentRound, speaker: "player" as const, text: playerInput },
    ];
    setDebateHistory(updatedHistory);
    const submittedText = playerInput;
    setPlayerInput("");

    try {
      const res = await fetch("/api/debate/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: selectedTopic.dilemma,
          round: currentRound,
          playerPosition: chosenPosition === "A" ? selectedTopic.stanceA : selectedTopic.stanceB,
          playerInput: submittedText,
          history: updatedHistory,
        }),
      });
      const data = await res.json();

      setDebateHistory((prev) => [
        ...prev,
        {
          round: currentRound + 1,
          speaker: "ai",
          text: data.counterArgument,
          tip: data.coachingTip,
        },
      ]);
      setCurrentRound(currentRound + 1);
    } catch {
      setDebateHistory((prev) => [
        ...prev,
        {
          round: currentRound + 1,
          speaker: "ai",
          text: `Một góc nhìn phản biện: Nếu đứng ở lập trường ngược lại, có thể cho rằng nghịch cảnh quá lớn đã tước đoạt quyền tự do ý chí. Bạn có dẫn chứng hành động nào để bác bỏ điều này?`,
          tip: "Bổ sung dẫn chứng chi tiết về hành động của nhân vật.",
        },
      ]);
      setCurrentRound(currentRound + 1);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConcludeDebate = async () => {
    if (!selectedTopic || !chosenPosition || isConcluding || currentRound < 3) return;

    setIsConcluding(true);
    playTwinkle();

    try {
      const res = await fetch("/api/debate/conclude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: selectedTopic.dilemma,
          playerPosition: chosenPosition === "A" ? selectedTopic.stanceA : selectedTopic.stanceB,
          history: debateHistory,
          roundsCount: currentRound - 1,
        }),
      });
      const data = await res.json();
      setFinalConclusion(data);
      playSuccess();

      // Only on conclusion is activity completed!
      const avgScore = Math.round(
        ((data.logicScore || 88) + (data.perspectiveScore || 90) + (data.empathyScore || 88)) / 3
      );
      onActivityComplete(
        `Đấu trí tranh biện: ${selectedTopic.workTitle}`,
        avgScore,
        data.badge || "Hiệp Sĩ Đa Chiều",
        "debate"
      );
    } catch {
      const fallback = {
        logicScore: 88,
        perspectiveScore: 92,
        empathyScore: 90,
        badge: "Hiệp Sĩ Đa Chiều",
        synthesis: "Tranh biện xuất sắc! Bạn đã bảo vệ quan điểm vững vàng đồng thời thể hiện sự thấu cảm cao đối với góc nhìn đối lập.",
        strengths: "Lập luận mạch lạc, tôn trọng sự phức tạp của nhân vật văn học.",
        growthAreas: "Tiếp tục liên hệ thêm với bối cảnh xã hội ngày nay.",
      };
      setFinalConclusion(fallback);
      playSuccess();
      onActivityComplete(
        `Đấu trí tranh biện: ${selectedTopic.workTitle}`,
        90,
        "Hiệp Sĩ Đa Chiều",
        "debate"
      );
    } finally {
      setIsConcluding(false);
    }
  };

  const handleQuickAddBook = (work: string) => {
    playPop();
    if (onAddReadWork) {
      onAddReadWork(work);
    }
    generateTopicForWork(work);
  };

  return (
    <div id="planet-debate" className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0b2447]/90 via-[#19376d]/80 to-[#0b1b3d]/90 border border-blue-400/40 shadow-[0_12px_32px_rgba(30,58,138,0.4)] backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-left">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-400 p-0.5 shadow-[0_0_20px_rgba(96,165,250,0.5)] shrink-0 flex items-center justify-center">
            <div className="w-full h-full rounded-2xl bg-[#091e3e] flex items-center justify-center text-3xl">
              ⚔️
            </div>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-300 px-2.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/30">
              ĐẤU TRƯỜNG TƯ DUY ĐA CHIỀU
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit',sans-serif] mt-1">
              Hành Tinh Đấu Trí
            </h2>
            <p className="text-xs sm:text-sm text-sky-200/80">
              Đối thoại phản biện cùng AI để tôi luyện góc nhìn, dung nạp quan điểm đối lập.
            </p>
          </div>
        </div>

        {/* Topic selector */}
        {availableTopics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-end">
            {availableTopics.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelectTopic(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedTopic?.id === t.id
                    ? "bg-sky-500 text-white shadow-[0_0_12px_rgba(56,189,248,0.6)]"
                    : "bg-sky-950/60 hover:bg-sky-900/50 text-sky-300 border border-sky-500/30"
                }`}
              >
                {t.workTitle}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* STATE 1: EMPTY READ WORKS -> REQUIRED NOTIFICATION */}
      {(!user.readWorks || user.readWorks.length === 0) && (
        <div className="p-8 rounded-3xl bg-[#081e42]/90 border border-sky-400/40 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center mx-auto text-3xl">
            ⚖️
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-white">Bạn chưa có tác phẩm nào trong danh sách đã đọc</h3>
            <p className="text-xs sm:text-sm text-sky-200/80 leading-relaxed">
              Hãy chọn tác phẩm bạn từng đọc để bắt đầu chủ đề tranh biện phù hợp! AI sẽ chuẩn bị đấu trường riêng cho bạn.
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
                  className="px-3 py-1.5 rounded-xl bg-sky-900/50 hover:bg-sky-800/70 border border-sky-400/30 text-xs font-semibold text-sky-200 hover:text-white transition-all cursor-pointer"
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
              className="flex-1 px-4 py-2 rounded-xl bg-sky-950/80 border border-sky-400/40 text-xs text-white placeholder-sky-300/40 outline-none focus:border-cyan-300"
            />
            <button
              onClick={() => {
                if (newWorkInput.trim()) {
                  handleQuickAddBook(newWorkInput.trim());
                  setNewWorkInput("");
                }
              }}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Thêm & Tạo chủ đề
            </button>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isGeneratingTopic && (
        <div className="p-8 rounded-3xl bg-[#081e42]/90 border border-sky-400/30 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-sky-400 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-sky-200">AI Komi đang phân tích tác phẩm và thiết lập chủ đề tranh biện cho bạn...</p>
        </div>
      )}

      {/* Topic Card & Position Picker */}
      {!isGeneratingTopic && selectedTopic && (
        <div className="p-6 rounded-3xl bg-[#091e3e]/90 border border-sky-400/30 shadow-lg text-left space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-sky-500/20">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                Thế Lưỡng Nan — {selectedTopic.workTitle}
              </span>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-900/60 text-blue-200 border border-blue-400/30">
              Tối thiểu 3 lượt tranh biện
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-sky-950/50 border border-sky-400/30">
            <span className="text-[11px] font-bold text-yellow-300 uppercase tracking-wide block mb-1">
              ❓ Tình huống tranh luận:
            </span>
            <p className="text-base sm:text-lg font-bold text-white leading-relaxed font-serif">
              “{selectedTopic.dilemma}”
            </p>
          </div>

          {/* Stance Choice */}
          {!chosenPosition ? (
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-sky-200 block">
                🎯 Hãy chọn lập trường của bạn để bước vào đấu trường:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => handleChoosePosition("A")}
                  className="p-4 rounded-2xl bg-[#0a234f]/70 hover:bg-[#0f2e66] border border-cyan-400/40 hover:border-cyan-300 transition-all text-left group cursor-pointer"
                >
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 mb-2 inline-block">
                    Quan điểm A
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-white group-hover:text-cyan-200">
                    {selectedTopic.stanceA}
                  </p>
                </button>

                <button
                  onClick={() => handleChoosePosition("B")}
                  className="p-4 rounded-2xl bg-[#0a234f]/70 hover:bg-[#0f2e66] border border-indigo-400/40 hover:border-indigo-300 transition-all text-left group cursor-pointer"
                >
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-400/20 text-indigo-300 border border-indigo-400/30 mb-2 inline-block">
                    Quan điểm B
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-white group-hover:text-indigo-200">
                    {selectedTopic.stanceB}
                  </p>
                </button>
              </div>
            </div>
          ) : (
            /* Active Debate Conversation Feed */
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-sky-500/20">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Lập trường của bạn:</span>
                  <span className="text-xs font-bold text-cyan-300 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/30">
                    {chosenPosition === "A" ? selectedTopic.stanceA : selectedTopic.stanceB}
                  </span>
                </div>
                <span className="text-xs text-sky-400 font-semibold">
                  Lượt trao đổi: {Math.min(currentRound, 5)}/5 (Cần tối thiểu 3 lượt)
                </span>
              </div>

              {/* Conversation Messages */}
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {debateHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      item.speaker === "player"
                        ? "bg-gradient-to-r from-sky-600/90 to-cyan-600/90 text-white ml-8 shadow-sm"
                        : "bg-sky-950/80 text-sky-100 mr-8 border border-sky-400/20"
                    }`}
                  >
                    <div className="text-[10px] font-bold text-sky-300/80 mb-1">
                      {item.speaker === "player" ? "Bạn (Phi hành gia)" : `Trọng tài AI (Vòng ${item.round})`}
                    </div>
                    <p>{item.text}</p>
                    {item.tip && (
                      <div className="mt-2 pt-2 border-t border-sky-400/20 text-xs text-yellow-300 italic flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" /> Gợi ý củng cố: {item.tip}
                      </div>
                    )}
                  </div>
                ))}

                {isProcessing && (
                  <div className="p-3 rounded-2xl bg-sky-950/50 border border-sky-400/20 text-xs text-cyan-300 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border border-cyan-300 border-t-transparent animate-spin" />
                    Trọng tài AI đang lắng nghe và chuẩn bị phản biện đối lập...
                  </div>
                )}
              </div>

              {/* Player Input Area if not concluded */}
              {!finalConclusion && (
                <div className="space-y-3 pt-2">
                  <textarea
                    rows={3}
                    value={playerInput}
                    onChange={(e) => setPlayerInput(e.target.value)}
                    placeholder="Viết phản hồi của bạn: chỉ ra điểm hợp lý của phía đối lập và củng cố thêm dẫn chứng từ tác phẩm..."
                    className="w-full px-4 py-3 rounded-2xl bg-sky-950/80 border border-sky-400/40 text-xs sm:text-sm text-white placeholder-sky-400/40 outline-none focus:border-cyan-300 resize-none"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-sky-300">
                      {currentRound <= 3 ? (
                        <span>Hoàn thành ít nhất 3 lượt để mở nút tổng kết.</span>
                      ) : (
                        <span className="text-emerald-400 font-bold">✓ Đã đủ điều kiện tổng kết tranh biện!</span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {/* Send round turn */}
                      <button
                        onClick={handleAdvanceRound}
                        disabled={!playerInput.trim() || isProcessing}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Gửi phản hồi lượt {currentRound}
                      </button>

                      {/* Conclude button (available after at least 3 rounds) */}
                      {currentRound >= 3 && (
                        <button
                          onClick={handleConcludeDebate}
                          disabled={isConcluding}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                        >
                          <Award className="w-3.5 h-3.5" /> Tổng kết tranh biện
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* FINAL SYNTHESIS MODAL / CARD */}
      {finalConclusion && (
        <div className="p-6 rounded-3xl bg-gradient-to-b from-[#082046]/95 to-[#0b2b5c]/95 border-2 border-cyan-400/50 shadow-[0_16px_40px_rgba(56,189,248,0.4)] backdrop-blur-md animate-in slide-in-from-bottom-6 duration-300 text-left space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-sky-500/30">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-300" />
              <h3 className="text-lg font-bold text-white font-['Outfit',sans-serif]">
                Bản Tổng Kết Tư Duy Đa Chiều Của AI
              </h3>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> {finalConclusion.badge}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-sky-950/60 border border-sky-400/30 text-center">
              <span className="text-[10px] text-sky-300 font-semibold block">Tư duy logic</span>
              <span className="text-xl font-extrabold text-cyan-300">{finalConclusion.logicScore}</span>
            </div>
            <div className="p-3 rounded-2xl bg-indigo-950/60 border border-indigo-400/30 text-center">
              <span className="text-[10px] text-indigo-300 font-semibold block">Tư duy đa chiều</span>
              <span className="text-xl font-extrabold text-purple-300">{finalConclusion.perspectiveScore}</span>
            </div>
            <div className="p-3 rounded-2xl bg-teal-950/60 border border-teal-400/30 text-center">
              <span className="text-[10px] text-teal-300 font-semibold block">Độ thấu cảm đối lập</span>
              <span className="text-xl font-extrabold text-teal-300">{finalConclusion.empathyScore}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-sky-950/50 border border-sky-500/30 space-y-2">
            <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Đánh giá năng lực tư duy:
            </h4>
            <p className="text-xs sm:text-sm text-sky-100 leading-relaxed">
              {finalConclusion.synthesis}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-200">
              <strong className="text-emerald-300 block mb-1">🌟 Điểm mạnh nổi bật:</strong>
              {finalConclusion.strengths}
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200">
              <strong className="text-amber-300 block mb-1">💡 Hướng phát triển thêm:</strong>
              {finalConclusion.growthAreas}
            </div>
          </div>

          <div className="pt-2 text-right">
            <span className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Đã hoàn thành thử thách tranh biện & ghi nhận điểm tư duy đa chiều vào hồ sơ!
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

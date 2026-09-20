import React, { useState } from "react";
import { Sparkles, MessageCircle, X, Send, Lightbulb, Compass, Brain } from "lucide-react";
import { playPop, playTwinkle } from "../utils/audio";

interface KomiCompanionProps {
  astronautName: string;
  currentPlanetName?: string;
  contextText?: string;
}

interface ChatMessage {
  sender: "komi" | "user";
  text: string;
}

export const KomiCompanion: React.FC<KomiCompanionProps> = ({
  astronautName,
  currentPlanetName = "Vũ Trụ READVERSE",
  contextText = "Đang khám phá tri thức",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "komi",
      text: `Chào ${astronautName || "phi hành gia"}! Mình là Komi - bạn đồng hành vũ trụ của bạn. Khi cần một góc nhìn mới hoặc muốn đào sâu vào trang sách, hãy gọi mình nhé! ✨`,
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const toggleOpen = () => {
    playPop();
    setIsOpen(!isOpen);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText;
    if (!textToSend.trim() || isLoading) return;

    playTwinkle();
    const newMessages: ChatMessage[] = [...messages, { sender: "user", text: textToSend }];
    setMessages(newMessages);
    if (!customPrompt) setInputText("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/companion/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          context: contextText,
          astronautName: astronautName || "Phi hành gia",
          currentPlanet: currentPlanetName,
        }),
      });
      const data = await res.json();
      setMessages([
        ...newMessages,
        {
          sender: "komi",
          text: data.reply || "Komi luôn lắng nghe suy tư của bạn!",
        },
      ]);
    } catch {
      setMessages([
        ...newMessages,
        {
          sender: "komi",
          text: `Một câu hỏi rất sắc sảo! Bạn thử suy ngẫm xem: nếu đổi góc nhìn từ nhân vật chính sang một người ngoài cuộc chứng kiến, ý nghĩa câu chuyện sẽ thay đổi ra sao?`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    { label: "Gợi ý góc nhìn đa chiều", icon: Compass, prompt: "Hãy gợi ý cho mình một góc nhìn phản biện hoặc góc khuất của tác phẩm này?" },
    { label: "Đào sâu động cơ nhân vật", icon: Brain, prompt: "Làm sao để giải mã động cơ tâm lý sâu kín của nhân vật này?" },
    { label: "Liên hệ thực tế hôm nay", icon: Lightbulb, prompt: "Tác phẩm này kết nối như thế nào với thế hệ học sinh chúng mình ngày nay?" },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-auto font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Dialog Window */}
      {isOpen && (
        <div
          id="komi-chat-box"
          className="mb-3 w-80 sm:w-96 rounded-3xl bg-[#09224f]/95 border border-sky-400/40 p-4 shadow-[0_12px_36px_rgba(2,132,199,0.4)] backdrop-blur-md text-sky-100 animate-in fade-in slide-in-from-bottom-5 duration-300 flex flex-col max-h-[460px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-sky-500/20">
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-sky-300 p-0.5 shadow-[0_0_12px_rgba(56,189,248,0.6)]">
                <div className="w-full h-full rounded-full bg-[#0b2959] flex items-center justify-center text-sm">
                  ✨
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-sky-200 flex items-center gap-1.5">
                  Komi <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">Trợ lý Vũ Trụ</span>
                </h4>
                <p className="text-[11px] text-sky-400/80 truncate max-w-[180px]">{currentPlanetName}</p>
              </div>
            </div>
            <button
              onClick={toggleOpen}
              className="p-1 rounded-full text-sky-400 hover:text-white hover:bg-sky-700/40 transition-colors"
              title="Đóng cửa sổ"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1 text-xs scrollbar-thin scrollbar-thumb-sky-500/30">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.sender === "komi" && (
                  <div className="w-5 h-5 rounded-full bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    🌟
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl max-w-[82%] leading-relaxed ${
                    m.sender === "user"
                      ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white rounded-tr-xs shadow-sm font-medium"
                      : "bg-[#0f346c]/90 text-sky-100 rounded-tl-xs border border-sky-400/20"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-cyan-300 text-xs italic py-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                Komi đang tư duy cùng các vì sao...
              </div>
            )}
          </div>

          {/* Quick thought starters */}
          <div className="py-2 border-t border-sky-500/20 flex flex-wrap gap-1.5">
            {quickPrompts.map((qp, i) => {
              const Icon = qp.icon;
              return (
                <button
                  key={i}
                  onClick={() => handleSendMessage(qp.prompt)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-sky-900/60 hover:bg-cyan-600/30 border border-sky-400/30 text-sky-200 flex items-center gap-1 transition-all active:scale-95"
                >
                  <Icon className="w-3 h-3 text-cyan-400" />
                  {qp.label}
                </button>
              );
            })}
          </div>

          {/* Input field */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Nhắn tin với Komi..."
              className="flex-1 text-xs px-3.5 py-2 rounded-full bg-sky-950/60 border border-sky-500/30 focus:border-cyan-400 outline-none text-sky-100 placeholder-sky-400/50"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputText.trim()}
              className="p-2 rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-300 hover:to-sky-400 text-[#071330] disabled:opacity-40 transition-transform active:scale-90 shadow-[0_0_10px_rgba(56,189,248,0.5)]"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Mascot Trigger Button */}
      <button
        id="komi-mascot-trigger"
        onClick={toggleOpen}
        className="group relative flex items-center gap-3 p-2 pr-4 rounded-full bg-gradient-to-r from-[#0c2f66] to-[#0a2552] border border-cyan-400/60 shadow-[0_8px_24px_rgba(2,132,199,0.5)] hover:shadow-[0_8px_32px_rgba(56,189,248,0.7)] transition-all duration-300 hover:scale-105 active:scale-95"
      >
        {/* Animated Cute Bot / Star Creature */}
        <div className="relative w-12 h-12 flex items-center justify-center">
          {/* Halo Glow */}
          <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-sm animate-ping duration-1000" />
          {/* Character Body (Cute Round Cosmic Guide) */}
          <svg width="46" height="46" viewBox="0 0 46 46" fill="none" className="filter drop-shadow-md">
            {/* Soft Antenna */}
            <line x1="23" y1="12" x2="23" y2="4" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="23" cy="4" r="3" fill="#facc15" className="animate-pulse" />
            {/* Outer Head */}
            <circle cx="23" cy="25" r="17" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
            {/* Visor face */}
            <rect x="12" y="18" width="22" height="14" rx="7" fill="#071330" />
            {/* Blinking Cute Eyes */}
            <circle cx="18" cy="24" r="2.5" fill="#38bdf8" />
            <circle cx="28" cy="24" r="2.5" fill="#38bdf8" />
            {/* Eye reflections */}
            <circle cx="19" cy="23" r="0.9" fill="#ffffff" />
            <circle cx="29" cy="23" r="0.9" fill="#ffffff" />
            {/* Cute Rosy Cheeks */}
            <ellipse cx="14" cy="28" rx="2" ry="1" fill="#f472b6" fillOpacity="0.7" />
            <ellipse cx="32" cy="28" rx="2" ry="1" fill="#f472b6" fillOpacity="0.7" />
          </svg>
        </div>

        <div className="text-left">
          <div className="text-xs font-extrabold text-cyan-300 flex items-center gap-1 tracking-wide">
            Komi <Sparkles className="w-3 h-3 text-yellow-300" />
          </div>
          <div className="text-[10px] text-sky-200/80">Bạn đồng hành vũ trụ</div>
        </div>
      </button>
    </div>
  );
};

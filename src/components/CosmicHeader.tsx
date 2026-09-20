import React, { useState } from "react";
import { Sparkles, Compass, Volume2, VolumeX, BookOpen, Map, ArrowLeft, Users, UserPlus, ChevronDown, LogOut } from "lucide-react";
import { Planet, UserProfile } from "../types";
import { RocketAvatar } from "./RocketAvatar";
import { isSoundMuted, playPop, toggleSound } from "../utils/audio";
import { getStoredAccounts } from "../utils/accountManager";

interface CosmicHeaderProps {
  user: UserProfile;
  activeView: "map" | "journey" | "recommendations" | "planet" | "reconstruct" | "perspective-detail";
  activePlanet: Planet | null;
  onNavigate: (view: "map" | "journey" | "recommendations") => void;
  onBackToMap: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onSwitchAccount?: (account: UserProfile) => void;
  onCreateNewAccount?: () => void;
}

export const CosmicHeader: React.FC<CosmicHeaderProps> = ({
  user,
  activeView,
  activePlanet,
  onNavigate,
  onBackToMap,
  soundEnabled,
  onToggleSound,
  onSwitchAccount,
  onCreateNewAccount,
}) => {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accounts = getStoredAccounts();

  return (
    <header className="sticky top-0 z-40 w-full px-4 sm:px-8 py-3 bg-[#06173d]/85 backdrop-blur-md border-b border-sky-400/25 flex items-center justify-between gap-3 select-none">
      {/* Left: Brand Logo / Back to Universe button */}
      <div className="flex items-center gap-3">
        {activeView === "planet" || activeView === "reconstruct" || activeView === "perspective-detail" ? (
          <button
            onClick={() => {
              playPop();
              onBackToMap();
            }}
            className="px-3.5 py-1.5 rounded-full bg-sky-900/70 hover:bg-sky-800/80 border border-sky-400/40 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Trở lại Vũ Trụ
          </button>
        ) : (
          <div
            onClick={() => onNavigate("map")}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-sky-500 p-0.5 shadow-[0_0_12px_rgba(56,189,248,0.6)] flex items-center justify-center">
              <span className="text-sm">🪐</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-wider font-['Outfit',sans-serif] bg-gradient-to-r from-white via-sky-100 to-cyan-300 bg-clip-text text-transparent group-hover:brightness-110">
                READVERSE
              </h1>
              <span className="text-[10px] text-sky-400/80 -mt-1 block hidden sm:block">
                Cosmic Reading Universe
              </span>
            </div>
          </div>
        )}

        {/* Current Planet Indicator if in planet view */}
        {activePlanet && activeView === "planet" && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/70 border border-sky-400/30 text-xs">
            <span className="text-base">{activePlanet.icon}</span>
            <span className="font-bold text-white">{activePlanet.name}</span>
          </div>
        )}
      </div>

      {/* Center: Main Universe Tabs */}
      <nav className="flex items-center gap-1 sm:gap-2 p-1 rounded-full bg-[#082250]/90 border border-sky-400/30">
        <button
          onClick={() => {
            playPop();
            onNavigate("map");
          }}
          className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeView === "map"
              ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-sm"
              : "text-sky-300 hover:text-white"
          }`}
        >
          <span>🌌</span>
          <span className="hidden sm:inline">Vũ Trụ</span>
        </button>

        <button
          onClick={() => {
            playPop();
            onNavigate("journey");
          }}
          className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeView === "journey"
              ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-sm"
              : "text-sky-300 hover:text-white"
          }`}
        >
          <span>🗺️</span>
          <span className="hidden sm:inline">Hành Trình Đọc</span>
        </button>

        <button
          onClick={() => {
            playPop();
            onNavigate("recommendations");
          }}
          className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeView === "recommendations"
              ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-sm"
              : "text-sky-300 hover:text-white"
          }`}
        >
          <span>🔭</span>
          <span className="hidden sm:inline">Vũ Trụ Đề Xuất</span>
        </button>
      </nav>

      {/* Right: Pilot Status Capsule & Audio Toggle */}
      <div className="flex items-center gap-2 relative">
        {/* Sound toggle button */}
        <button
          onClick={onToggleSound}
          className="p-2 rounded-full bg-sky-950/70 hover:bg-sky-900 border border-sky-500/30 text-sky-300 hover:text-cyan-300 transition-colors cursor-pointer"
          title={soundEnabled ? "Tắt âm thanh hiệu ứng" : "Bật âm thanh hiệu ứng"}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-sky-500" />}
        </button>

        {/* Astronaut Pill / Account Button */}
        <div className="relative">
          <button
            onClick={() => {
              playPop();
              setAccountMenuOpen(!accountMenuOpen);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#0c2f66] to-[#082046] hover:border-cyan-300 border border-cyan-400/40 shadow-sm cursor-pointer transition-all active:scale-95"
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <RocketAvatar customization={user.avatarRocket} size="sm" isFlying={false} showTrail={false} />
            </div>

            <div className="text-left hidden md:block">
              <div className="text-xs font-extrabold text-white leading-tight truncate max-w-[90px]">
                {user.name || "Phi hành gia"}
              </div>
              <div className="text-[10px] text-cyan-300 leading-none truncate max-w-[90px]">
                {user.readingStyle ? user.readingStyle.split(" ")[1] || user.readingStyle : "Chưa cập nhật"}
              </div>
            </div>

            {/* Star currency badge */}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 text-xs font-extrabold">
              <span>★</span>
              <span>{user.starsCount}</span>
            </div>

            <ChevronDown className="w-3 h-3 text-sky-300" />
          </button>

          {/* Account Dropdown Menu */}
          {accountMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-[#09224f]/95 border border-cyan-400/40 shadow-[0_12px_36px_rgba(2,132,199,0.5)] backdrop-blur-xl p-3 z-50 text-left animate-in fade-in zoom-in-95 duration-200">
              <div className="pb-2.5 border-b border-sky-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-sky-400 block">
                    Tài khoản hiện tại
                  </span>
                  <div className="text-sm font-extrabold text-white">{user.name || "Chưa đặt tên"}</div>
                  <div className="text-xs text-cyan-300">{user.readingStyle || "Phi hành gia khám phá"}</div>
                </div>
                <div className="px-2 py-1 rounded-xl bg-yellow-400/15 border border-yellow-400/30 text-xs font-bold text-yellow-300">
                  {user.starsCount} ★
                </div>
              </div>

              {/* Other accounts if any */}
              {accounts.length > 1 && (
                <div className="py-2 space-y-1">
                  <span className="text-[10px] text-sky-400/80 font-bold block px-1">
                    Đổi tài khoản khác:
                  </span>
                  {accounts
                    .filter((a) => a.id !== user.id)
                    .map((acc) => (
                      <button
                        key={acc.id}
                        onClick={() => {
                          setAccountMenuOpen(false);
                          if (onSwitchAccount) onSwitchAccount(acc);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-xl hover:bg-sky-900/60 flex items-center justify-between text-xs text-sky-200 cursor-pointer"
                      >
                        <span className="font-semibold text-white truncate max-w-[140px]">{acc.name}</span>
                        <span className="text-[11px] text-yellow-300">{acc.starsCount || 0} ★</span>
                      </button>
                    ))}
                </div>
              )}

              {/* New Account Button */}
              <div className="pt-2 border-t border-sky-500/20 space-y-1">
                <button
                  onClick={() => {
                    setAccountMenuOpen(false);
                    if (onCreateNewAccount) onCreateNewAccount();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:brightness-110 cursor-pointer shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Tạo tài khoản mới (Hồ sơ trống)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};


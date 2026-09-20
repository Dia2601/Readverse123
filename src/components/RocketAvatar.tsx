import React from "react";
import { RocketCustomization } from "../types";

export const ROCKET_SKINS: Record<string, RocketCustomization> = {
  cyan: {
    styleName: "Sao Băng Lam (Cyan Comet)",
    hullColor: "#38bdf8",
    accentColor: "#0284c7",
    trailColor: "#67e8f9",
  },
  gold: {
    styleName: "Mặt Trời Nhỏ (Starlight Gold)",
    hullColor: "#facc15",
    accentColor: "#ca8a04",
    trailColor: "#fef08a",
  },
  coral: {
    styleName: "Hỏa Tiễn Hồng San Hô (Coral Nova)",
    hullColor: "#fb7185",
    accentColor: "#e11d48",
    trailColor: "#fda4af",
  },
  lavender: {
    styleName: "Cực Quang Tím (Lavender Aurora)",
    hullColor: "#c084fc",
    accentColor: "#9333ea",
    trailColor: "#e9d5ff",
  },
  emerald: {
    styleName: "Ngọc Lục Bảo Vũ Trụ (Cosmic Emerald)",
    hullColor: "#34d399",
    accentColor: "#059669",
    trailColor: "#a7f3d0",
  },
};

interface RocketAvatarProps {
  customization?: RocketCustomization;
  size?: "sm" | "md" | "lg" | "xl";
  isFlying?: boolean;
  className?: string;
  showTrail?: boolean;
}

export const RocketAvatar: React.FC<RocketAvatarProps> = ({
  customization = ROCKET_SKINS.cyan,
  size = "md",
  isFlying = false,
  className = "",
  showTrail = true,
}) => {
  const sizeMap = {
    sm: { width: 36, height: 48 },
    md: { width: 56, height: 72 },
    lg: { width: 84, height: 108 },
    xl: { width: 120, height: 154 },
  };

  const { width, height } = sizeMap[size];

  return (
    <div className={`relative inline-flex flex-col items-center justify-center ${className}`}>
      {/* Animated Sparkling Thruster Trail */}
      {showTrail && (
        <div
          className={`absolute -bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-300 ${
            isFlying ? "scale-150 opacity-100" : "scale-100 opacity-80"
          }`}
        >
          {/* Flame Core */}
          <div
            className="w-4 h-6 rounded-b-full animate-pulse blur-[0.5px]"
            style={{
              background: `linear-gradient(to bottom, #ffffff, #fef08a, ${customization.trailColor}, #f97316)`,
              boxShadow: `0 4px 14px ${customization.trailColor}`,
            }}
          />
          {/* Flame Tail Sparkles */}
          <div className="flex gap-1 -mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-200 animate-ping" />
            <span
              className="w-2 h-2 rounded-full animate-bounce"
              style={{ backgroundColor: customization.trailColor }}
            />
            <span className="w-1.5 h-1.5 rounded-full bg-orange-300 animate-ping delay-100" />
          </div>
        </div>
      )}

      {/* Handcrafted Cute Cartoon Rocket SVG */}
      <svg
        width={width}
        height={height}
        viewBox="0 0 100 130"
        fill="none"
        className={`filter drop-shadow-[0_8px_20px_rgba(56,189,248,0.4)] transition-transform duration-300 ${
          isFlying ? "animate-bounce" : ""
        }`}
      >
        <defs>
          <linearGradient id={`hullGrad-${customization.hullColor}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="30%" stopColor={customization.hullColor} />
            <stop offset="100%" stopColor={customization.accentColor} />
          </linearGradient>

          <linearGradient id="windowGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
        </defs>

        {/* Left Fin */}
        <path
          d="M26 80C14 86 6 104 8 114C18 114 30 102 32 94L26 80Z"
          fill={customization.accentColor}
          stroke="#071330"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Right Fin */}
        <path
          d="M74 80C86 86 94 104 92 114C82 114 70 102 68 94L74 80Z"
          fill={customization.accentColor}
          stroke="#071330"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Thruster Nozzle */}
        <path
          d="M38 100H62L58 110H42L38 100Z"
          fill="#475569"
          stroke="#071330"
          strokeWidth="3"
        />

        {/* Main Rocket Body (Rounded, cute cartoon shape) */}
        <path
          d="M50 8C32 28 26 62 26 98C26 102 36 104 50 104C64 104 74 102 74 98C74 62 68 28 50 8Z"
          fill={`url(#hullGrad-${customization.hullColor})`}
          stroke="#071330"
          strokeWidth="4"
          strokeLinejoin="round"
        />

        {/* Rocket Nosecone Tip */}
        <path
          d="M50 8C43 18 39 30 38 38C45 40 55 40 62 38C61 30 57 18 50 8Z"
          fill={customization.accentColor}
        />

        {/* Cute Glass Porthole / Cabin Window */}
        <circle
          cx="50"
          cy="62"
          r="16"
          fill="url(#windowGrad)"
          stroke="#ffffff"
          strokeWidth="3.5"
        />
        {/* Porthole Outer Ring */}
        <circle
          cx="50"
          cy="62"
          r="16"
          stroke="#071330"
          strokeWidth="3.5"
          fill="none"
        />

        {/* Little smiling astronaut reflection inside window! */}
        <circle cx="50" cy="62" r="7" fill="#ffffff" />
        {/* Cute eyes */}
        <circle cx="48" cy="61" r="1.2" fill="#0c4a6e" />
        <circle cx="52" cy="61" r="1.2" fill="#0c4a6e" />
        <path d="M49 64Q50 65.5 51 64" stroke="#0c4a6e" strokeWidth="0.8" strokeLinecap="round" />

        {/* Window Light Glare */}
        <path
          d="M40 54C42 50 48 48 54 48"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeOpacity="0.8"
        />

        {/* Body Decorative Screws / Rivets */}
        <circle cx="34" cy="85" r="2" fill="#ffffff" fillOpacity="0.8" />
        <circle cx="66" cy="85" r="2" fill="#ffffff" fillOpacity="0.8" />
        <circle cx="50" cy="88" r="2.5" fill="#fef08a" />
      </svg>
    </div>
  );
};

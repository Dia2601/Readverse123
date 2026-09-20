import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import { playWarp, playTwinkle } from "../utils/audio";

interface LandingGatewayProps {
  onStart: () => void;
}

export const LandingGateway: React.FC<LandingGatewayProps> = ({ onStart }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  const handleLaunch = () => {
    setIsLaunching(true);
    playWarp();
    setTimeout(() => {
      onStart();
    }, 900);
  };

  return (
    <div
      id="landing-gateway"
      className={`relative w-full h-screen flex flex-col items-center justify-center select-none overflow-hidden transition-all duration-700 ${
        isLaunching ? "scale-110 filter brightness-125" : "scale-100"
      }`}
    >
      {/* Central Illuminated Cosmic Scene */}
      <div className="relative flex flex-col items-center justify-center z-10 px-4 text-center">
        {/* Glowing Central Magic Book */}
        <div className="relative mb-6 animate-float-medium group cursor-pointer">
          {/* Radiant Book Aura */}
          <div className="absolute inset-0 -m-8 rounded-full bg-gradient-to-r from-sky-400/30 via-cyan-300/35 to-indigo-400/25 blur-3xl animate-pulse" />

          {/* Handcrafted Animated Open Magic Book Illustration */}
          <div className="relative w-56 h-44 sm:w-64 sm:h-52 flex items-center justify-center">
            <svg
              viewBox="0 0 240 180"
              fill="none"
              className="w-full h-full filter drop-shadow-[0_16px_32px_rgba(14,165,233,0.5)]"
            >
              <defs>
                {/* Book Cover Gradient */}
                <linearGradient id="bookCoverGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0284c7" />
                  <stop offset="50%" stopColor="#0369a1" />
                  <stop offset="100%" stopColor="#082f49" />
                </linearGradient>

                {/* Glowing Page Gradient */}
                <linearGradient id="pageGradLeft" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f0f9ff" />
                  <stop offset="90%" stopColor="#bae6fd" />
                  <stop offset="100%" stopColor="#7dd3fc" />
                </linearGradient>

                <linearGradient id="pageGradRight" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#7dd3fc" />
                  <stop offset="10%" stopColor="#bae6fd" />
                  <stop offset="100%" stopColor="#f0f9ff" />
                </linearGradient>

                <radialGradient id="celestialBeam" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Celestial Light Beam issuing upwards */}
              <ellipse cx="120" cy="110" rx="60" ry="15" fill="url(#celestialBeam)" />

              {/* Hardcover Spine & Edge */}
              <path
                d="M20 135C65 145 105 130 120 135C135 130 175 145 220 135L224 148C179 158 135 145 120 150C105 145 61 158 16 148L20 135Z"
                fill="url(#bookCoverGrad)"
                stroke="#38bdf8"
                strokeWidth="2"
              />

              {/* Left Page Wings */}
              <path
                d="M24 130C66 140 106 126 120 132L120 48C106 42 66 56 24 46L24 130Z"
                fill="url(#pageGradLeft)"
                stroke="#e0f2fe"
                strokeWidth="1.5"
              />

              {/* Right Page Wings */}
              <path
                d="M120 132C134 126 174 140 216 130L216 46C174 56 134 42 120 48L120 132Z"
                fill="url(#pageGradRight)"
                stroke="#e0f2fe"
                strokeWidth="1.5"
              />

              {/* Center Binding Line */}
              <path d="M120 48V132" stroke="#0284c7" strokeWidth="2.5" />

              {/* Elegant Text Line Marks on Pages */}
              <line x1="42" y1="68" x2="100" y2="72" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
              <line x1="42" y1="84" x2="100" y2="88" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
              <line x1="42" y1="100" x2="90" y2="104" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" opacity="0.3" />

              <line x1="140" y1="72" x2="198" y2="68" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
              <line x1="140" y1="88" x2="198" y2="84" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
              <line x1="150" y1="104" x2="198" y2="100" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
            </svg>

            {/* Glowing Stars and Mini Planets Emitting from Pages */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-48 h-28 pointer-events-none">
              {/* Mini glowing planet 1 (Coral) */}
              <div className="absolute top-2 left-6 w-5 h-5 rounded-full bg-gradient-to-tr from-pink-500 to-rose-300 shadow-[0_0_12px_rgba(244,114,182,0.8)] animate-bounce duration-1000" />
              {/* Mini glowing planet 2 (Cyan with ring) */}
              <div className="absolute top-0 right-8 w-6 h-6 flex items-center justify-center animate-float-slow">
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-teal-400 to-cyan-200 shadow-[0_0_14px_rgba(45,212,191,0.8)]" />
                <div className="absolute w-8 h-2.5 rounded-full border-2 border-cyan-200/70 rotate-[-20deg]" />
              </div>
              {/* Golden Mini Star */}
              <div className="absolute top-6 left-20 w-3 h-3 text-yellow-300 animate-spin duration-3000">
                ✨
              </div>
              {/* Lavender Star */}
              <div className="absolute top-4 right-16 w-3.5 h-3.5 text-purple-300 animate-pulse">
                ★
              </div>
              {/* Sparkling Dust Cluster */}
              <div className="absolute top-12 left-12 w-2 h-2 rounded-full bg-white animate-ping" />
              <div className="absolute top-10 right-24 w-1.5 h-1.5 rounded-full bg-sky-200 animate-ping delay-200" />
            </div>
          </div>
        </div>

        {/* Brand Title: READVERSE */}
        <div className="mb-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-900/50 border border-sky-400/40 text-cyan-300 text-xs font-semibold tracking-wider uppercase backdrop-blur-sm mb-3">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Vũ Trụ Đọc & Tư Duy Phản Biện
          </div>
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-wider font-['Outfit',sans-serif] bg-gradient-to-b from-white via-sky-100 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_8px_24px_rgba(56,189,248,0.5)]">
            READVERSE
          </h1>
        </div>

        {/* Poetic Subtitle */}
        <p className="text-lg sm:text-2xl text-sky-200 font-medium tracking-wide mb-8 max-w-lg drop-shadow-sm">
          “Mỗi trang sách mở ra một vũ trụ.”
        </p>

        {/* 🚀 BẮT ĐẦU Playful 3D Luminous Button */}
        <div className="relative group">
          {/* Luminous Glow Behind Button */}
          <div
            className={`absolute -inset-2 rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-teal-300 blur-xl opacity-60 transition-all duration-300 ${
              isHovered ? "opacity-100 scale-110" : ""
            }`}
          />

          <button
            id="start-readverse-btn"
            onClick={handleLaunch}
            onMouseEnter={() => {
              setIsHovered(true);
              playTwinkle();
            }}
            onMouseLeave={() => setIsHovered(false)}
            className="relative px-10 py-5 rounded-full bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#0369a1] text-white font-['Outfit',sans-serif] text-xl sm:text-2xl font-extrabold tracking-wide shadow-[0_10px_25px_rgba(2,132,199,0.7),inset_0_2px_4px_rgba(255,255,255,0.6)] border-2 border-sky-200 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-3 cursor-pointer"
          >
            <span className="text-2xl sm:text-3xl animate-bounce">🚀</span>
            <span className="drop-shadow-md">BẮT ĐẦU</span>

            {/* Sparkle Badges on Hover */}
            {isHovered && (
              <>
                <span className="absolute -top-2 -right-2 text-yellow-300 text-lg animate-ping">
                  ✨
                </span>
                <span className="absolute -bottom-2 -left-2 text-cyan-200 text-sm animate-pulse">
                  ★
                </span>
              </>
            )}
          </button>
        </div>

        {/* Quick hint for students */}
        <p className="mt-6 text-xs sm:text-sm text-sky-300/80 font-normal">
          Dành cho học sinh yêu thích đọc, tư duy và khám phá chân trời mới
        </p>
      </div>

      {/* Orbiting Cartoon Planets on Gateway perimeter */}
      <div className="absolute top-[18%] left-[12%] hidden md:block animate-float-slow pointer-events-none">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 shadow-[0_0_20px_rgba(168,85,247,0.5)] border border-purple-300/40 flex items-center justify-center text-xl">
          📚
        </div>
      </div>

      <div className="absolute bottom-[22%] right-[14%] hidden md:block animate-float-reverse pointer-events-none">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 shadow-[0_0_20px_rgba(20,184,166,0.5)] border border-teal-300/40 flex items-center justify-center text-2xl">
          ✨
        </div>
      </div>
    </div>
  );
};

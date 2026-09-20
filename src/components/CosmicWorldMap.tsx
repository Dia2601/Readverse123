import React, { useState } from "react";
import { Sparkles, Compass, MapPin, Award, BookOpen, Search, Swords, GitCommit, Feather } from "lucide-react";
import { Planet, UserProfile } from "../types";
import { PLANETS } from "../data/mockData";
import { RocketAvatar } from "./RocketAvatar";
import { playPop, playTwinkle, playWarp } from "../utils/audio";

interface CosmicWorldMapProps {
  user: UserProfile;
  onSelectPlanet: (planet: Planet) => void;
}

export const CosmicWorldMap: React.FC<CosmicWorldMapProps> = ({ user, onSelectPlanet }) => {
  const [hoveredPlanetId, setHoveredPlanetId] = useState<string | null>(null);
  const [flyingToPlanetId, setFlyingToPlanetId] = useState<string | null>(null);

  // Flight positions in percentages (x, y)
  // Center is ~50%, 48%
  const [rocketPos, setRocketPos] = useState<{ x: number; y: number }>({ x: 50, y: 48 });

  const getPlanetStatus = (planetId: string): "unvisited" | "visited" | "completed" => {
    // Check if user has an explicitly completed activity on this planet
    const hasCompleted = user.completedActivities?.some((act) => act.planetId === planetId);
    if (hasCompleted) return "completed";

    // For explore planet, sharing a quote marks it completed; visiting marks it visited
    if (planetId === "explore") {
      const hasShared = user.completedActivities?.some((act) => act.planetId === "explore");
      if (hasShared) return "completed";
      return user.visitedPlanets?.includes("explore") ? "visited" : "unvisited";
    }

    const hasVisited = user.visitedPlanets?.includes(planetId as any);
    if (hasVisited) return "visited";

    return "unvisited";
  };

  const handlePlanetClick = (planet: Planet) => {
    playWarp();
    setFlyingToPlanetId(planet.id);

    // Coordinate target
    const targetMap: Record<string, { x: number; y: number }> = {
      explore: { x: 22, y: 28 },
      investigate: { x: 78, y: 28 },
      debate: { x: 18, y: 72 },
      connect: { x: 82, y: 72 },
      create: { x: 50, y: 84 },
    };

    const target = targetMap[planet.id] || { x: 50, y: 50 };
    setRocketPos(target);

    // Sequence: 1. Launch, 2. Fly & Orbit, 3. Land & open experience
    setTimeout(() => {
      onSelectPlanet(planet);
    }, 1100);
  };

  return (
    <div
      id="cosmic-world-map"
      className="relative w-full min-h-[640px] sm:min-h-[720px] flex items-center justify-center p-4 overflow-hidden select-none"
    >
      {/* Soft Orbital Guide Rings in background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[320px] h-[320px] sm:w-[480px] sm:h-[480px] rounded-full border border-sky-400/15 animate-spin duration-[60000ms]" />
        <div className="w-[520px] h-[520px] sm:w-[680px] sm:h-[680px] rounded-full border border-cyan-400/10 border-dashed animate-spin duration-[90000ms]" />
      </div>

      {/* Central Star Core / Cosmic Beacon */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
        <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-cyan-400/20 via-sky-300/15 to-indigo-500/10 blur-xl animate-pulse" />
        <span className="text-[11px] font-bold text-sky-300/60 uppercase tracking-widest -mt-4">
          TÂM ĐIỂM NGÂN HÀ
        </span>
      </div>

      {/* The Player's Rocket floating in universe */}
      <div
        className="absolute z-30 transition-all duration-1000 ease-in-out pointer-events-none"
        style={{
          left: `${rocketPos.x}%`,
          top: `${rocketPos.y}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <RocketAvatar
          customization={user.avatarRocket}
          size="md"
          isFlying={flyingToPlanetId !== null}
        />
        {/* Rocket Pilot Tag */}
        <div className="mt-1 px-2.5 py-0.5 rounded-full bg-[#081e42]/90 border border-cyan-400/40 text-[10px] font-bold text-cyan-200 text-center whitespace-nowrap shadow-sm">
          {user.name}
        </div>
      </div>

      {/* PLANET 01: EXPLORE — Top Left */}
      <div
        className="absolute top-[8%] left-[6%] sm:top-[12%] sm:left-[14%] z-20"
        onMouseEnter={() => {
          setHoveredPlanetId("explore");
          playPop();
        }}
        onMouseLeave={() => setHoveredPlanetId(null)}
      >
        <PlanetNode
          planet={PLANETS[0]}
          isHovered={hoveredPlanetId === "explore"}
          onClick={() => handlePlanetClick(PLANETS[0])}
          theme="blue"
          status={getPlanetStatus("explore")}
        >
          {/* Custom floating mini books & satellites decoration */}
          <div className="absolute -top-3 -right-2 text-base animate-bounce duration-1000">📖</div>
          <div className="absolute -bottom-2 -left-2 text-xs text-cyan-300 animate-spin">🛰️</div>
        </PlanetNode>
      </div>

      {/* PLANET 02: INVESTIGATE — Top Right */}
      <div
        className="absolute top-[8%] right-[6%] sm:top-[12%] sm:right-[14%] z-20"
        onMouseEnter={() => {
          setHoveredPlanetId("investigate");
          playPop();
        }}
        onMouseLeave={() => setHoveredPlanetId(null)}
      >
        <PlanetNode
          planet={PLANETS[1]}
          isHovered={hoveredPlanetId === "investigate"}
          onClick={() => handlePlanetClick(PLANETS[1])}
          theme="purple"
          status={getPlanetStatus("investigate")}
        >
          {/* Custom floating magnifying glass and clues */}
          <div className="absolute -top-3 -left-2 text-base animate-pulse">🔍</div>
          <div className="absolute -bottom-1 -right-2 text-xs text-purple-300">📜</div>
        </PlanetNode>
      </div>

      {/* PLANET 03: DEBATE — Bottom Left */}
      <div
        className="absolute bottom-[10%] left-[5%] sm:bottom-[16%] sm:left-[12%] z-20"
        onMouseEnter={() => {
          setHoveredPlanetId("debate");
          playPop();
        }}
        onMouseLeave={() => setHoveredPlanetId(null)}
      >
        <PlanetNode
          planet={PLANETS[2]}
          isHovered={hoveredPlanetId === "debate"}
          onClick={() => handlePlanetClick(PLANETS[2])}
          theme="darkblue"
          status={getPlanetStatus("debate")}
        >
          {/* Custom two orbiting moons for debate! */}
          <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.8)] flex items-center justify-center text-[9px] text-[#071330] font-bold">
            A
          </div>
          <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(165,180,252,0.8)] flex items-center justify-center text-[9px] text-white font-bold">
            B
          </div>
        </PlanetNode>
      </div>

      {/* PLANET 04: CONNECT — Bottom Right */}
      <div
        className="absolute bottom-[10%] right-[5%] sm:bottom-[16%] sm:right-[12%] z-20"
        onMouseEnter={() => {
          setHoveredPlanetId("connect");
          playPop();
        }}
        onMouseLeave={() => setHoveredPlanetId(null)}
      >
        <PlanetNode
          planet={PLANETS[3]}
          isHovered={hoveredPlanetId === "connect"}
          onClick={() => handlePlanetClick(PLANETS[3])}
          theme="turquoise"
          status={getPlanetStatus("connect")}
        >
          {/* Custom constellation lines glow */}
          <div className="absolute -top-3 -right-3 text-base text-teal-300 animate-spin">✨</div>
          <div className="absolute -bottom-2 -left-2 text-xs text-cyan-200">🧩</div>
        </PlanetNode>
      </div>

      {/* PLANET 05: CREATE — Center Bottom */}
      <div
        className="absolute bottom-[2%] left-1/2 -translate-x-1/2 sm:bottom-[6%] z-20"
        onMouseEnter={() => {
          setHoveredPlanetId("create");
          playPop();
        }}
        onMouseLeave={() => setHoveredPlanetId(null)}
      >
        <PlanetNode
          planet={PLANETS[4]}
          isHovered={hoveredPlanetId === "create"}
          onClick={() => handlePlanetClick(PLANETS[4])}
          theme="fuchsia"
          status={getPlanetStatus("create")}
        >
          {/* Floating pencils & idea bubbles */}
          <div className="absolute -top-3 -right-3 text-base animate-bounce">✏️</div>
          <div className="absolute -top-2 -left-3 text-sm animate-pulse">💭</div>
        </PlanetNode>
      </div>

      {/* Interactive Guidance Banner for Student at Top Center */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full bg-[#081e42]/80 border border-sky-400/30 text-xs text-sky-200 backdrop-blur-md hidden sm:flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
        Chọn một hành tinh để hỏa tiễn cất cánh và mở khóa thử thách tư duy!
      </div>
    </div>
  );
};

interface PlanetNodeProps {
  planet: Planet;
  isHovered: boolean;
  onClick: () => void;
  theme: "blue" | "purple" | "darkblue" | "turquoise" | "fuchsia";
  status: "unvisited" | "visited" | "completed";
  children?: React.ReactNode;
}

const PlanetNode: React.FC<PlanetNodeProps> = ({
  planet,
  isHovered,
  onClick,
  theme,
  status,
  children,
}) => {
  const themeStyles = {
    blue: {
      grad: "from-sky-400 via-cyan-500 to-blue-600",
      ring: "border-sky-300/40",
      glow: "rgba(56,189,248,0.6)",
      textColor: "text-cyan-300",
    },
    purple: {
      grad: "from-purple-400 via-fuchsia-500 to-indigo-700",
      ring: "border-purple-300/40",
      glow: "rgba(168,85,247,0.6)",
      textColor: "text-purple-300",
    },
    darkblue: {
      grad: "from-blue-500 via-indigo-600 to-slate-900",
      ring: "border-indigo-300/40",
      glow: "rgba(99,102,241,0.6)",
      textColor: "text-indigo-300",
    },
    turquoise: {
      grad: "from-teal-300 via-cyan-400 to-emerald-600",
      ring: "border-teal-300/40",
      glow: "rgba(45,212,191,0.6)",
      textColor: "text-teal-300",
    },
    fuchsia: {
      grad: "from-pink-400 via-rose-500 to-purple-700",
      ring: "border-pink-300/40",
      glow: "rgba(244,114,182,0.6)",
      textColor: "text-pink-300",
    },
  };

  const currentTheme = themeStyles[theme];

  return (
    <div className="relative flex flex-col items-center group">
      {/* Planet Sphere Button */}
      <button
        id={`planet-btn-${planet.id}`}
        onClick={onClick}
        className={`relative w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr ${
          currentTheme.grad
        } shadow-[0_0_28px_${currentTheme.glow}] border-2 ${
          currentTheme.ring
        } transition-all duration-300 transform group-hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer`}
      >
        {/* Planet Surface Texture / Swirls */}
        <div className="absolute inset-0 rounded-full overflow-hidden opacity-30 pointer-events-none">
          <div className="w-full h-full rounded-full border-t-4 border-white/50 rotate-12" />
          <div className="w-full h-full rounded-full border-b-4 border-black/30 -rotate-12" />
        </div>

        {/* Planet Center Icon */}
        <span className="text-3xl sm:text-4xl filter drop-shadow-md transition-transform group-hover:scale-125">
          {planet.icon}
        </span>

        {/* Outer Orbiting / Floating Assets */}
        {children}
      </button>

      {/* Planet Label and Description Bubble */}
      <div className="mt-2.5 flex flex-col items-center text-center">
        <span
          className={`text-xs sm:text-sm font-extrabold tracking-wide text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-['Outfit',sans-serif] px-3 py-0.5 rounded-full bg-[#081e42]/85 border border-sky-400/30 group-hover:border-cyan-300 transition-colors`}
        >
          {planet.name}
        </span>
        <span className={`text-[10px] sm:text-[11px] font-semibold mt-0.5 ${currentTheme.textColor}`}>
          {planet.subtitle}
        </span>

        {/* Explicit 3-State Planet Status Badge */}
        {status === "completed" && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-400/40 flex items-center gap-1 mt-1 shadow-sm">
            <span>✨</span> Đã hoàn thành
          </span>
        )}
        {status === "visited" && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/40 flex items-center gap-1 mt-1">
            <span>👁️</span> Đã ghé thăm
          </span>
        )}
        {status === "unvisited" && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800/60 text-slate-300 border border-slate-600/30 flex items-center gap-1 mt-1">
            <span>○</span> Chưa khám phá
          </span>
        )}
      </div>

      {/* Floating Tooltip Card on Hover */}
      {isHovered && (
        <div className="absolute -bottom-20 z-40 w-52 p-2.5 rounded-2xl bg-[#09224f]/95 border border-cyan-400/50 shadow-xl backdrop-blur-md text-[11px] text-sky-100 text-center pointer-events-none animate-in fade-in zoom-in-95 duration-200">
          {planet.description}
          <div className="mt-1 text-[10px] font-bold text-yellow-300">🚀 Nhấp để đáp hỏa tiễn</div>
        </div>
      )}
    </div>
  );
};

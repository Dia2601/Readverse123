import React, { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  speed: number;
  twinkleFactor: number;
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
}

export const CosmicBackground: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Create stars
    const starColors = ["#ffffff", "#7dd3fc", "#a5f3fc", "#e0e7ff", "#fef08a", "#fbcfe8"];
    const stars: Star[] = Array.from({ length: 150 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.8 + 0.5,
      alpha: Math.random() * 0.8 + 0.2,
      speed: Math.random() * 0.02 + 0.005,
      twinkleFactor: Math.random() * Math.PI * 2,
      color: starColors[Math.floor(Math.random() * starColors.length)],
    }));

    // Shooting stars
    const shootingStars: ShootingStar[] = [];
    let lastShootingStarTime = Date.now();

    const spawnShootingStar = () => {
      shootingStars.push({
        x: Math.random() * width * 0.8,
        y: Math.random() * (height * 0.4),
        length: Math.random() * 80 + 40,
        speed: Math.random() * 6 + 7,
        angle: Math.PI / 4 + (Math.random() * 0.2 - 0.1),
        opacity: 1,
      });
    };

    const render = () => {
      // Cosmic gradient clear
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#051636"); // Deep ocean blue
      gradient.addColorStop(0.4, "#0b2559"); // Rich azure nebula
      gradient.addColorStop(0.7, "#083366"); // Bright cosmic blue
      gradient.addColorStop(1, "#03132e"); // Dark starlight blue
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw soft nebula clouds
      drawNebulaGlow(ctx, width * 0.25, height * 0.3, 320, "rgba(56, 189, 248, 0.09)");
      drawNebulaGlow(ctx, width * 0.75, height * 0.65, 380, "rgba(99, 102, 241, 0.08)");
      drawNebulaGlow(ctx, width * 0.5, height * 0.85, 300, "rgba(20, 184, 166, 0.07)");
      drawNebulaGlow(ctx, width * 0.85, height * 0.2, 240, "rgba(232, 121, 249, 0.06)");

      // Draw Stars
      stars.forEach((star) => {
        star.twinkleFactor += star.speed;
        const currentAlpha = star.alpha * (0.6 + 0.4 * Math.sin(star.twinkleFactor));

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = currentAlpha;
        ctx.shadowBlur = star.radius > 1.4 ? 6 : 0;
        ctx.shadowColor = star.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Update & Draw Shooting Stars
      if (Date.now() - lastShootingStarTime > 4000 && Math.random() < 0.3) {
        spawnShootingStar();
        lastShootingStarTime = Date.now();
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;
        ss.opacity -= 0.015;

        if (ss.opacity <= 0 || ss.x > width || ss.y > height) {
          shootingStars.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        const tailX = ss.x - Math.cos(ss.angle) * ss.length;
        const tailY = ss.y - Math.sin(ss.angle) * ss.length;
        const ssGrad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        ssGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
        ssGrad.addColorStop(0.8, "rgba(125, 211, 252, " + ss.opacity * 0.8 + ")");
        ssGrad.addColorStop(1, "rgba(255, 255, 255, " + ss.opacity + ")");

        ctx.strokeStyle = ssGrad;
        ctx.lineWidth = 2;
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.stroke();

        // Sparkle head
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = ss.opacity;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#071330] text-sky-100 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Dynamic Star Canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />

      {/* Handcrafted Illustrated Floating Space Objects (CSS Animated) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Floating Book 1 - Top Left */}
        <div className="absolute top-[12%] left-[6%] animate-float-slow opacity-75 hover:opacity-100 transition-opacity">
          <svg width="68" height="56" viewBox="0 0 68 56" fill="none" className="drop-shadow-[0_8px_16px_rgba(56,189,248,0.4)]">
            <rect x="6" y="8" width="26" height="36" rx="4" transform="rotate(-8 6 8)" fill="#38bdf8" />
            <rect x="28" y="4" width="26" height="36" rx="4" transform="rotate(8 28 4)" fill="#7dd3fc" />
            <path d="M26 12C26 12 32 18 32 44" stroke="#0284c7" strokeWidth="2.5" />
            {/* Tiny stars coming out of book */}
            <circle cx="34" cy="6" r="2.5" fill="#fef08a" className="animate-ping" />
            <circle cx="20" cy="2" r="1.5" fill="#f472b6" />
            <circle cx="46" cy="4" r="2" fill="#a7f3d0" />
          </svg>
        </div>

        {/* Cute Smiling Mini Moon - Top Right */}
        <div className="absolute top-[8%] right-[8%] animate-float-reverse opacity-85">
          <svg width="74" height="74" viewBox="0 0 74 74" fill="none" className="drop-shadow-[0_0_24px_rgba(254,240,138,0.45)]">
            <circle cx="37" cy="37" r="30" fill="url(#moonGrad)" />
            {/* Cute craters */}
            <circle cx="25" cy="26" r="6" fill="#fde047" fillOpacity="0.4" />
            <circle cx="48" cy="45" r="7.5" fill="#fde047" fillOpacity="0.35" />
            <circle cx="28" cy="50" r="4" fill="#fde047" fillOpacity="0.4" />
            {/* Cute eyes & smile */}
            <circle cx="32" cy="34" r="2.5" fill="#854d0e" />
            <circle cx="44" cy="34" r="2.5" fill="#854d0e" />
            <path d="M35 40Q38 43 41 40" stroke="#854d0e" strokeWidth="2" strokeLinecap="round" />
            <ellipse cx="28" cy="38" rx="2.5" ry="1.5" fill="#f472b6" fillOpacity="0.6" />
            <ellipse cx="48" cy="38" rx="2.5" ry="1.5" fill="#f472b6" fillOpacity="0.6" />
            <defs>
              <linearGradient id="moonGrad" x1="10" y1="10" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fef9c3" />
                <stop offset="1" stopColor="#fde047" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Floating Cartoon Satellite - Bottom Left */}
        <div className="absolute bottom-[16%] left-[8%] animate-float-medium opacity-70">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" className="drop-shadow-[0_4px_12px_rgba(45,212,191,0.3)]">
            {/* Solar wings */}
            <rect x="4" y="24" width="16" height="12" rx="2" fill="#06b6d4" stroke="#67e8f9" strokeWidth="1.5" />
            <rect x="40" y="24" width="16" height="12" rx="2" fill="#06b6d4" stroke="#67e8f9" strokeWidth="1.5" />
            {/* Body */}
            <rect x="22" y="20" width="16" height="20" rx="4" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="2" />
            {/* Antenna with flashing light */}
            <line x1="30" y1="20" x2="30" y2="10" stroke="#7dd3fc" strokeWidth="2" />
            <circle cx="30" cy="9" r="3" fill="#f43f5e" />
            <circle cx="30" cy="9" r="6" fill="#f43f5e" fillOpacity="0.3" className="animate-ping" />
          </svg>
        </div>

        {/* Floating Book 2 - Bottom Right */}
        <div className="absolute bottom-[14%] right-[7%] animate-float-slow opacity-65">
          <svg width="60" height="50" viewBox="0 0 60 50" fill="none" className="drop-shadow-[0_8px_20px_rgba(192,132,252,0.35)]">
            <rect x="8" y="10" width="22" height="30" rx="3" transform="rotate(-12 8 10)" fill="#c084fc" />
            <rect x="26" y="6" width="22" height="30" rx="3" transform="rotate(10 26 6)" fill="#e9d5ff" />
            <circle cx="30" cy="4" r="2" fill="#38bdf8" />
            <circle cx="42" cy="2" r="1.5" fill="#fef08a" />
          </svg>
        </div>
      </div>

      {/* Main interactive content layer */}
      <div className="relative z-10 w-full min-h-screen">{children}</div>
    </div>
  );
};

function drawNebulaGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string
) {
  const grad = ctx.createRadialGradient(x, y, 10, x, y, radius);
  grad.addColorStop(0, color);
  grad.addColorStop(1, "rgba(7, 19, 48, 0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

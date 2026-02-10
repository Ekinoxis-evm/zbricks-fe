import React, { useRef, useEffect } from "react";

type Piece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vr: number;
  color: string;
  shape: "rect" | "circle";
  life: number;
};

interface ConfettiProps {
  active: boolean;
}

export default function Confetti({ active }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const palette = [
      "#2DD4D4",
      "#7DEAEA",
      "#FF4DFF",
      "#FFD54A",
      "#7CFF6B",
      "#FF5A5A",
      "#5B8CFF",
      "#FFFFFF",
      "#FF8A00",
      "#00E5FF",
    ];

    const pieces: Piece[] = [];
    const spawn = (count: number) => {
      for (let i = 0; i < count; i++) {
        const fromLeft = Math.random() < 0.5;
        const x = fromLeft ? -20 : canvas.width + 20;
        const y = Math.random() * canvas.height * 0.8;
        const vx = fromLeft ? 2 + Math.random() * 6 : -(2 + Math.random() * 6);
        const vy = -3 - Math.random() * 6;
        pieces.push({
          x,
          y,
          vx,
          vy,
          size: 4 + Math.random() * 10,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.3,
          color: palette[(Math.random() * palette.length) | 0],
          shape: Math.random() < 0.5 ? "rect" : "circle",
          life: 1,
        });
      }
    };

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = pieces.length - 1; i >= 0; i--) {
        const p = pieces[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity
        p.rot += p.vr;
        p.life -= 0.006;

        if (p.life <= 0 || p.y > canvas.height + 50) {
          pieces.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;

        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, 2 * Math.PI);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        }
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    if (active) {
      spawn(60);
      loop();
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 9998,
      }}
    />
  );
}

import React, { useEffect, useRef } from "react";
import { MyraEmotion } from "../types";

interface AudioVisualizerOrbProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
  status: "connecting" | "ready" | "listening" | "speaking" | "interrupted" | "disconnected" | "error";
  emotion?: MyraEmotion;
}

export const AudioVisualizerOrb: React.FC<AudioVisualizerOrbProps> = ({
  analyser,
  isActive,
  status,
  emotion = "happy",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let time = 0;
    const bufferLength = analyser ? analyser.frequencyBinCount : 64;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      // Animation speed modulated by emotion
      const speed = emotion === "excited" ? 0.05 : emotion === "calm" ? 0.02 : 0.035;
      time += speed;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      let volume = 0;
      if (analyser && isActive) {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < 32; i++) {
          sum += dataArray[i];
        }
        volume = sum / 32 / 255;
      }

      // Base radius with breathing and volume reactivity
      const baseRadius = 60 + Math.sin(time * 2) * 5 + volume * 45;

      // Color scheme based on status and emotion
      let color1 = "#f43f5e"; // rose-500
      let color2 = "#ec4899"; // pink-500
      let color3 = "#fb7185"; // rose-400

      if (status === "speaking") {
        if (emotion === "excited") {
          color1 = "#ec4899";
          color2 = "#a855f7";
          color3 = "#f43f5e";
        } else if (emotion === "curious") {
          color1 = "#f59e0b";
          color2 = "#ec4899";
          color3 = "#06b6d4";
        } else if (emotion === "calm") {
          color1 = "#8b5cf6";
          color2 = "#38bdf8";
          color3 = "#c084fc";
        } else if (emotion === "playful") {
          color1 = "#f43f5e";
          color2 = "#eab308";
          color3 = "#ec4899";
        } else {
          color1 = "#f43f5e";
          color2 = "#fb7185";
          color3 = "#fda4af";
        }
      } else if (status === "listening") {
        color1 = "#06b6d4";
        color2 = "#3b82f6";
        color3 = "#8b5cf6";
      } else if (status === "connecting") {
        color1 = "#eab308";
        color2 = "#f97316";
        color3 = "#ef4444";
      }

      // 1. Ambient outer glow
      const gradientOuter = ctx.createRadialGradient(
        centerX,
        centerY,
        baseRadius * 0.4,
        centerX,
        centerY,
        baseRadius * 2.2
      );
      gradientOuter.addColorStop(0, color2 + "55");
      gradientOuter.addColorStop(0.5, color1 + "25");
      gradientOuter.addColorStop(1, "transparent");

      ctx.fillStyle = gradientOuter;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // 2. Dynamic wavy ring
      const numPoints = 64;
      ctx.beginPath();
      for (let i = 0; i <= numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const wave =
          Math.sin(angle * 6 + time * 3) * (6 + volume * 18) +
          Math.cos(angle * 3 - time * 2) * (4 + volume * 10);
        const r = baseRadius + wave;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();

      // Fluid interior gradient
      const innerGrad = ctx.createRadialGradient(
        centerX - baseRadius * 0.3,
        centerY - baseRadius * 0.3,
        baseRadius * 0.1,
        centerX,
        centerY,
        baseRadius * 1.1
      );
      innerGrad.addColorStop(0, "#ffffff");
      innerGrad.addColorStop(0.2, color2);
      innerGrad.addColorStop(0.7, color1);
      innerGrad.addColorStop(1, color3);

      ctx.fillStyle = innerGrad;
      ctx.shadowColor = color2;
      ctx.shadowBlur = 24 + volume * 30;
      ctx.fill();
      ctx.shadowBlur = 0;

      // 3. Floating particle dots around the orb
      const numParticles = emotion === "playful" ? 12 : 8;
      for (let p = 0; p < numParticles; p++) {
        const pAngle = (p / numParticles) * Math.PI * 2 + time * 0.6;
        const pDist = baseRadius * 1.35 + Math.sin(time * 3 + p) * 10;
        const px = centerX + Math.cos(pAngle) * pDist;
        const py = centerY + Math.sin(pAngle) * pDist;
        const pRadius = 2 + Math.sin(time * 4 + p) * 1.5;

        ctx.beginPath();
        ctx.arc(px, py, Math.max(1, pRadius), 0, Math.PI * 2);
        ctx.fillStyle = "#ffffffcc";
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [analyser, isActive, status, emotion]);

  return (
    <div className="relative flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={340}
        height={340}
        className="w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] drop-shadow-2xl"
      />
    </div>
  );
};

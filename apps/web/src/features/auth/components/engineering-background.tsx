"use client";

import * as React from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseX: number;
  baseY: number;
  radius: number;
  pulsePhase: number;
  pulseSpeed: number;
}

interface Signal {
  fromIndex: number;
  toIndex: number;
  progress: number;
  speed: number;
}

export function EngineeringBackground() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Check prefers-reduced-motion
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let prefersReducedMotion = motionQuery.matches;

    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
      if (prefersReducedMotion) {
        drawStaticScene();
      }
    };
    motionQuery.addEventListener("change", handleMotionChange);

    // Pointer state
    const pointer = {
      x: -1000,
      y: -1000,
      active: false,
    };

    let nodes: Node[] = [];
    let signals: Signal[] = [];

    const initNodes = () => {
      const isMobile = width < 768;
      const count = isMobile ? 24 : 52;
      nodes = [];
      signals = [];

      for (let i = 0; i < count; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        nodes.push({
          x,
          y,
          baseX: x,
          baseY: y,
          vx: (Math.random() - 0.5) * 0.28,
          vy: (Math.random() - 0.5) * 0.28,
          radius: Math.random() > 0.85 ? 2.5 : 1.5,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.015 + Math.random() * 0.02,
        });
      }

      // Pre-seed a few active signals along potential connections
      const signalCount = isMobile ? 3 : 7;
      for (let s = 0; s < signalCount; s++) {
        const from = Math.floor(Math.random() * count);
        let to = Math.floor(Math.random() * count);
        if (to === from) to = (from + 1) % count;
        signals.push({
          fromIndex: from,
          toIndex: to,
          progress: Math.random(),
          speed: 0.004 + Math.random() * 0.006,
        });
      }
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.parentElement?.clientHeight || window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
      initNodes();

      if (prefersReducedMotion) {
        drawStaticScene();
      }
    };

    const handlePointerMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    };

    const handlePointerLeave = () => {
      pointer.active = false;
      pointer.x = -1000;
      pointer.y = -1000;
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    document.addEventListener("mouseleave", handlePointerLeave);

    resize();

    const maxConnectionDistance = 140;
    const pointerRadius = 150;

    const drawStaticScene = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxConnectionDistance) {
            const alpha = (1 - dist / maxConnectionDistance) * 0.12;
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        ctx.fillStyle = "#262626";
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#404040";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    };

    let isDocumentVisible = !document.hidden;
    const handleVisibilityChange = () => {
      isDocumentVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const animate = () => {
      if (!isDocumentVisible) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      if (prefersReducedMotion) {
        return;
      }

      // Clear canvas frame for transparent layer composition
      ctx.clearRect(0, 0, width, height);

      // Update and draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        // Drift movement
        n.x += n.vx;
        n.y += n.vy;

        // Bounce gently at boundaries
        if (n.x < 10 || n.x > width - 10) n.vx *= -1;
        if (n.y < 10 || n.y > height - 10) n.vy *= -1;

        // Pointer proximity reaction
        if (pointer.active) {
          const pdx = n.x - pointer.x;
          const pdy = n.y - pointer.y;
          const pdist = Math.sqrt(pdx * pdx + pdy * pdy);

          if (pdist < pointerRadius && pdist > 0) {
            const force = (1 - pdist / pointerRadius) * 1.2;
            n.x += (pdx / pdist) * force;
            n.y += (pdy / pdist) * force;
          }
        }

        n.pulsePhase += n.pulseSpeed;
      }

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxConnectionDistance) {
            let alpha = (1 - dist / maxConnectionDistance) * 0.14;

            // Highlight if near pointer
            if (pointer.active) {
              const midX = (nodes[i].x + nodes[j].x) / 2;
              const midY = (nodes[i].y + nodes[j].y) / 2;
              const pmidDist = Math.sqrt((midX - pointer.x) ** 2 + (midY - pointer.y) ** 2);
              if (pmidDist < pointerRadius) {
                alpha += (1 - pmidDist / pointerRadius) * 0.15;
              }
            }

            ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(alpha, 0.45).toFixed(3)})`;
            ctx.lineWidth = 0.75;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw flowing signal pulses
      for (let s = 0; s < signals.length; s++) {
        const sig = signals[s];
        sig.progress += sig.speed;
        if (sig.progress >= 1) {
          sig.progress = 0;
          sig.fromIndex = Math.floor(Math.random() * nodes.length);
          sig.toIndex = (sig.fromIndex + 1 + Math.floor(Math.random() * 5)) % nodes.length;
        }

        const from = nodes[sig.fromIndex];
        const to = nodes[sig.toIndex];
        if (from && to) {
          const sx = from.x + (to.x - from.x) * sig.progress;
          const sy = from.y + (to.y - from.y) * sig.progress;

          ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
          ctx.beginPath();
          ctx.arc(sx, sy, 1.25, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw node dots
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const pulse = Math.sin(n.pulsePhase) * 0.5 + 0.5;
        const currentRadius = n.radius + pulse * 0.5;

        // Base node
        ctx.fillStyle = pulse > 0.7 ? "#555555" : "#262626";
        ctx.beginPath();
        ctx.arc(n.x, n.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();

        // Border ring
        ctx.strokeStyle = "#333333";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    if (!prefersReducedMotion) {
      animate();
    } else {
      drawStaticScene();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handlePointerMove);
      document.removeEventListener("mouseleave", handlePointerLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      motionQuery.removeEventListener("change", handleMotionChange);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      role="presentation"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      <canvas ref={canvasRef} className="block h-full w-full opacity-80" />
    </div>
  );
}


"use client";

import * as React from "react";

/**
 * Concrete implementation boundaries for the Google Cursor Aura:
 * - Size: Diameter 420px (radius 210px)
 * - Maximum Opacity: Capped at 0.18 (understated, non-distracting)
 * - Minimum Opacity: 0.0 when pointer is inactive or leaves the window
 * - Filter: 72px volumetric Gaussian blur
 * - Inertia: Linear interpolation (lerp factor 0.085 for position, 0.06 for opacity)
 * - Reduced Motion: Static 0.07 opacity centered behind the card, zero animation frames
 * - Touch Devices: Static 0.06 opacity centered, zero pointer listeners
 */
const AURA_SIZE = 420;
const AURA_RADIUS = AURA_SIZE / 2;
const MAX_OPACITY = 0.18;
const REDUCED_MOTION_OPACITY = 0.07;
const LERP_POS = 0.085;
const LERP_OPACITY = 0.06;

export function GoogleCursorAura() {
  const auraRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    // 1. Accessibility: Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // 2. Mobile/Touch: Detect touch-only devices without fine pointer
    const isTouchOnly = window.matchMedia("(pointer: coarse)").matches;

    const el = auraRef.current;
    if (!el) return;

    // Fallback for touch devices or reduced motion: subtle static centered glow
    if (prefersReducedMotion || isTouchOnly) {
      el.style.transform = `translate3d(calc(50vw - ${AURA_RADIUS}px), calc(50vh - ${AURA_RADIUS}px), 0)`;
      el.style.opacity = `${REDUCED_MOTION_OPACITY}`;
      return;
    }

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let targetOpacity = 0;
    let currentOpacity = 0;
    let isTracking = false;
    let animationFrameId: number;

    const updateFrame = () => {
      // Lerp position with physical inertia
      currentX += (targetX - currentX) * LERP_POS;
      currentY += (targetY - currentY) * LERP_POS;

      // Lerp opacity smoothly
      currentOpacity += (targetOpacity - currentOpacity) * LERP_OPACITY;

      if (el) {
        el.style.transform = `translate3d(${(currentX - AURA_RADIUS).toFixed(2)}px, ${(currentY - AURA_RADIUS).toFixed(2)}px, 0)`;
        el.style.opacity = currentOpacity.toFixed(4);
      }

      // Check if settled to save CPU cycles
      const dist = Math.hypot(targetX - currentX, targetY - currentY);
      const opacityDelta = Math.abs(targetOpacity - currentOpacity);

      if (dist < 0.2 && opacityDelta < 0.002) {
        isTracking = false;
        return;
      }

      animationFrameId = requestAnimationFrame(updateFrame);
    };

    const startTracking = () => {
      if (!isTracking) {
        isTracking = true;
        animationFrameId = requestAnimationFrame(updateFrame);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      targetOpacity = MAX_OPACITY;
      startTracking();
    };

    const handlePointerLeave = () => {
      targetOpacity = 0;
      startTracking();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        targetOpacity = 0;
        currentOpacity = 0;
        if (el) el.style.opacity = "0";
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("mouseleave", handlePointerLeave);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("mouseleave", handlePointerLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      role="presentation"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      <div
        ref={auraRef}
        style={{
          width: `${AURA_SIZE}px`,
          height: `${AURA_SIZE}px`,
          opacity: 0,
          willChange: "transform, opacity",
          filter: "blur(72px)",
          background: `
            radial-gradient(circle at 30% 30%, rgba(66, 133, 244, 0.45) 0%, transparent 60%),
            radial-gradient(circle at 70% 30%, rgba(234, 67, 53, 0.40) 0%, transparent 60%),
            radial-gradient(circle at 30% 70%, rgba(251, 188, 5, 0.35) 0%, transparent 60%),
            radial-gradient(circle at 70% 70%, rgba(52, 168, 83, 0.40) 0%, transparent 60%)
          `,
        }}
        className="rounded-full"
      />
    </div>
  );
}

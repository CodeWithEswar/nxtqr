# NXTQR Animated Logo Guidelines

## 1. Animation Philosophy

The NXTQR animated logo communicates **connected engineering systems, directed execution, and technical precision**.

- **Entrance Duration:** ~950ms total sequence.
- **Keyframe Engine:** Pure native CSS/SVG keyframe animations (zero JavaScript animation loop overhead).
- **Reduced Motion:** Fully honors `@media (prefers-reduced-motion: reduce)` by immediately displaying the complete static vector.

---

## 2. Entrance Choreography Timeline

```
0ms                 350ms             600ms             850ms       950ms
├─────────────────────┼─────────────────┼─────────────────┼───────────┤
▲ Brackets Draw In    ▲ Body Reveals    ▲ Trace Traversal ▲ Node Pulse  ▲ Settled
(stroke-dashoffset)   (scale & opacity) (accent beam)     (1.3x scale)  (static)
```

1. **Phase 1 (0 – 350ms):**
   - Corner brackets reveal via `stroke-dashoffset` (`nxtqrBracketDraw`, cubic-bezier(0.16, 1, 0.3, 1)).
2. **Phase 2 (250 – 650ms):**
   - The N monogram scales smoothly from 96% to 100% with opacity fade (`nxtqrBodyReveal`).
3. **Phase 3 (500 – 850ms):**
   - The directed execution trace sweeps across the center (`nxtqrTracePulse`).
4. **Phase 4 (750 – 950ms):**
   - The center execution node pulses to 1.3x scale and settles to 1.0x (`nxtqrNodeFlash`).

---

## 3. Loading State

When `mode="loading"` is passed to `<AnimatedLogo />`:

- Brackets and monogram remain solidly stationary.
- A restrained 1400ms looping stroke pulse moves through the center laser beam (`nxtqrLoadingLoop`).
- The center execution node breathes with gentle scale (`0.85x` to `1.25x`).
- Low CPU consumption; pauses when tab is in background or offscreen.

---

## 4. Hover Micro-Interaction

In interactive contexts (such as `<AppLogo href="/" />`):

- Hovering triggers `group-hover/logo:scale-125` on the execution node.
- Accents highlight with a 200ms transition.
- No bounce or unprompted entrance replays.

# NXTQR Logo System & Vector Geometry

## 1. Master ViewBox & Coordinate Architecture

All NXTQR logo symbol assets utilize a standard coordinate space:

```
viewBox="0 0 128 128"
Center: (64, 64)
```

```
       (18,18)                 (110,18)
          ┌──               ──┐
          │                   │
               ╭──╮   ╭──╮
               │  │   │  │
               │  ╰───╯  │
               │  ╭───╮  │
               │  │   │  │
               ╰──╯   ╰──╯
          │                   │
          └──               ──┘
       (18,110)                (110,110)
```

---

## 2. Geometric Elements

### 2.1 Precision Corner Framing

- **Coordinates:** Four symmetric L-brackets spanning from `(18, 18)` to `(110, 110)`.
- **Corner Radius:** 6px (`rounded-md` standard).
- **Stroke Width:** 3.5px with round line joins (`stroke-linejoin="round"`) and round end-caps.
- **Arm Length:** 18px along each coordinate axis.
- **Semantics:** Suggests an engineering viewport selection or canvas focus.

### 2.2 Continuous Geometric N Ribbon

- **Bounds:** Left `x = 34`, Right `x = 94`, Top `y = 30`, Bottom `y = 98` (Width = 60px, Height = 68px).
- **Optical Balance:** Centered horizontally (`center.x = 64`) with 15px clearance to corner brackets.
- **Facets:** Features subtle undercut facets at `opacity="0.35"` providing solid depth without glassmorphism.

### 2.3 Directed Execution Laser Beam

- **Trajectory:** Crosses the center axis at `y = 64` from `x = 26` to `x = 102`.
- **Accent Pulse:** Features an optical node at `(64, 64)` (`r = 3.5`).
- **Semantic Mapping:** Driven by `var(--accent)` (e.g. Pure Red, Pure Orange, Pure Blue).

---

## 3. Logo Variants

| Variant        | Components                          | Primary Use Case                                |
| :------------- | :---------------------------------- | :---------------------------------------------- |
| **`full`**     | Monogram + Wordmark + Category      | Application headers, docs, desktop auth         |
| **`symbol`**   | Framed N Monogram                   | Collapsed sidebars, app icons, browser tabs     |
| **`minimal`**  | Unframed N Monogram                 | Dense telemetry tables, micro-indicators (16px) |
| **`wordmark`** | Styled Text + Category              | Compact navigation strips, marketing footers    |
| **`stacked`**  | Centered Symbol + Centered Wordmark | Modal dialogs, social previews, splash screens  |

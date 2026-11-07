# NXTQR Wordmark Typography Fallback Architecture

## 1. Primary Wordmark Specification

- **Primary Font:** `Geist Sans` (via Next.js `@next/font` / `geist/font/sans`)
- **CSS Variable:** `var(--font-geist-sans)`
- **Font Weight:** 700 (Bold)
- **Tracking / Letter Spacing:** `-0.04em` (optical tightness for geometric presence)
- **Text Transform:** Uppercase (`uppercase`)
- **Line Height:** 1.0 (tight bounding box)

---

## 2. Fallback Stack & Metric Normalization

To prevent horizontal reflow, cumulative layout shift (CLS), or awkward kerning gaps in environments where Geist Sans is blocked or loading:

```css
font-family:
  Geist Sans,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  Roboto,
  "Helvetica Neue",
  Arial,
  sans-serif,
  system-ui;
```

### Fallback Guarantee Rules:

1. **Zero Text Reflow:** The `-0.04em` tracking remains constant across the entire fallback chain.
2. **Uppercase Integrity:** All letterforms remain strictly uppercase; lower-case styling is prohibited.
3. **No Synthetic Italics:** Oblique or faux-italic rendering is prohibited.

---

## 3. Optical Kerning Pairs

| Pair      | Kerning Delta | Reason                                                                                      |
| :-------- | :------------ | :------------------------------------------------------------------------------------------ |
| **N – X** | `-0.02em`     | Tightens the space between N right vertical column and X upper-left stroke.                 |
| **X – T** | `-0.04em`     | Compensates for the negative space beneath the T left crossbar over X.                      |
| **T – Q** | `-0.05em`     | Compensates for the negative space beneath the T right crossbar before the circular Q bowl. |
| **Q – R** | `-0.03em`     | Provides optical clearance for the Q diagonal tail entering the R vertical stem.            |

---

## 4. Category & Subtitle Typography

- **Text:** `INTERACTIVE VISUAL ENGINEERING STUDIO`
- **Font Family:** `Geist Mono, ui-monospace, Menlo, Consolas, monospace`
- **Weight:** 500 (Medium)
- **Tracking:** `0.16em` (expanded technical letterspacing)
- **Color:** `var(--muted-foreground)` (`#A3A3A3` in dark theme)

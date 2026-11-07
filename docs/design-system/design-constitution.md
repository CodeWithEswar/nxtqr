# NXTQR Design Constitution

## 1. Pure Black Monochrome Core

The foundation of NXTQR is developer precision. Pure black (`#000000`) is the default dark canvas background. Hierarchy is conveyed through deliberate neutral grayscale surfaces:

- Canvas/Page background: `#000000`
- Surface level 1: `#080808`
- Elevated surface: `#111111`
- Muted surface: `#171717`
- Borders: `#262626` and `#1C1C1C`

## 2. Dynamic User-Selected Accent

NXTQR has no fixed brand accent. The user chooses their accent color (monochrome neutral white, calibrated presets, or custom HEX). All controls derive styling from CSS custom properties:

- `--accent`: primary interactive fill
- `--accent-foreground`: auto-calculated WCAG AA/AAA compliant text color
- `--accent-hover`, `--accent-active`, `--accent-muted`: perceptually adjusted shades
- `--ring`: focus ring matched to accent

## 3. Strict Global Radius: `rounded-md`

All rectangular components must use `--radius: 0.375rem` (`rounded-md`):

- Buttons, inputs, textareas, selects, cards, dialogs, popovers, sheets, tooltips, tabs, and canvas nodes.
- Circular elements are permitted strictly for avatars, radio buttons, and loading spinners.

## 4. Typography

- **Geist Sans**: Interface typography, labels, titles, descriptions.
- **Geist Mono**: Code blocks, node IDs, coordinates, tabular numeric metrics, timestamps, logs.

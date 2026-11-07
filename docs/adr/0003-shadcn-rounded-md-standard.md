# ADR 0003: Standardize on shadcn/ui and `rounded-md` Radius

## Status

Accepted

## Context

Developer tool interfaces require precise, predictable dimensions and consistent corner radii. Inconsistent rounding (`rounded-xl`, `rounded-2xl`, arbitrary pill buttons) leads to visual clutter.

## Decision

- Standardize all rectangular components on `--radius: 0.375rem` (`rounded-md`).
- Buttons, inputs, dialogs, cards, tooltips, popovers, tabs, and canvas nodes all strictly use `rounded-md`.
- Circular elements are permitted only for intrinsically circular entities: avatars, radio buttons, spinners.

## Consequences

- Every new component must inherit `rounded-md` from the centralized token.

# Responsive Engineering Rules

## Screen Size Adaptations

- **Mobile (< 640px)**:
  - Collapse multi-column inspector layouts into modal `Sheet` or `Drawer`.
  - Maintain 44px minimum touch target sizes on interactive touch surfaces.
  - Hide non-essential secondary toolbar buttons; group them under `MoreHorizontalIcon` dropdown menus.
  - Prevent horizontal viewport overflow.
- **Tablet (640px - 1024px)**:
  - Collapsible side navigation with icon-only collapsed state.
  - Maintain primary canvas usability with touch pan/zoom support.
- **Desktop (>= 1024px)**:
  - Support high-density three-panel layouts (sidebar navigation, central visualizer canvas, right-hand node property inspector).
  - Resizable panel dividers with keyboard shortcuts (`Cmd/Ctrl + B` for sidebar, `Cmd/Ctrl + I` for inspector).

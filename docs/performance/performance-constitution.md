# Performance Constitution

## Platform Budgets

- **Initial Shell Bundle**: `< 150KB` gzip initial JavaScript payload.
- **Canvas Frame Rate**: Sustained `60fps` (`16.6ms` frame budget) during panning and zooming.
- **Background Layout**: ELK.js layout calculations offloaded to Web Workers to prevent blocking the main thread.
- **Dynamic Imports**: React Flow (`@xyflow/react`), Recharts, D3, and Monaco Editor must only be loaded when entering their respective visualizer screens.
- **State Granularity**: Decouple high-frequency canvas coordinates from global app React tree to avoid whole-page rerenders.

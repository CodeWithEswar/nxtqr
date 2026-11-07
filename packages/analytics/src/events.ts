export type TelemetryEventType =
  | "theme_changed"
  | "accent_customized"
  | "project_created"
  | "visualizer_opened"
  | "canvas_pan_zoom"
  | "simulation_started"
  | "simulation_finished";

export interface TelemetryEvent<TProps = Record<string, unknown>> {
  eventType: TelemetryEventType;
  anonymousId?: string;
  timestamp: string;
  properties: TProps;
}

export interface TelemetryEmitter {
  track<TProps = Record<string, unknown>>(event: TelemetryEvent<TProps>): void;
}

export const nullTelemetryEmitter: TelemetryEmitter = {
  track: () => {
    // No-op for privacy or test environments
  },
};

export const typographyScale = {
  display: "text-2xl font-semibold tracking-tight",
  heading: "text-xl font-semibold tracking-tight",
  sectionTitle: "text-lg font-medium tracking-normal",
  body: "text-sm font-normal leading-relaxed",
  secondary: "text-xs font-normal text-muted-foreground",
  caption: "text-[11px] font-normal text-muted-foreground tracking-wide",
  label: "text-xs font-medium text-foreground",
  code: "font-mono text-xs leading-none",
  metric: "font-mono text-sm font-medium tabular-nums tracking-tight",
} as const;

export type TypographyVariant = keyof typeof typographyScale;

import { CpuIcon, getInfrastructureIcon } from "@nxtqr/icons";

export function TutorialComponentIcon({ slug, size = 16 }: { slug?: string; size?: number }) {
  const Icon = slug ? getInfrastructureIcon(slug) : undefined;
  return Icon ? <Icon size={size} variant="colored" /> : <CpuIcon size={size} />;
}

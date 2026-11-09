export * from "./web-browser-icon";
export * from "./mobile-application-icon";
export * from "./desktop-application-icon";
export * from "./single-page-application-icon";
export * from "./server-rendered-app-icon";
export * from "./static-website-icon";
export * from "./progressive-web-app-icon";
export * from "./cli-client-icon";
export * from "./iot-device-icon";
export * from "./third-party-client-icon";

import type { InfrastructureIconComponent } from "../types";
import { WebBrowserIcon } from "./web-browser-icon";
import { MobileApplicationIcon } from "./mobile-application-icon";
import { DesktopApplicationIcon } from "./desktop-application-icon";
import { SinglePageApplicationIcon } from "./single-page-application-icon";
import { ServerRenderedAppIcon } from "./server-rendered-app-icon";
import { StaticWebsiteIcon } from "./static-website-icon";
import { ProgressiveWebAppIcon } from "./progressive-web-app-icon";
import { CliClientIcon } from "./cli-client-icon";
import { IotDeviceIcon } from "./iot-device-icon";
import { ThirdPartyClientIcon } from "./third-party-client-icon";

export const clientIconRegistry: Record<string, InfrastructureIconComponent> = {
  "web-browser": WebBrowserIcon,
  "mobile-application": MobileApplicationIcon,
  "desktop-application": DesktopApplicationIcon,
  "single-page-application": SinglePageApplicationIcon,
  "server-side-rendered-app": ServerRenderedAppIcon,
  "static-website": StaticWebsiteIcon,
  "progressive-web-app": ProgressiveWebAppIcon,
  "cli-client": CliClientIcon,
  "iot-device": IotDeviceIcon,
  "third-party-client": ThirdPartyClientIcon,
};

export function getClientInfrastructureIcon(
  slug: string
): InfrastructureIconComponent | undefined {
  return clientIconRegistry[slug];
}


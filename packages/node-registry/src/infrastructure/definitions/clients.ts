import type { InfrastructureComponentDefinition, InfrastructureCategoryDefinition } from "../types";
import {
  WebBrowserConfigSchema,
  MobileApplicationConfigSchema,
  DesktopApplicationConfigSchema,
  SinglePageApplicationConfigSchema,
  ServerRenderedAppConfigSchema,
  StaticWebsiteConfigSchema,
  ProgressiveWebAppConfigSchema,
  CliClientConfigSchema,
  IotDeviceConfigSchema,
  ThirdPartyClientConfigSchema,
  type WebBrowserConfig,
  type MobileApplicationConfig,
  type DesktopApplicationConfig,
  type SinglePageApplicationConfig,
  type ServerRenderedAppConfig,
  type StaticWebsiteConfig,
  type ProgressiveWebAppConfig,
  type CliClientConfig,
  type IotDeviceConfig,
  type ThirdPartyClientConfig,
} from "../schemas/clients.schema";

export const CLIENTS_CATEGORY_ID = "clients-and-user-interfaces";

export const clientsCategoryDefinition: InfrastructureCategoryDefinition = {
  id: CLIENTS_CATEGORY_ID,
  name: "Clients & User Interfaces",
  description: "User interfaces, frontend applications, mobile clients, and telemetry emitters.",
  iconSlug: "web-browser",
  order: 1,
};

// 01 — Web Browser
export const webBrowserDefinition: InfrastructureComponentDefinition<WebBrowserConfig> = {
  id: "web-browser",
  version: 1,
  categoryId: CLIENTS_CATEGORY_ID,
  display: {
    name: "Web Browser",
    shortName: "Browser",
    description: "Standard end-user web client running an interactive HTML/JS application environment.",
    keywords: ["browser", "chrome", "firefox", "safari", "client", "web", "http"],
    iconSlug: "web-browser",
  },
  configSchema: WebBrowserConfigSchema,
  defaultConfig: {
    label: "Web Browser",
    description: "End-user browser client",
    componentType: "web-browser",
    environment: "production",
    tags: ["client", "web"],
    notes: "",
    enabled: true,
    browserFamily: "chromium",
    supportedTransports: ["HTTPS", "WebSocket"],
    cookieSupport: true,
    localStorage: true,
    sessionStorage: true,
    cachingStrategy: "standard",
    concurrentUsers: 500,
  },
  ports: [
    { id: "http-out", name: "HTTP(S) Out", type: "output", dataType: "HTTP_Request", description: "Outbound HTTPS requests to CDN, Ingress, or API Gateway" },
    { id: "ws-conn", name: "WebSocket", type: "bidirectional", dataType: "WS_Frame", description: "Full-duplex WebSocket connection" },
    { id: "sse-in", name: "SSE In", type: "input", dataType: "Server_Event", description: "Inbound Server-Sent Events stream" },
  ],
  capabilities: ["http-client", "websocket", "cookies", "dom-storage", "caching"],
  node: { variant: "standard", minWidth: 200, minHeight: 84 },
  inspector: [
    {
      id: "config",
      title: "Browser Configuration",
      fields: [
        {
          path: "browserFamily",
          label: "Browser Engine",
          type: "select",
          options: [
            { label: "Chromium / Chrome", value: "chromium" },
            { label: "Firefox / Gecko", value: "firefox" },
            { label: "Safari / WebKit", value: "safari" },
            { label: "Generic Web Standards", value: "generic" },
            { label: "Other", value: "other" },
          ],
        },
        {
          path: "cachingStrategy",
          label: "Cache Strategy",
          type: "select",
          options: [
            { label: "Standard HTTP Caching", value: "standard" },
            { label: "Aggressive Service Worker", value: "aggressive" },
            { label: "No Cache / Ephemeral", value: "none" },
          ],
        },
        { path: "cookieSupport", label: "Cookie Support", type: "boolean" },
        { path: "localStorage", label: "Local Storage Enabled", type: "boolean" },
      ],
    },
    {
      id: "assumptions",
      title: "Architecture Assumptions",
      fields: [
        { path: "concurrentUsers", label: "Estimated Concurrent Users", type: "number", min: 1, max: 10000000, unit: "users" },
      ],
    },
  ],
};

// 02 — Mobile Application
export const mobileApplicationDefinition: InfrastructureComponentDefinition<MobileApplicationConfig> = {
  id: "mobile-application",
  version: 1,
  categoryId: CLIENTS_CATEGORY_ID,
  display: {
    name: "Mobile Application",
    shortName: "Mobile App",
    description: "Native or hybrid application running on smartphones and tablets with intermittent connectivity.",
    keywords: ["mobile", "ios", "android", "smartphone", "app", "native", "push"],
    iconSlug: "mobile-application",
  },
  configSchema: MobileApplicationConfigSchema,
  defaultConfig: {
    label: "Mobile Application",
    description: "Native iOS / Android app",
    componentType: "mobile-application",
    environment: "production",
    tags: ["mobile", "native"],
    notes: "",
    enabled: true,
    platform: "cross-platform",
    connectivity: "intermittent",
    apiTransport: "HTTPS",
    storageStrategy: "sqlite",
    pushNotifications: true,
    backgroundSync: true,
    activeDevices: 5000,
  },
  ports: [
    { id: "api-out", name: "API Out", type: "output", dataType: "HTTPS_Request", description: "REST / GraphQL egress to backend services" },
    { id: "ws-conn", name: "Realtime WS", type: "bidirectional", dataType: "WS_Stream", description: "Realtime messaging channel" },
    { id: "push-in", name: "Push In", type: "input", dataType: "APNS_FCM_Payload", description: "Inbound push notifications from FCM or APNs" },
  ],
  capabilities: ["offline-storage", "push-receiver", "background-sync", "biometrics"],
  node: { variant: "standard", minWidth: 200, minHeight: 84 },
  inspector: [
    {
      id: "config",
      title: "Mobile Configuration",
      fields: [
        {
          path: "platform",
          label: "Target Platform",
          type: "select",
          options: [
            { label: "Cross-Platform (React Native / Flutter)", value: "cross-platform" },
            { label: "Apple iOS Native", value: "ios" },
            { label: "Google Android Native", value: "android" },
            { label: "Other Mobile OS", value: "other" },
          ],
        },
        {
          path: "connectivity",
          label: "Network Mode",
          type: "select",
          options: [
            { label: "Intermittent / Cellular", value: "intermittent" },
            { label: "Always Online", value: "online" },
            { label: "Offline-First Local DB", value: "offline-capable" },
          ],
        },
        {
          path: "storageStrategy",
          label: "Local Persistence",
          type: "select",
          options: [
            { label: "SQLite / WatermelonDB", value: "sqlite" },
            { label: "Key-Value Store (MMKV)", value: "key-value" },
            { label: "Encrypted File System", value: "encrypted-fs" },
            { label: "None (Stateless)", value: "none" },
          ],
        },
        { path: "pushNotifications", label: "Push Notifications", type: "boolean" },
        { path: "backgroundSync", label: "Background Sync", type: "boolean" },
      ],
    },
    {
      id: "assumptions",
      title: "Architecture Assumptions",
      fields: [
        { path: "activeDevices", label: "Active Installed Devices", type: "number", min: 1, unit: "devices" },
      ],
    },
  ],
};

// 03 — Desktop Application
export const desktopApplicationDefinition: InfrastructureComponentDefinition<DesktopApplicationConfig> = {
  id: "desktop-application",
  version: 1,
  categoryId: CLIENTS_CATEGORY_ID,
  display: {
    name: "Desktop Application",
    shortName: "Desktop App",
    description: "Local workstation native or hybrid client with direct filesystem and OS runtime integration.",
    keywords: ["desktop", "electron", "macos", "windows", "linux", "workstation"],
    iconSlug: "desktop-application",
  },
  configSchema: DesktopApplicationConfigSchema,
  defaultConfig: {
    label: "Desktop Application",
    description: "Workstation client application",
    componentType: "desktop-application",
    environment: "production",
    tags: ["desktop", "workstation"],
    notes: "",
    enabled: true,
    platform: "cross-platform",
    applicationModel: "native",
    apiTransport: "HTTPS",
    localPersistence: "sqlite",
    backgroundProcessing: true,
    autoUpdateDelivery: true,
  },
  ports: [
    { id: "api-out", name: "API Out", type: "output", dataType: "HTTPS_Request", description: "Outbound HTTPS or TCP calls to backend services" },
    { id: "ipc-local", name: "Local IPC", type: "bidirectional", dataType: "IPC_Message", description: "Inter-process communications with system daemons" },
    { id: "ws-conn", name: "WebSocket", type: "bidirectional", dataType: "WS_Stream", description: "Realtime telemetry and notifications" },
  ],
  capabilities: ["filesystem-access", "multi-threading", "native-ipc", "auto-updater"],
  node: { variant: "standard", minWidth: 200, minHeight: 84 },
  inspector: [
    {
      id: "config",
      title: "Desktop Configuration",
      fields: [
        {
          path: "platform",
          label: "Target Platform",
          type: "select",
          options: [
            { label: "Cross-Platform (Windows/macOS/Linux)", value: "cross-platform" },
            { label: "Windows Native (WinUI/WPF)", value: "windows" },
            { label: "macOS Native (Swift/AppKit)", value: "macos" },
            { label: "Linux (GTK/Qt)", value: "linux" },
          ],
        },
        {
          path: "applicationModel",
          label: "Runtime Model",
          type: "select",
          options: [
            { label: "Native Compiled (Rust / C++ / Go)", value: "native" },
            { label: "Hybrid Electron / Tauri", value: "hybrid-electron" },
            { label: "Web Wrapped PWA", value: "web-wrapped" },
          ],
        },
        { path: "backgroundProcessing", label: "Background Processing", type: "boolean" },
        { path: "autoUpdateDelivery", label: "Auto-Update Delivery", type: "boolean" },
      ],
    },
  ],
};

// 04 — Single Page Application
export const singlePageApplicationDefinition: InfrastructureComponentDefinition<SinglePageApplicationConfig> = {
  id: "single-page-application",
  version: 1,
  categoryId: CLIENTS_CATEGORY_ID,
  display: {
    name: "Single Page Application",
    shortName: "SPA",
    description: "Client-rendered web application with dynamic client-side routing, virtual DOM, and modular components.",
    keywords: ["spa", "react", "vue", "angular", "client-rendered", "frontend"],
    iconSlug: "single-page-application",
  },
  configSchema: SinglePageApplicationConfigSchema,
  defaultConfig: {
    label: "Single Page Application",
    description: "Client-side rendered React / Vue SPA",
    componentType: "single-page-application",
    environment: "production",
    tags: ["spa", "frontend"],
    notes: "",
    enabled: true,
    framework: "react",
    routingMode: "client-side-history",
    stateManagement: "zustand",
    apiTransport: "REST",
    authIntegration: "jwt-bearer",
    clientCache: true,
  },
  ports: [
    { id: "api-out", name: "API Out", type: "output", dataType: "REST_GraphQL", description: "REST / GraphQL data calls to backend" },
    { id: "realtime-in", name: "Realtime In", type: "input", dataType: "WebSocket_SSE", description: "Realtime subscriptions and push updates" },
  ],
  capabilities: ["client-routing", "state-management", "client-caching", "oauth-oidc"],
  node: { variant: "standard", minWidth: 200, minHeight: 84 },
  inspector: [
    {
      id: "config",
      title: "SPA Configuration",
      fields: [
        {
          path: "framework",
          label: "Framework",
          type: "select",
          options: [
            { label: "React", value: "react" },
            { label: "Vue", value: "vue" },
            { label: "Svelte", value: "svelte" },
            { label: "Angular", value: "angular" },
            { label: "Other / Vanilla JS", value: "other" },
          ],
        },
        {
          path: "stateManagement",
          label: "State Manager",
          type: "select",
          options: [
            { label: "Zustand", value: "zustand" },
            { label: "Redux Toolkit", value: "redux" },
            { label: "Context / Signals", value: "signals" },
            { label: "Other", value: "other" },
          ],
        },
        {
          path: "apiTransport",
          label: "API Protocol",
          type: "select",
          options: [
            { label: "REST / JSON", value: "REST" },
            { label: "GraphQL", value: "GraphQL" },
            { label: "tRPC", value: "tRPC" },
            { label: "WebSocket RPC", value: "WebSocket" },
          ],
        },
        { path: "clientCache", label: "Client-Side Cache Enabled", type: "boolean" },
      ],
    },
  ],
};

// 05 — Server-Side Rendered Application
export const serverRenderedAppDefinition: InfrastructureComponentDefinition<ServerRenderedAppConfig> = {
  id: "server-side-rendered-app",
  version: 1,
  categoryId: CLIENTS_CATEGORY_ID,
  display: {
    name: "Server-Side Rendered Application",
    shortName: "SSR App",
    description: "Hybrid frontend architecture where HTML is dynamically pre-rendered on the server and hydrated on the client.",
    keywords: ["ssr", "nextjs", "remix", "streaming", "hydration", "edge-rendering"],
    iconSlug: "server-side-rendered-app",
  },
  configSchema: ServerRenderedAppConfigSchema,
  defaultConfig: {
    label: "Server-Side Rendered App",
    description: "Dynamic Next.js / Remix SSR architecture",
    componentType: "server-side-rendered-app",
    environment: "production",
    tags: ["ssr", "hydration"],
    notes: "",
    enabled: true,
    framework: "nextjs",
    renderingStrategy: "streaming",
    hydrationStrategy: "full",
    cachePolicy: "edge-cached",
    serverRuntime: "nodejs",
    revalidationSeconds: 60,
  },
  ports: [
    { id: "client-ingress", name: "Client Ingress", type: "input", dataType: "HTTP_Ingress", description: "Inbound user page navigation requests" },
    { id: "backend-api-out", name: "Backend API Out", type: "output", dataType: "Internal_RPC", description: "Server-to-server data fetch during SSR" },
    { id: "db-conn", name: "Direct DB", type: "output", dataType: "DB_Query", description: "Direct serverless database / cache connection" },
  ],
  capabilities: ["server-rendering", "streaming-html", "edge-caching", "seo-optimization"],
  node: { variant: "standard", minWidth: 200, minHeight: 84 },
  inspector: [
    {
      id: "config",
      title: "SSR Runtime Configuration",
      fields: [
        {
          path: "framework",
          label: "Framework",
          type: "select",
          options: [
            { label: "Next.js (App Router)", value: "nextjs" },
            { label: "Remix / React Router v7", value: "remix" },
            { label: "Nuxt (Vue)", value: "nuxt" },
            { label: "SvelteKit", value: "sveltekit" },
            { label: "Other", value: "other" },
          ],
        },
        {
          path: "renderingStrategy",
          label: "Render Strategy",
          type: "select",
          options: [
            { label: "Streaming SSR", value: "streaming" },
            { label: "Full Dynamic SSR", value: "ssr" },
            { label: "Incremental Static (ISR)", value: "isr" },
          ],
        },
        {
          path: "serverRuntime",
          label: "Server Runtime",
          type: "select",
          options: [
            { label: "Node.js Container", value: "nodejs" },
            { label: "Edge Workers (V8 Isolate)", value: "edge-worker" },
            { label: "Serverless Function (AWS Lambda)", value: "serverless" },
          ],
        },
        { path: "revalidationSeconds", label: "ISR Revalidation", type: "number", min: 0, max: 86400, unit: "seconds" },
      ],
    },
  ],
};

// 06 — Static Website
export const staticWebsiteDefinition: InfrastructureComponentDefinition<StaticWebsiteConfig> = {
  id: "static-website",
  version: 1,
  categoryId: CLIENTS_CATEGORY_ID,
  display: {
    name: "Static Website",
    shortName: "Static Site",
    description: "Pre-generated immutable HTML, CSS, and asset files served globally through an edge CDN.",
    keywords: ["static", "cdn", "jamstack", "s3", "blob", "immutable"],
    iconSlug: "static-website",
  },
  configSchema: StaticWebsiteConfigSchema,
  defaultConfig: {
    label: "Static Website",
    description: "Pre-generated JAMstack site on Edge CDN",
    componentType: "static-website",
    environment: "production",
    tags: ["static", "cdn"],
    notes: "",
    enabled: true,
    hostingType: "cdn-edge",
    cdnProvider: "cloudflare",
    assetCaching: "immutable",
    deploymentStrategy: "git-triggered",
    hasFormOrApi: true,
  },
  ports: [
    { id: "cdn-ingress", name: "CDN Ingress", type: "input", dataType: "HTTP_Get", description: "Global edge CDN requests from visitors" },
    { id: "api-call-out", name: "Client API Out", type: "output", dataType: "HTTPS_Request", description: "Client-side AJAX / fetch calls to backend APIs" },
  ],
  capabilities: ["zero-server", "edge-caching", "infinite-scalability", "ddos-resilience"],
  node: { variant: "standard", minWidth: 200, minHeight: 84 },
  inspector: [
    {
      id: "config",
      title: "Static Hosting Configuration",
      fields: [
        {
          path: "hostingType",
          label: "Hosting Target",
          type: "select",
          options: [
            { label: "Global Edge CDN (Cloudflare Pages, Vercel)", value: "cdn-edge" },
            { label: "Cloud Object Storage (S3, GCS, R2)", value: "object-storage" },
            { label: "Web Server (Nginx, Caddy)", value: "web-server" },
          ],
        },
        {
          path: "assetCaching",
          label: "Asset Cache Header",
          type: "select",
          options: [
            { label: "Immutable (1 Year + Fingerprinted Hash)", value: "immutable" },
            { label: "Standard (Max-Age 3600)", value: "standard" },
            { label: "No Cache / ETag Revalidate", value: "minimal" },
          ],
        },
        { path: "hasFormOrApi", label: "Includes Client API Calls", type: "boolean" },
      ],
    },
  ],
};

// 07 — Progressive Web Application
export const progressiveWebAppDefinition: InfrastructureComponentDefinition<ProgressiveWebAppConfig> = {
  id: "progressive-web-app",
  version: 1,
  categoryId: CLIENTS_CATEGORY_ID,
  display: {
    name: "Progressive Web Application",
    shortName: "PWA",
    description: "Web application leveraging service workers, web app manifests, and offline caching for an app-like experience.",
    keywords: ["pwa", "service-worker", "offline", "cache", "manifest", "installable"],
    iconSlug: "progressive-web-app",
  },
  configSchema: ProgressiveWebAppConfigSchema,
  defaultConfig: {
    label: "Progressive Web App",
    description: "Offline-capable installable PWA",
    componentType: "progressive-web-app",
    environment: "production",
    tags: ["pwa", "offline"],
    notes: "",
    enabled: true,
    installable: true,
    serviceWorkerUsage: "stale-while-revalidate",
    offlineCapable: true,
    backgroundSync: true,
    pushCapability: true,
    updateStrategy: "prompt-reload",
  },
  ports: [
    { id: "http-out", name: "HTTPS Out", type: "output", dataType: "HTTPS_Request", description: "Outbound API requests intercepted by Service Worker" },
    { id: "push-in", name: "Web Push In", type: "input", dataType: "WebPush_Message", description: "Inbound push notifications from Web Push server" },
    { id: "sync-out", name: "Background Sync", type: "output", dataType: "Sync_Task", description: "Deferred background queue execution on reconnect" },
  ],
  capabilities: ["service-worker", "web-manifest", "offline-cache", "web-push"],
  node: { variant: "standard", minWidth: 200, minHeight: 84 },
  inspector: [
    {
      id: "config",
      title: "PWA Configuration",
      fields: [
        {
          path: "serviceWorkerUsage",
          label: "Service Worker Strategy",
          type: "select",
          options: [
            { label: "Stale-While-Revalidate", value: "stale-while-revalidate" },
            { label: "Network First (Fallback to Cache)", value: "network-first" },
            { label: "Cache First (Offline Heavy)", value: "cache-first" },
          ],
        },
        { path: "installable", label: "Add to Home Screen (A2HS)", type: "boolean" },
        { path: "offlineCapable", label: "Offline Mode Enabled", type: "boolean" },
        { path: "backgroundSync", label: "Background Sync", type: "boolean" },
        { path: "pushCapability", label: "Web Push Notifications", type: "boolean" },
      ],
    },
  ],
};

// 08 — CLI Client
export const cliClientDefinition: InfrastructureComponentDefinition<CliClientConfig> = {
  id: "cli-client",
  version: 1,
  categoryId: CLIENTS_CATEGORY_ID,
  display: {
    name: "CLI Client",
    shortName: "CLI",
    description: "Command-line tool, developer terminal utility, or automated CI/CD script communicating with remote APIs.",
    keywords: ["cli", "terminal", "command-line", "bash", "grpc", "script", "batch"],
    iconSlug: "cli-client",
  },
  configSchema: CliClientConfigSchema,
  defaultConfig: {
    label: "CLI Client",
    description: "Command-line interface client",
    componentType: "cli-client",
    environment: "production",
    tags: ["cli", "terminal"],
    notes: "",
    enabled: true,
    runtimeEnvironment: "cross-platform",
    executionMode: "interactive",
    authMethod: "api-key",
    apiTransport: "REST-HTTPS",
    retryPolicy: "exponential-backoff",
    timeoutMs: 30000,
  },
  ports: [
    { id: "api-out", name: "API Out", type: "output", dataType: "REST_gRPC", description: "Outbound commands to API or microservice" },
    { id: "stream-out", name: "Telemetry Out", type: "output", dataType: "Log_Stream", description: "Standard output or log stream" },
  ],
  capabilities: ["headless-execution", "scripting", "api-key-auth", "pipeable-output"],
  node: { variant: "standard", minWidth: 200, minHeight: 84 },
  inspector: [
    {
      id: "config",
      title: "CLI Configuration",
      fields: [
        {
          path: "executionMode",
          label: "Execution Mode",
          type: "select",
          options: [
            { label: "Interactive Terminal Session", value: "interactive" },
            { label: "Headless Background Daemon", value: "headless-daemon" },
            { label: "Batch Job / CI Step", value: "batch-job" },
          ],
        },
        {
          path: "authMethod",
          label: "Authentication",
          type: "select",
          options: [
            { label: "API Key / Personal Token", value: "api-key" },
            { label: "OAuth Device Flow", value: "oauth-device-flow" },
            { label: "SSH Key Signature", value: "ssh-key" },
            { label: "None / Anonymous", value: "none" },
          ],
        },
        {
          path: "apiTransport",
          label: "Transport Protocol",
          type: "select",
          options: [
            { label: "HTTPS / REST", value: "REST-HTTPS" },
            { label: "gRPC / Protobuf", value: "gRPC" },
            { label: "Raw TCP / TLS Socket", value: "raw-tcp" },
          ],
        },
        { path: "timeoutMs", label: "Request Timeout", type: "number", min: 100, max: 300000, unit: "ms" },
      ],
    },
  ],
};

// 09 — IoT Device
export const iotDeviceDefinition: InfrastructureComponentDefinition<IotDeviceConfig> = {
  id: "iot-device",
  version: 1,
  categoryId: CLIENTS_CATEGORY_ID,
  display: {
    name: "IoT Device",
    shortName: "IoT Device",
    description: "Embedded microcontroller, edge sensor, or physical connected hardware emitting regular telemetry.",
    keywords: ["iot", "sensor", "mqtt", "hardware", "telemetry", "embedded", "coap"],
    iconSlug: "iot-device",
  },
  configSchema: IotDeviceConfigSchema,
  defaultConfig: {
    label: "IoT Device",
    description: "Edge telemetry sensor node",
    componentType: "iot-device",
    environment: "production",
    tags: ["iot", "embedded"],
    notes: "",
    enabled: true,
    deviceClass: "sensor",
    connectivityType: "wifi",
    communicationProtocol: "MQTT",
    telemetryIntervalSeconds: 60,
    powerSource: "mains-powered",
    hardwareSecurity: "software-cert",
    bufferOffline: true,
    deviceCount: 100,
  },
  ports: [
    { id: "telemetry-out", name: "Telemetry Out", type: "output", dataType: "MQTT_Payload", description: "Outbound sensor data or heartbeat telemetry" },
    { id: "command-in", name: "Command In", type: "input", dataType: "Downlink_Cmd", description: "Inbound control instructions and firmware updates" },
  ],
  capabilities: ["mqtt-client", "low-power", "sensor-sampling", "offline-buffering"],
  node: { variant: "standard", minWidth: 200, minHeight: 84 },
  inspector: [
    {
      id: "config",
      title: "Device Configuration",
      fields: [
        {
          path: "communicationProtocol",
          label: "Protocol",
          type: "select",
          options: [
            { label: "MQTT (TLS Port 8883)", value: "MQTT" },
            { label: "HTTP / REST Webhook", value: "HTTP" },
            { label: "CoAP (Constrained Application)", value: "CoAP" },
            { label: "WebSocket Stream", value: "WebSocket" },
          ],
        },
        {
          path: "connectivityType",
          label: "Network Medium",
          type: "select",
          options: [
            { label: "Wi-Fi (802.11)", value: "wifi" },
            { label: "Cellular 4G/5G / NB-IoT", value: "cellular-5g-lte" },
            { label: "Ethernet LAN", value: "ethernet" },
            { label: "Bluetooth Low Energy (BLE)", value: "bluetooth-ble" },
            { label: "LoRaWAN Long Range", value: "lorawan" },
          ],
        },
        { path: "telemetryIntervalSeconds", label: "Sampling Interval", type: "number", min: 1, max: 86400, unit: "seconds" },
        { path: "bufferOffline", label: "Buffer During Disconnect", type: "boolean" },
      ],
    },
    {
      id: "assumptions",
      title: "Fleet Assumptions",
      fields: [
        { path: "deviceCount", label: "Fleet Device Count", type: "number", min: 1, max: 10000000, unit: "units" },
      ],
    },
  ],
};

// 10 — Third-Party Client
export const thirdPartyClientDefinition: InfrastructureComponentDefinition<ThirdPartyClientConfig> = {
  id: "third-party-client",
  version: 1,
  categoryId: CLIENTS_CATEGORY_ID,
  display: {
    name: "Third-Party Client",
    shortName: "3rd-Party Client",
    description: "External partner application, public integration, or consumer system consuming your APIs.",
    keywords: ["third-party", "partner", "external", "b2b", "webhook", "api-consumer"],
    iconSlug: "third-party-client",
  },
  configSchema: ThirdPartyClientConfigSchema,
  defaultConfig: {
    label: "Third-Party Client",
    description: "External API partner / consumer",
    componentType: "third-party-client",
    environment: "production",
    tags: ["external", "partner"],
    notes: "",
    enabled: true,
    clientCategory: "api-partner",
    integrationMethod: "rest-webhook",
    authMethod: "oauth2-m2m",
    requestFrequencyRps: 50,
    rateLimitTier: "standard-100rps",
    trustLevel: "zero-trust",
    timeoutMs: 10000,
  },
  ports: [
    { id: "api-ingress-out", name: "API Request Out", type: "output", dataType: "Partner_Request", description: "Outbound API calls toward your platform" },
    { id: "webhook-in", name: "Webhook In", type: "input", dataType: "Webhook_Payload", description: "Inbound webhook callbacks delivered to the partner" },
  ],
  capabilities: ["m2m-auth", "rate-limited", "untrusted-boundary", "webhook-receiver"],
  node: { variant: "standard", minWidth: 200, minHeight: 84 },
  inspector: [
    {
      id: "config",
      title: "Integration Configuration",
      fields: [
        {
          path: "clientCategory",
          label: "Partner Type",
          type: "select",
          options: [
            { label: "Verified API Partner", value: "api-partner" },
            { label: "Enterprise B2B Consumer", value: "enterprise-b2b" },
            { label: "Public Developer / Consumer", value: "public-consumer" },
            { label: "Internal Cross-Org Service", value: "internal-service" },
          ],
        },
        {
          path: "authMethod",
          label: "Authentication",
          type: "select",
          options: [
            { label: "OAuth 2.0 Client Credentials (M2M)", value: "oauth2-m2m" },
            { label: "Mutual TLS (mTLS)", value: "mutual-tls" },
            { label: "HMAC Signed Webhook", value: "hmac-signed-token" },
            { label: "Standard API Key Header", value: "api-key" },
          ],
        },
        {
          path: "trustLevel",
          label: "Trust Level",
          type: "select",
          options: [
            { label: "Zero-Trust (Strict Sanitization)", value: "zero-trust" },
            { label: "Verified Partner", value: "verified-partner" },
            { label: "Internal Trusted", value: "internal-trusted" },
          ],
        },
        { path: "timeoutMs", label: "Request Timeout", type: "number", min: 100, max: 120000, unit: "ms" },
      ],
    },
    {
      id: "assumptions",
      title: "Rate & Load Assumptions",
      fields: [
        { path: "requestFrequencyRps", label: "Expected Request Load", type: "number", min: 0, unit: "req/s" },
      ],
    },
  ],
};

export const ALL_CLIENT_DEFINITIONS: readonly InfrastructureComponentDefinition[] = [
  webBrowserDefinition,
  mobileApplicationDefinition,
  desktopApplicationDefinition,
  singlePageApplicationDefinition,
  serverRenderedAppDefinition,
  staticWebsiteDefinition,
  progressiveWebAppDefinition,
  cliClientDefinition,
  iotDeviceDefinition,
  thirdPartyClientDefinition,
] as const;

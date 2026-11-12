import type { AnalysisCapabilityAdapterInfo } from "../analysis-schemas";

export function listSimulationCapabilities(): AnalysisCapabilityAdapterInfo[] {
  return [
    {
      id: "cap_capacity_cost",
      name: "Capacity, Queueing (M/M/1 & M/M/c) & Cost Engine",
      supportedNodeKinds: ["gateway", "service", "database", "queue"],
      determinismSupported: true,
      available: true,
      limitations: "Uses synthetic pricing units and simplified queue distributions.",
    },
    {
      id: "cap_resilience_blast",
      name: "Fault Injection & Blast-Radius Traversal Engine",
      supportedNodeKinds: ["gateway", "service", "database", "cache", "queue", "external"],
      determinismSupported: true,
      available: true,
      limitations: "Models discrete dependency graph propagation without kernel packet capture.",
    },
    {
      id: "cap_observability_slo",
      name: "Observability, Critical Path & Error Budget Engine",
      supportedNodeKinds: ["gateway", "service", "database", "cache", "queue"],
      determinismSupported: true,
      available: true,
      limitations: "SLIs computed on simulated request windows rather than production TSDB.",
    },
    {
      id: "cap_dr_continuity",
      name: "Disaster Recovery RPO/RTO & Replication Engine",
      supportedNodeKinds: ["database", "storage", "service", "gateway"],
      determinismSupported: true,
      available: true,
      limitations: "Evaluates replication mode and regional failover readiness monotonically.",
    },
    {
      id: "cap_live_cloud_invoice",
      name: "Live Cloud Billing API & Production Telemetry",
      supportedNodeKinds: [],
      determinismSupported: false,
      available: false,
      limitations: "Out of scope: NXTQR models synthetic educational pricing only (no real cloud APIs).",
    },
  ];
}


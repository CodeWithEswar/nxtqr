"use client";

/**
 * NXTQR — Phase 05.3.18: Architecture Deployment Topology & Infrastructure Mapping Engine
 * Infrastructure Resource Catalog Component
 */

import React, { useState } from "react";
import type { InfrastructureResourceType } from "@nxtqr/architecture-intelligence";
import {
  LayersIcon,
  DatabaseIcon,
  ArchiveIcon,
  CpuIcon,
  PlusIcon,
} from "@nxtqr/icons";

interface CatalogItem {
  type: InfrastructureResourceType;
  label: string;
  category: "compute" | "networking" | "data" | "storage";
  description: string;
}

const CATALOG_ITEMS: CatalogItem[] = [
  // Compute & Containers
  {
    type: "k8s_workload",
    label: "Kubernetes Workload",
    category: "compute",
    description: "Deployment, StatefulSet, or DaemonSet container workload",
  },
  {
    type: "k8s_cluster",
    label: "Kubernetes Cluster",
    category: "compute",
    description: "Managed control plane (EKS, GKE, AKS, or custom)",
  },
  {
    type: "vm",
    label: "Virtual Machine",
    category: "compute",
    description: "Cloud EC2, Compute Engine, or Azure VM instance",
  },
  {
    type: "serverless_function",
    label: "Serverless Function",
    category: "compute",
    description: "Event-driven Lambda, Cloud Function, or Worker",
  },
  // Networking
  {
    type: "vpc",
    label: "Virtual Private Cloud (VPC)",
    category: "networking",
    description: "Isolated virtual network with defined IPv4 CIDR range",
  },
  {
    type: "subnet",
    label: "Network Subnet",
    category: "networking",
    description: "Public or private address block within a parent VPC",
  },
  {
    type: "load_balancer",
    label: "Load Balancer",
    category: "networking",
    description: "Layer 7 / Layer 4 traffic distributor (ALB, NLB, Gateway)",
  },
  {
    type: "api_gateway",
    label: "API Gateway / Ingress",
    category: "networking",
    description: "Edge routing, TLS termination, and rate-limiting ingress",
  },
  // Data & Storage
  {
    type: "managed_db",
    label: "Managed Database",
    category: "data",
    description: "Primary relational or document database (Aurora, Cloud SQL)",
  },
  {
    type: "db_replica",
    label: "Read Replica",
    category: "data",
    description: "Asynchronous read replica for scaling query throughput",
  },
  {
    type: "cache_cluster",
    label: "In-Memory Cache",
    category: "data",
    description: "Redis / Memcached cluster for low-latency retrieval",
  },
  {
    type: "object_storage",
    label: "Object Storage Bucket",
    category: "storage",
    description: "Scalable blob storage (S3, GCS, Azure Blob)",
  },
];

interface InfrastructureCatalogProps {
  onAddResource: (type: InfrastructureResourceType, name: string) => void;
}

export function InfrastructureCatalog({ onAddResource }: InfrastructureCatalogProps) {
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredItems = CATALOG_ITEMS.filter((item) => {
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    const matchesSearch =
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-[#080808] border-r border-[#262626]">
      {/* Catalog Header */}
      <div className="p-3 border-b border-[#262626]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#858585]">
            Infra Catalog
          </span>
          <span className="text-[11px] font-mono text-[#666666]">{filteredItems.length} types</span>
        </div>
        <input
          type="text"
          placeholder="Filter infrastructure..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#000000] border border-[#262626] focus:border-[#404040] focus:ring-1 focus:ring-[#404040] rounded-md px-2.5 py-1.5 text-xs text-[#FFFFFF] placeholder-[#666666] outline-none"
        />
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1 p-2 border-b border-[#1A1A1A] overflow-x-auto">
        {(["all", "compute", "networking", "data", "storage"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-2 py-0.5 text-[11px] font-mono rounded-md border transition-colors ${
              filterCategory === cat
                ? "bg-[#1A1A1A] text-[#FFFFFF] border-[#404040]"
                : "bg-transparent text-[#858585] border-transparent hover:border-[#262626]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Catalog List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filteredItems.map((item) => (
          <div
            key={item.type}
            className="group flex flex-col p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020] hover:border-[#333333] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {item.category === "compute" && <CpuIcon size={14} className="text-[#B5B5B5]" />}
                {item.category === "networking" && <LayersIcon size={14} className="text-[#B5B5B5]" />}
                {item.category === "data" && <DatabaseIcon size={14} className="text-[#B5B5B5]" />}
                {item.category === "storage" && <ArchiveIcon size={14} className="text-[#B5B5B5]" />}
                <span className="text-xs font-medium text-[#FFFFFF]">{item.label}</span>
              </div>
              <button
                onClick={() => onAddResource(item.type, item.label)}
                title={`Add ${item.label}`}
                className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-6 h-6 rounded-md bg-[#1A1A1A] border border-[#333333] hover:bg-[#262626] text-[#FFFFFF] transition-opacity"
              >
                <PlusIcon size={12} />
              </button>
            </div>
            <p className="text-[11px] text-[#858585] mt-1 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}


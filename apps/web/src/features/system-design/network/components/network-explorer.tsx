"use client";

/**
 * NXTQR — Phase 05.3.24: Architecture Network, API Gateway & Traffic Engineering Intelligence Engine
 * Network Explorer (Left Sidebar Catalog)
 */

import React, { useState } from "react";
import type {
  ApiGateway,
  LoadBalancer,
  UpstreamPool,
  DNSZone,
  TrafficScenario,
} from "@nxtqr/architecture-intelligence";
import {
  SearchIcon,
  ActivityIcon,
  ShieldIcon,
  LayersIcon,
  CpuIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@nxtqr/icons";

export interface NetworkExplorerProps {
  dnsZones: DNSZone[];
  gateways: ApiGateway[];
  loadBalancers: LoadBalancer[];
  upstreamPools: UpstreamPool[];
  scenarios: TrafficScenario[];
  selectedDnsZoneId: string | null;
  selectedGatewayId: string | null;
  selectedRouteId: string | null;
  selectedPoolId: string | null;
  selectedScenarioId: string | null;
  onSelectDnsZone: (id: string) => void;
  onSelectGateway: (id: string) => void;
  onSelectRoute: (gatewayId: string, routeId: string) => void;
  onSelectPool: (id: string) => void;
  onSelectScenario: (id: string) => void;
}

export function NetworkExplorer({
  dnsZones,
  gateways,
  loadBalancers,
  upstreamPools,
  scenarios,
  selectedDnsZoneId,
  selectedGatewayId,
  selectedRouteId,
  selectedPoolId,
  selectedScenarioId,
  onSelectDnsZone,
  onSelectGateway,
  onSelectRoute,
  onSelectPool,
  onSelectScenario,
}: NetworkExplorerProps) {
  const [filter, setFilter] = useState("");
  const [dnsExpanded, setDnsExpanded] = useState(true);
  const [gatewaysExpanded, setGatewaysExpanded] = useState(true);
  const [loadBalancersExpanded, setLoadBalancersExpanded] = useState(true);
  const [poolsExpanded, setPoolsExpanded] = useState(true);
  const [scenariosExpanded, setScenariosExpanded] = useState(true);

  const lowerFilter = filter.toLowerCase();

  const filteredDns = dnsZones.filter(
    (z) => z.domainName.toLowerCase().includes(lowerFilter) || z.providerTechnology.toLowerCase().includes(lowerFilter)
  );

  const filteredGateways = gateways.filter(
    (g) => g.name.toLowerCase().includes(lowerFilter) || g.providerTechnology.toLowerCase().includes(lowerFilter)
  );

  const filteredLbs = loadBalancers.filter(
    (lb) => lb.name.toLowerCase().includes(lowerFilter) || lb.providerTechnology.toLowerCase().includes(lowerFilter)
  );

  const filteredPools = upstreamPools.filter(
    (p) => p.name.toLowerCase().includes(lowerFilter)
  );

  const filteredScenarios = scenarios.filter(
    (s) => s.name.toLowerCase().includes(lowerFilter)
  );

  return (
    <aside className="w-64 h-full bg-[#080808] border-r border-[#262626] flex flex-col select-none">
      {/* Header & Filter */}
      <div className="p-3 border-b border-[#262626]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[#FFFFFF] tracking-wider uppercase">
            Network Catalog
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#141414] text-[#858585] border border-[#202020]">
            {gateways.length + loadBalancers.length + upstreamPools.length} Units
          </span>
        </div>
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-[#666666]" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search topology..."
            className="w-full bg-[#0D0D0D] border border-[#262626] rounded-md pl-8 pr-3 py-1.5 text-xs text-[#FFFFFF] placeholder-[#666666] focus:outline-none focus:border-[#404040]"
          />
        </div>
      </div>

      {/* Catalog Scroll Area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {/* DNS Zones Section */}
        <div>
          <button
            onClick={() => setDnsExpanded(!dnsExpanded)}
            className="w-full flex items-center justify-between px-2 py-1 text-xs font-medium text-[#B5B5B5] hover:text-[#FFFFFF] rounded-md"
          >
            <div className="flex items-center gap-1.5">
              <ShieldIcon className="w-3.5 h-3.5 text-[#858585]" />
              <span>DNS Zones ({filteredDns.length})</span>
            </div>
            {dnsExpanded ? <ChevronDownIcon className="w-3 h-3 text-[#858585]" /> : <ChevronRightIcon className="w-3 h-3 text-[#858585]" />}
          </button>
          {dnsExpanded && (
            <div className="mt-1 space-y-0.5 pl-2">
              {filteredDns.map((zone) => {
                const isSelected = selectedDnsZoneId === zone.id;
                return (
                  <button
                    key={zone.id}
                    onClick={() => onSelectDnsZone(zone.id)}
                    className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between ${
                      isSelected
                        ? "bg-[#1A1A1A] text-[#FFFFFF] border border-[#333333] font-medium"
                        : "text-[#B5B5B5] hover:bg-[#0D0D0D] hover:text-[#FFFFFF] border border-transparent"
                    }`}
                  >
                    <span className="truncate">{zone.domainName}</span>
                    <span className="text-[10px] font-mono text-[#858585]">
                      {zone.records.length} rec
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* API Gateways Section */}
        <div>
          <button
            onClick={() => setGatewaysExpanded(!gatewaysExpanded)}
            className="w-full flex items-center justify-between px-2 py-1 text-xs font-medium text-[#B5B5B5] hover:text-[#FFFFFF] rounded-md"
          >
            <div className="flex items-center gap-1.5">
              <LayersIcon className="w-3.5 h-3.5 text-[#858585]" />
              <span>API Gateways ({filteredGateways.length})</span>
            </div>
            {gatewaysExpanded ? <ChevronDownIcon className="w-3 h-3 text-[#858585]" /> : <ChevronRightIcon className="w-3 h-3 text-[#858585]" />}
          </button>
          {gatewaysExpanded && (
            <div className="mt-1 space-y-1 pl-2">
              {filteredGateways.map((gw) => {
                const isSelected = selectedGatewayId === gw.id;
                return (
                  <div key={gw.id} className="space-y-0.5">
                    <button
                      onClick={() => onSelectGateway(gw.id)}
                      className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between ${
                        isSelected
                          ? "bg-[#1A1A1A] text-[#FFFFFF] border border-[#333333] font-medium"
                          : "text-[#B5B5B5] hover:bg-[#0D0D0D] hover:text-[#FFFFFF] border border-transparent"
                      }`}
                    >
                      <span className="truncate">{gw.name}</span>
                      <span className="text-[10px] font-mono px-1 rounded bg-[#141414] text-[#858585]">
                        {gw.providerTechnology}
                      </span>
                    </button>
                    {isSelected && (
                      <div className="pl-3 border-l border-[#262626] ml-2 space-y-0.5 mt-0.5">
                        {gw.routes.map((route) => {
                          const isRouteSelected = selectedRouteId === route.id;
                          return (
                            <button
                              key={route.id}
                              onClick={() => onSelectRoute(gw.id, route.id)}
                              className={`w-full text-left px-2 py-1 rounded-md text-[11px] font-mono truncate transition-colors ${
                                isRouteSelected
                                  ? "bg-[#202020] text-[#FFFFFF] border border-[#404040]"
                                  : "text-[#858585] hover:text-[#B5B5B5] hover:bg-[#141414]"
                              }`}
                            >
                              {route.match.pathPrefix || route.match.pathExact || "/"}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Load Balancers Section */}
        <div>
          <button
            onClick={() => setLoadBalancersExpanded(!loadBalancersExpanded)}
            className="w-full flex items-center justify-between px-2 py-1 text-xs font-medium text-[#B5B5B5] hover:text-[#FFFFFF] rounded-md"
          >
            <div className="flex items-center gap-1.5">
              <CpuIcon className="w-3.5 h-3.5 text-[#858585]" />
              <span>Load Balancers ({filteredLbs.length})</span>
            </div>
            {loadBalancersExpanded ? <ChevronDownIcon className="w-3 h-3 text-[#858585]" /> : <ChevronRightIcon className="w-3 h-3 text-[#858585]" />}
          </button>
          {loadBalancersExpanded && (
            <div className="mt-1 space-y-0.5 pl-2">
              {filteredLbs.map((lb) => (
                <div
                  key={lb.id}
                  className="w-full px-2 py-1.5 rounded-md text-xs text-[#B5B5B5] hover:bg-[#0D0D0D] flex items-center justify-between"
                >
                  <span className="truncate">{lb.name}</span>
                  <span className="text-[10px] font-mono uppercase text-[#858585]">
                    {lb.layer}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upstream Pools Section */}
        <div>
          <button
            onClick={() => setPoolsExpanded(!poolsExpanded)}
            className="w-full flex items-center justify-between px-2 py-1 text-xs font-medium text-[#B5B5B5] hover:text-[#FFFFFF] rounded-md"
          >
            <div className="flex items-center gap-1.5">
              <ActivityIcon className="w-3.5 h-3.5 text-[#858585]" />
              <span>Upstream Pools ({filteredPools.length})</span>
            </div>
            {poolsExpanded ? <ChevronDownIcon className="w-3 h-3 text-[#858585]" /> : <ChevronRightIcon className="w-3 h-3 text-[#858585]" />}
          </button>
          {poolsExpanded && (
            <div className="mt-1 space-y-0.5 pl-2">
              {filteredPools.map((pool) => {
                const isSelected = selectedPoolId === pool.id;
                const healthyCount = pool.endpoints.filter((e) => e.isHealthy).length;
                return (
                  <button
                    key={pool.id}
                    onClick={() => onSelectPool(pool.id)}
                    className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between ${
                      isSelected
                        ? "bg-[#1A1A1A] text-[#FFFFFF] border border-[#333333] font-medium"
                        : "text-[#B5B5B5] hover:bg-[#0D0D0D] hover:text-[#FFFFFF] border border-transparent"
                    }`}
                  >
                    <span className="truncate">{pool.name}</span>
                    <span className="text-[10px] font-mono text-[#858585]">
                      {healthyCount}/{pool.endpoints.length} up
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Traffic Scenarios Section */}
        <div>
          <button
            onClick={() => setScenariosExpanded(!scenariosExpanded)}
            className="w-full flex items-center justify-between px-2 py-1 text-xs font-medium text-[#B5B5B5] hover:text-[#FFFFFF] rounded-md"
          >
            <div className="flex items-center gap-1.5">
              <ActivityIcon className="w-3.5 h-3.5 text-[#858585]" />
              <span>Scenarios ({filteredScenarios.length})</span>
            </div>
            {scenariosExpanded ? <ChevronDownIcon className="w-3 h-3 text-[#858585]" /> : <ChevronRightIcon className="w-3 h-3 text-[#858585]" />}
          </button>
          {scenariosExpanded && (
            <div className="mt-1 space-y-0.5 pl-2">
              {filteredScenarios.map((sc) => {
                const isSelected = selectedScenarioId === sc.id;
                return (
                  <button
                    key={sc.id}
                    onClick={() => onSelectScenario(sc.id)}
                    className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between ${
                      isSelected
                        ? "bg-[#1A1A1A] text-[#FFFFFF] border border-[#333333] font-medium"
                        : "text-[#B5B5B5] hover:bg-[#0D0D0D] hover:text-[#FFFFFF] border border-transparent"
                    }`}
                  >
                    <span className="truncate">{sc.name}</span>
                    <span className="text-[10px] font-mono text-[#858585]">
                      {sc.requestRateQps} qps
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

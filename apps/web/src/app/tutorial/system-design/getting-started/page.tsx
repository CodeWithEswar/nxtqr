import * as React from "react";
import Link from "next/link";
import { TutorialShell } from "@/features/system-design-tutorials";
import { Button } from "@nxtqr/ui";
import {
  CpuIcon,
  LayersIcon,
  ExternalLinkIcon,
  ShieldIcon,
} from "@nxtqr/icons";

export default function GettingStartedPage() {
  const tocItems = [
    { id: "mental-models", label: "Core Mental Models" },
    { id: "request-lifecycle", label: "The Request Lifecycle" },
    { id: "sync-vs-async", label: "Synchronous vs Asynchronous" },
    { id: "failure-domains", label: "Failure Domains & Blast Radius" },
    { id: "studio-workflow", label: "Building in NXTQR Studio" },
  ];

  return (
    <TutorialShell
      breadcrumbs={[
        { label: "Tutorial", href: "/tutorial/system-design" },
        { label: "Getting Started" },
      ]}
      tocItems={tocItems}
    >
      <div className="space-y-10 pb-16">
        {/* Header */}
        <div className="space-y-3 border-b border-border-default pb-6">
          <div className="inline-flex items-center gap-1.5 font-mono text-xs text-text-muted">
            <LayersIcon className="w-4 h-4" />
            <span>Architecture Foundations</span>
          </div>
          <h1 className="text-3xl font-sans font-bold text-foreground">
            Getting Started with System Design in NXTQR
          </h1>
          <p className="text-sm font-sans text-text-secondary leading-relaxed max-w-3xl">
            Modern distributed systems are not built from random ad-hoc servers; they are composed of standardized architectural primitives with precise responsibilities, bounded failure domains, and well-defined communication contracts.
          </p>
        </div>

        {/* Section 1: Mental Models */}
        <section id="mental-models" className="space-y-4">
          <h2 className="text-xl font-sans font-bold text-foreground">
            1. Core Architectural Mental Models
          </h2>
          <p className="text-xs font-sans text-text-secondary leading-relaxed">
            Every resilient architecture differentiates between two fundamental types of workloads:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-md bg-surface-01 border border-border-default space-y-2">
              <div className="font-mono text-xs font-bold text-foreground flex items-center gap-2">
                <CpuIcon className="w-4 h-4 text-text-muted" />
                <span>Stateless Compute Tier</span>
              </div>
              <p className="text-xs font-sans text-text-muted leading-relaxed">
                Application servers, API gateways, and serverless functions that hold zero long-term state in local memory. Any request can be routed to any instance without affecting correctness. Instances can be killed, autoscaled, or rebooted freely.
              </p>
            </div>

            <div className="p-4 rounded-md bg-surface-01 border border-border-default space-y-2">
              <div className="font-mono text-xs font-bold text-foreground flex items-center gap-2">
                <ShieldIcon className="w-4 h-4 text-text-muted" />
                <span>Stateful Persistence Tier</span>
              </div>
              <p className="text-xs font-sans text-text-muted leading-relaxed">
                Relational databases, distributed caches, and event logs that safeguard persistent truth. Scaling requires replication, leader election, sharding keys, quorum voting, and careful failover management.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Request Lifecycle */}
        <section id="request-lifecycle" className="space-y-4">
          <h2 className="text-xl font-sans font-bold text-foreground">
            2. The End-to-End Request Lifecycle
          </h2>
          <p className="text-xs font-sans text-text-secondary leading-relaxed">
            When a user clicks a button on their device, the request traverses a strict layered hierarchy:
          </p>

          <div className="p-4 rounded-md bg-surface-01 border border-border-default space-y-3 font-mono text-xs text-text-secondary">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-surface-02 flex items-center justify-center font-bold text-foreground">
                1
              </span>
              <span>Client DNS Resolution (Anycast Geo-DNS)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-surface-02 flex items-center justify-center font-bold text-foreground">
                2
              </span>
              <span>Edge CDN Point-of-Presence (TLS Termination & Static Asset Cache)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-surface-02 flex items-center justify-center font-bold text-foreground">
                3
              </span>
              <span>Web Application Firewall (DDoS Protection & OWASP Filtering)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-surface-02 flex items-center justify-center font-bold text-foreground">
                4
              </span>
              <span>Layer-7 Application Load Balancer (Health-Checked Round Robin)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-surface-02 flex items-center justify-center font-bold text-foreground">
                5
              </span>
              <span>API Gateway (JWT Authentication, Rate Limiting & Routing)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-surface-02 flex items-center justify-center font-bold text-foreground">
                6
              </span>
              <span>Backend Microservices (Domain Business Logic)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-surface-02 flex items-center justify-center font-bold text-foreground">
                7
              </span>
              <span>Cache & Database Tier (Redis / PostgreSQL / Cassandra)</span>
            </div>
          </div>
        </section>

        {/* Section 3: Sync vs Async */}
        <section id="sync-vs-async" className="space-y-4">
          <h2 className="text-xl font-sans font-bold text-foreground">
            3. Synchronous RPC vs Asynchronous Event Streaming
          </h2>
          <div className="p-4 rounded-md bg-surface-01 border border-border-default space-y-3">
            <p className="text-xs font-sans text-text-secondary leading-relaxed">
              One of the most dangerous distributed system anti-patterns is cascading synchronous HTTP chains (Service A calls B, which calls C, which calls D). If Service D takes 3 seconds or crashes, all upstream threads block and exhaust their connection pools.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded bg-surface-02 border border-border-subtle space-y-1">
                <span className="font-mono text-xs font-semibold text-foreground">
                  Synchronous (REST / gRPC)
                </span>
                <p className="text-[11px] font-sans text-text-muted">
                  Use strictly when the caller cannot proceed without the immediate response (e.g. validating user credentials or rendering the immediate UI response).
                </p>
              </div>
              <div className="p-3 rounded bg-surface-02 border border-border-subtle space-y-1">
                <span className="font-mono text-xs font-semibold text-foreground">
                  Asynchronous (Kafka / SQS)
                </span>
                <p className="text-[11px] font-sans text-text-muted">
                  Use for all side-effects and background jobs (sending confirmation emails, updating search indexes, computing recommendations, billing reconciliation).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Failure Domains */}
        <section id="failure-domains" className="space-y-4">
          <h2 className="text-xl font-sans font-bold text-foreground">
            4. Failure Domains & Blast Radius Isolation
          </h2>
          <p className="text-xs font-sans text-text-secondary leading-relaxed">
            In any system operating at scale, components fail constantly. Resilience engineering assumes failure and isolates the blast radius:
          </p>
          <ul className="space-y-2 font-sans text-xs text-text-muted list-disc pl-5">
            <li>
              <strong className="text-foreground">Circuit Breakers:</strong> Trip open when downstream error rates exceed 5%, preventing thread pool starvation by returning fallback responses instantly.
            </li>
            <li>
              <strong className="text-foreground">Bulkheads:</strong> Partition thread pools and resource quotas so that an outage in image processing cannot exhaust CPU allocated to order checkouts.
            </li>
            <li>
              <strong className="text-foreground">Dead-Letter Queues (DLQ):</strong> Isolate poison pill messages after 3-5 failed retries, allowing healthy traffic to proceed uninterrupted.
            </li>
          </ul>
        </section>

        {/* Section 5: Studio Workflow */}
        <section id="studio-workflow" className="space-y-4 pt-4 border-t border-border-default">
          <h2 className="text-xl font-sans font-bold text-foreground">
            5. Designing in NXTQR Studio
          </h2>
          <p className="text-xs font-sans text-text-secondary leading-relaxed">
            NXTQR provides all 223 infrastructure components with typed input/output ports and real configuration schemas. You can assemble them in the workspace and simulate execution traces.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href="/tutorial/system-design/components">
              <Button size="sm" className="font-mono text-xs gap-1.5">
                <CpuIcon className="w-3.5 h-3.5" />
                <span>Browse All 223 Components</span>
              </Button>
            </Link>
            <Link href="/workspace">
              <Button variant="outline" size="sm" className="font-mono text-xs gap-1.5 border-border-default text-text-secondary">
                <ExternalLinkIcon className="w-3.5 h-3.5" />
                <span>Open Blank Workspace</span>
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </TutorialShell>
  );
}

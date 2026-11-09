import * as React from "react";

export function TermsContent() {
  return (
    <div className="space-y-12 text-sm leading-relaxed text-text-muted font-sans selection:bg-surface-04 selection:text-foreground">
      {/* 01. Overview & Agreement */}
      <section id="overview" className="scroll-mt-24 space-y-3">
        <h2 className="font-sans text-base sm:text-lg font-semibold tracking-tight text-foreground flex items-baseline gap-2 border-b border-border-subtle pb-2">
          <span className="font-mono text-xs text-text-muted">01.</span>
          <span>Overview & Agreement</span>
        </h2>
        <p>
          These Terms of Service ("Terms") constitute a legally binding agreement between you ("User," "you," or "your")
          and NXTQR ("NXTQR," "Studio," "we," "us," or "our"). These Terms govern your access to and use of the NXTQR
          Interactive Visual Engineering Studio, including the web application, APIs, visualizer engines, simulation tools,
          and associated technical documentation (collectively, the "Platform" or "Service").
        </p>
        <p>
          NXTQR is an engineering visualization and architectural modeling studio designed for distributed systems,
          database clusters, network meshes, and simulation analysis. NXTQR is not a consumer barcode or QR code utility.
        </p>
        <p>
          By accessing the Platform, authenticating through our Google OAuth integration, or creating an engineering project,
          you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you
          do not agree to these Terms, you must not access or use the Platform.
        </p>
      </section>

      {/* 02. User Eligibility */}
      <section id="eligibility" className="scroll-mt-24 space-y-3">
        <h2 className="font-sans text-base sm:text-lg font-semibold tracking-tight text-foreground flex items-baseline gap-2 border-b border-border-subtle pb-2">
          <span className="font-mono text-xs text-text-muted">02.</span>
          <span>User Eligibility</span>
        </h2>
        <p>
          You may access and use NXTQR only if you are at least 18 years of age (or the applicable age of legal majority in
          your jurisdiction) and have the full legal capacity to enter into a binding agreement.
        </p>
        <p>
          If you access or use the Platform on behalf of an enterprise, company, academic institution, or other entity, you
          represent and warrant that you are authorized to bind that entity to these Terms. In such circumstances, "you" and
          "your" will refer to both the individual user and the represented entity.
        </p>
      </section>

      {/* 03. Accounts & Authentication */}
      <section id="authentication" className="scroll-mt-24 space-y-3">
        <h2 className="font-sans text-base sm:text-lg font-semibold tracking-tight text-foreground flex items-baseline gap-2 border-b border-border-subtle pb-2">
          <span className="font-mono text-xs text-text-muted">03.</span>
          <span>Accounts & Authentication</span>
        </h2>
        <p>
          Access to workspace project creation and simulation modeling requires an authenticated user account. User
          identity is established exclusively via Google OAuth 2.0 through Supabase Authentication. We do not provide
          standalone username-and-password registration, and we never collect, receive, or store your Google account password.
        </p>
        <p>
          You are responsible for safeguarding access to your Google account and credentials. You must promptly notify us
          at <code className="font-mono text-xs text-foreground bg-surface-02 px-1 py-0.5 rounded border border-border-default">security@nxtqr.dev</code> if
          you suspect any unauthorized access to your account or any breach of security relating to the Platform.
        </p>
        <p>
          You agree to provide accurate identification data through your OAuth provider and to maintain the integrity of
          your account. NXTQR reserves the right to suspend or revoke access to any account that impersonates others,
          violates these Terms, or compromises platform security.
        </p>
      </section>

      {/* 04. Description of Services */}
      <section id="services" className="scroll-mt-24 space-y-3">
        <h2 className="font-sans text-base sm:text-lg font-semibold tracking-tight text-foreground flex items-baseline gap-2 border-b border-border-subtle pb-2">
          <span className="font-mono text-xs text-text-muted">04.</span>
          <span>Description of Services</span>
        </h2>
        <p>
          NXTQR provides interactive visual engineering environments, graph-based node editors, and simulation tools.
          Current supported visualizer engines include:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2 text-xs">
          <li><span className="text-foreground font-medium">System Design Visualizer</span> — High-throughput pipelines, API gateways, worker pools, and broker topologies.</li>
          <li><span className="text-foreground font-medium">Database Cluster Visualizer</span> — Replication topologies, sharding, failover sentinels, and connection pools.</li>
          <li><span className="text-foreground font-medium">Network Mesh Visualizer</span> — Ingress routing, Envoy sidecars, packet inspection, and service mesh policies.</li>
          <li><span className="text-foreground font-medium">AI Agent Orchestration</span> — Execution trace DAGs, tool dispatchers, and state transitions.</li>
          <li><span className="text-foreground font-medium">RAG Pipeline Visualizer</span> — Embeddings, chunking strategies, vector search indices, and rerankers.</li>
          <li><span className="text-foreground font-medium">Algorithm & State Visualizer</span> — Graph traversal, distributed consensus, and concurrency states.</li>
        </ul>
        <p>
          The Platform is actively developed. Features labeled as "Alpha," "Beta," or "Preview" are provided on an "as-is"
          basis for testing and architectural evaluation, and may undergo functional changes, updates, or refinements.
        </p>
      </section>

      {/* 05. Acceptable Use Policy */}
      <section id="acceptable-use" className="scroll-mt-24 space-y-3">
        <h2 className="font-sans text-base sm:text-lg font-semibold tracking-tight text-foreground flex items-baseline gap-2 border-b border-border-subtle pb-2">
          <span className="font-mono text-xs text-text-muted">05.</span>
          <span>Acceptable Use Policy</span>
        </h2>
        <p>When using NXTQR, you agree that you will not:</p>
        <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs">
          <li>Attempt to probe, scan, or test the vulnerability of the Platform, its network boundaries, or database infrastructure without prior written authorization.</li>
          <li>Bypass or attempt to defeat authentication controls, Row Level Security (RLS) policies, rate-limiting guards, or payload size limits.</li>
          <li>Use automated scrapers, headless bots, or crawlers to extract system schemas, proprietary icons, or documentation assets outside sanctioned API usage.</li>
          <li>Transmit or store malicious software, exploit payloads, viruses, or unlawful material within graph project documents or metadata fields.</li>
          <li>Reverse engineer, decompile, or disassemble any proprietary binary or compiled component of the Platform, except to the extent permitted by applicable law.</li>
          <li>Interfere with, overload, or disrupt the integrity or performance of the Platform or the data of other users.</li>
        </ul>
      </section>

      {/* 06. User Projects & Content Ownership */}
      <section id="user-content" className="scroll-mt-24 space-y-3">
        <h2 className="font-sans text-base sm:text-lg font-semibold tracking-tight text-foreground flex items-baseline gap-2 border-b border-border-subtle pb-2">
          <span className="font-mono text-xs text-text-muted">06.</span>
          <span>User Projects & Content Ownership</span>
        </h2>
        <p>
          <span className="text-foreground font-medium">You retain 100% intellectual property ownership</span> of your
          original engineering projects, architectural diagrams, node parameters, and configuration data created on or
          imported into NXTQR.
        </p>
        <p>
          By creating and saving projects within the Studio, you grant NXTQR a limited, non-exclusive, worldwide, royalty-free
          license solely to host, store, serialize, process, cache, and transmit your content as necessary to provide,
          maintain, and secure the Platform for you. We do not claim ownership of your system architectures, and we do not
          sell your project diagrams to third parties.
        </p>
        <p>
          You are solely responsible for ensuring that your project contents, metadata, and custom nodes do not infringe upon
          any third-party copyright, patent, trademark, or trade secret.
        </p>
      </section>

      {/* 07. Platform Intellectual Property */}
      <section id="platform-ip" className="scroll-mt-24 space-y-3">
        <h2 className="font-sans text-base sm:text-lg font-semibold tracking-tight text-foreground flex items-baseline gap-2 border-b border-border-subtle pb-2">
          <span className="font-mono text-xs text-text-muted">07.</span>
          <span>Platform Intellectual Property</span>
        </h2>
        <p>
          The Platform, including its user interface shell, design system tokens, vector geometries, brand assets,
          application software, documentation, and underlying algorithms, is and remains the exclusive property of NXTQR
          and its licensors.
        </p>
        <p>
          The NXTQR name, the geometric corner-bracket logo mark, and associated brand vectors are trademarks of NXTQR.
          You may not use our brand assets without prior written authorization, except as permitted under applicable
          fair use principles. Open-source components utilized within the monorepo remain subject to their respective
          licenses (e.g., MIT, Apache 2.0).
        </p>
      </section>

      {/* 08. Service Availability & Maintenance */}
      <section id="availability" className="scroll-mt-24 space-y-3">
        <h2 className="font-sans text-base sm:text-lg font-semibold tracking-tight text-foreground flex items-baseline gap-2 border-b border-border-subtle pb-2">
          <span className="font-mono text-xs text-text-muted">08.</span>
          <span>Service Availability & Maintenance</span>
        </h2>
        <p>
          We strive to provide reliable and performant infrastructure through global Cloudflare edge caching and Supabase
          PostgreSQL hosting. However, we do not warrant that the Platform will operate uninterrupted, error-free, or
          immune from latency fluctuations.
        </p>
        <p>
          We reserve the right to temporarily suspend access to parts or all of the Platform to perform routine maintenance,
          deploy security patches, upgrade database clusters, or address emergency operational issues. Whenever reasonably
          feasible, maintenance windows will be communicated in advance.
        </p>
      </section>

      {/* 09. Commercial Terms & Subscriptions */}
      <section id="commercial-terms" className="scroll-mt-24 space-y-3">
        <h2 className="font-sans text-base sm:text-lg font-semibold tracking-tight text-foreground flex items-baseline gap-2 border-b border-border-subtle pb-2">
          <span className="font-mono text-xs text-text-muted">09.</span>
          <span>Commercial Terms & Subscriptions</span>
        </h2>
        <p>
          NXTQR is currently made available under an Alpha / Developer Preview tier. Core project creation, modeling, and
          local simulation features are provided without charge during this release cycle.
        </p>
        <p>
          If and when commercial tiers, enterprise visualizers, or dedicated team workspaces are introduced, they will be
          governed by clear pricing schedules and payment terms published prior to enrollment. We do not charge recurring
          fees or collect billing credentials without your explicit confirmation.
        </p>
      </section>

      {/* 10. Suspension & Account Closure */}
      <section id="termination" className="scroll-mt-24 space-y-3">
        <h2 className="font-sans text-base sm:text-lg font-semibold tracking-tight text-foreground flex items-baseline gap-2 border-b border-border-subtle pb-2">
          <span className="font-mono text-xs text-text-muted">10.</span>
          <span>Suspension & Account Closure</span>
        </h2>
        <p>
          You may terminate your agreement with NXTQR at any time by deleting your engineering projects and closing your
          account through your account settings or by submitting a written request to{" "}
          <code className="font-mono text-xs text-foreground bg-surface-02 px-1 py-0.5 rounded border border-border-default">privacy@nxtqr.dev</code>.
        </p>
        <p>
          We reserve the right to suspend or terminate your access immediately, without prior notice, if you breach any
          provision of these Terms, engage in unlawful activity, or pose a security risk to the Platform or its users.
        </p>
        <p>
          Upon account closure, your profile and associated project data are permanently deleted from our primary database
          in accordance with our database cascading deletion policies (`ON DELETE CASCADE`).
        </p>
      </section>

      {/* 11. Technical Disclaimers */}
      <section id="disclaimers" className="scroll-mt-24 space-y-3">
        <h2 className="font-sans text-base sm:text-lg font-semibold tracking-tight text-foreground flex items-baseline gap-2 border-b border-border-subtle pb-2">
          <span className="font-mono text-xs text-text-muted">11.</span>
          <span>Technical Disclaimers</span>
        </h2>
        <p>
          <span className="text-foreground uppercase font-semibold text-xs tracking-wider">Disclaimer of Warranties:</span>{" "}
          THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
          BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND
          NON-INFRINGEMENT.
        </p>
        <p>
          NXTQR is an architectural modeling and simulation tool. The diagrams, telemetry estimations, execution traces,
          and network packet models generated by the Platform represent synthetic architectural approximations and do not
          constitute certified structural engineering, failover guarantees, or formal high-availability certifications
          for physical production systems.
        </p>
      </section>

      {/* 12. Limitation of Liability */}
      <section id="liability" className="scroll-mt-24 space-y-3">
        <h2 className="font-sans text-base sm:text-lg font-semibold tracking-tight text-foreground flex items-baseline gap-2 border-b border-border-subtle pb-2">
          <span className="font-mono text-xs text-text-muted">12.</span>
          <span>Limitation of Liability</span>
        </h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL NXTQR, ITS OFFICERS, DIRECTORS, EMPLOYEES,
          PARTNERS, OR SUPPLIERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
          INCLUDING LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2 text-xs">
          <li>YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE PLATFORM;</li>
          <li>ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE PLATFORM;</li>
          <li>ANY ARCHITECTURAL DECISIONS, CODE CHANGES, OR SYSTEM DEPLOYMENTS MADE BASED ON VISUALIZATIONS PRODUCED IN NXTQR;</li>
          <li>UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR PROJECTS OR TRANSMISSIONS.</li>
        </ul>
      </section>

      {/* 13. Indemnification */}
      <section id="indemnification" className="scroll-mt-24 space-y-3">
        <h2 className="font-sans text-base sm:text-lg font-semibold tracking-tight text-foreground flex items-baseline gap-2 border-b border-border-subtle pb-2">
          <span className="font-mono text-xs text-text-muted">13.</span>
          <span>Indemnification</span>
        </h2>
        <p>
          You agree to defend, indemnify, and hold harmless NXTQR, its affiliates, licensors, and service providers from
          and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including
          reasonable attorneys' fees) arising out of or relating to your violation of these Terms or your use of the
          Platform, including your project content and any data you upload.
        </p>
      </section>

      {/* 14. Governing Law & Disputes */}
      <section id="governing-law" className="scroll-mt-24 space-y-3">
        <h2 className="font-sans text-base sm:text-lg font-semibold tracking-tight text-foreground flex items-baseline gap-2 border-b border-border-subtle pb-2">
          <span className="font-mono text-xs text-text-muted">14.</span>
          <span>Governing Law & Disputes</span>
        </h2>
        <p>
          These Terms and any dispute or claim arising out of or in connection with them or their subject matter shall be
          governed by and construed in accordance with the laws of the applicable legal domicile of the operating entity,
          without giving effect to any choice or conflict of law provision or rule.
        </p>
        <div className="rounded-md border border-border-default bg-surface-02 p-3 text-xs space-y-1">
          <p className="font-mono text-[11px] text-foreground font-semibold">Legal Review Gate Note:</p>
          <p className="text-text-muted text-[11px]">
            [Formal entity registration details, designated jurisdiction, and arbitration or dispute resolution forum
            are subject to verified legal entity confirmation prior to final commercial release.]
          </p>
        </div>
      </section>

      {/* 15. Modifications to Terms */}
      <section id="changes" className="scroll-mt-24 space-y-3">
        <h2 className="font-sans text-base sm:text-lg font-semibold tracking-tight text-foreground flex items-baseline gap-2 border-b border-border-subtle pb-2">
          <span className="font-mono text-xs text-text-muted">15.</span>
          <span>Modifications to Terms</span>
        </h2>
        <p>
          We reserve the right to revise or replace these Terms from time to time. When material modifications occur, we
          will update the "Last Updated" date at the top of this document and provide prominent notice within the Platform
          (such as a topbar announcement or workspace notification).
        </p>
        <p>
          Your continued access to or use of the Platform after any revisions become effective constitutes your agreement
          to be bound by the updated terms. If you do not agree to the new terms, you must discontinue your use of the Platform.
        </p>
      </section>

      {/* 16. Contact Information */}
      <section id="contact" className="scroll-mt-24 space-y-3">
        <h2 className="font-sans text-base sm:text-lg font-semibold tracking-tight text-foreground flex items-baseline gap-2 border-b border-border-subtle pb-2">
          <span className="font-mono text-xs text-text-muted">16.</span>
          <span>Contact Information</span>
        </h2>
        <p>For questions, legal notices, or feedback regarding these Terms of Service, please reach out via our designated channels:</p>
        <div className="rounded-md border border-border-default bg-surface-02 p-4 text-xs font-mono space-y-1.5">
          <p className="text-foreground font-medium">NXTQR Interactive Visual Engineering Studio</p>
          <p className="text-text-muted">Legal Operations: <a href="mailto:legal@nxtqr.dev" className="text-foreground underline hover:text-neutral-200">legal@nxtqr.dev</a></p>
          <p className="text-text-muted">General Support: <a href="mailto:support@nxtqr.dev" className="text-foreground underline hover:text-neutral-200">support@nxtqr.dev</a></p>
          <p className="text-text-muted">Security Inquiries: <a href="mailto:security@nxtqr.dev" className="text-foreground underline hover:text-neutral-200">security@nxtqr.dev</a></p>
        </div>
      </section>
    </div>
  );
}


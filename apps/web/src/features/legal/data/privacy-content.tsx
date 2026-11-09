import React from "react";
import { PRIVACY_CONFIG } from "../config/legal-documents";

export function PrivacyContent() {
  return (
    <div className="space-y-12">
      {/* 01. Introduction & Scope */}
      <section id="introduction" className="scroll-mt-24 space-y-4">
        <div className="flex items-center gap-3 border-b border-border-default pb-2">
          <span className="font-mono text-xs font-semibold text-text-muted">01</span>
          <h2 className="font-sans text-xl font-bold tracking-tight text-foreground">
            Introduction & Scope
          </h2>
        </div>
        <div className="space-y-3.5 text-sm leading-relaxed text-text-secondary">
          <p>
            NXTQR (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates the NXTQR Interactive Visual
            Engineering Studio platform (accessible via the web application shell and related
            development interfaces). This Privacy Policy explains our commitment to transparency,
            data minimization, and cryptographic boundary defense regarding how personal data and
            engineering assets are collected, processed, and safeguarded.
          </p>
          <p>
            This policy applies exclusively to services, applications, and APIs provided under the
            official NXTQR platform. By creating an account, authenticating through our Google OAuth
            sign-in pipeline, or utilizing our interactive canvas visualizers, you acknowledge the
            processing practices detailed herein.
          </p>
          <div className="rounded-md border border-border-default bg-surface-01 p-3.5 text-xs text-text-muted">
            <span className="font-semibold text-foreground">Summary: </span>
            NXTQR is built on a data-minimization philosophy. We do not sell user data, we do not
            embed advertising trackers, and your engineering diagrams are isolated through
            database-level Row Level Security (RLS).
          </div>
        </div>
      </section>

      {/* 02. Information We Collect */}
      <section id="information-collected" className="scroll-mt-24 space-y-4">
        <div className="flex items-center gap-3 border-b border-border-default pb-2">
          <span className="font-mono text-xs font-semibold text-text-muted">02</span>
          <h2 className="font-sans text-xl font-bold tracking-tight text-foreground">
            Information We Collect
          </h2>
        </div>
        <div className="space-y-3.5 text-sm leading-relaxed text-text-secondary">
          <p>
            We collect only the technical telemetry and identity metadata strictly necessary to
            provide and maintain a high-performance visual engineering environment:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-foreground">Identity & Account Metadata:</strong> When you
              sign in via Google OAuth, we receive your verified email address, full name, Google
              Account identifier, and profile avatar URL. We do not receive, process, or store your
              Google account password.
            </li>
            <li>
              <strong className="text-foreground">Engineering Projects & Canvas Topology:</strong>{" "}
              Visualizer graph documents, node configurations, edge routing geometry, simulation
              checkpoints, and execution traces that you explicitly create and save within your
              workspace.
            </li>
            <li>
              <strong className="text-foreground">System Telemetry & Access Logs:</strong> IP
              address, browser user-agent header, operating system, client timestamp, and anonymized
              performance metrics. Sensitive tokens, credentials, and API secrets are strictly masked
              prior to logging via our security gateway (<code className="font-mono text-xs text-foreground bg-surface-02 px-1 py-0.5 rounded">maskSensitiveData</code>).
            </li>
          </ul>
        </div>
      </section>

      {/* 03. Google OAuth & Authentication Data */}
      <section id="google-auth" className="scroll-mt-24 space-y-4">
        <div className="flex items-center gap-3 border-b border-border-default pb-2">
          <span className="font-mono text-xs font-semibold text-text-muted">03</span>
          <h2 className="font-sans text-xl font-bold tracking-tight text-foreground">
            Google OAuth & Authentication Data
          </h2>
        </div>
        <div className="space-y-3.5 text-sm leading-relaxed text-text-secondary">
          <p>
            NXTQR utilizes Google OAuth 2.0 with Proof Key for Code Exchange (PKCE) as the primary
            identity provider. Authentication is initiated via a dedicated, secure popup window or
            direct authorization redirect.
          </p>
          <p>
            Our OAuth scope is strictly limited to standard identity verification:
          </p>
          <div className="rounded-md border border-border-default bg-surface-01 p-3 font-mono text-xs text-foreground space-y-1">
            <div>openid</div>
            <div>https://www.googleapis.com/auth/userinfo.email</div>
            <div>https://www.googleapis.com/auth/userinfo.profile</div>
          </div>
          <p>
            We <strong className="text-foreground">never</strong> request access to your Google Drive,
            Gmail, Google Docs, contacts, or other Google Workspace resources. Information obtained
            via Google APIs is used solely to authenticate your identity and provision your user
            profile in accordance with Google API Services User Data Policy.
          </p>
        </div>
      </section>

      {/* 04. How We Use Information */}
      <section id="how-we-use" className="scroll-mt-24 space-y-4">
        <div className="flex items-center gap-3 border-b border-border-default pb-2">
          <span className="font-mono text-xs font-semibold text-text-muted">04</span>
          <h2 className="font-sans text-xl font-bold tracking-tight text-foreground">
            How We Use Information
          </h2>
        </div>
        <div className="space-y-3.5 text-sm leading-relaxed text-text-secondary">
          <p>We process collected data for the following legitimate engineering purposes:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-foreground">Authentication & Session Integrity:</strong>{" "}
              Validating cryptographic JWT bearer tokens and maintaining authenticated session state
              across HTTP requests.
            </li>
            <li>
              <strong className="text-foreground">Workspace Project Delivery:</strong> Persisting,
              querying, and deserializing your node graphs and simulation models upon authenticated
              request.
            </li>
            <li>
              <strong className="text-foreground">Tenant Isolation & Security Enforcement:</strong>{" "}
              Enforcing row-level access boundaries so that only verified project owners can view,
              modify, or delete their graph documents.
            </li>
            <li>
              <strong className="text-foreground">Diagnostic Health & Error Recovery:</strong>{" "}
              Detecting client hydration anomalies, API rate-limit exhaustion, and runtime errors to
              ensure high platform uptime.
            </li>
          </ul>
        </div>
      </section>

      {/* 05. Project Storage & Security Isolation */}
      <section id="project-storage" className="scroll-mt-24 space-y-4">
        <div className="flex items-center gap-3 border-b border-border-default pb-2">
          <span className="font-mono text-xs font-semibold text-text-muted">05</span>
          <h2 className="font-sans text-xl font-bold tracking-tight text-foreground">
            Project Storage & Security Isolation
          </h2>
        </div>
        <div className="space-y-3.5 text-sm leading-relaxed text-text-secondary">
          <p>
            Your projects, visualizer nodes, and graph schemas are stored in a dedicated PostgreSQL
            cluster managed by Supabase. Every database table (including <code className="font-mono text-xs text-foreground bg-surface-02 px-1 py-0.5 rounded">profiles</code>, <code className="font-mono text-xs text-foreground bg-surface-02 px-1 py-0.5 rounded">projects</code>, and <code className="font-mono text-xs text-foreground bg-surface-02 px-1 py-0.5 rounded">graph_document</code>) enforces PostgreSQL Row Level Security (RLS).
          </p>
          <p>
            Tenant isolation is mathematically guaranteed at the database engine level:
          </p>
          <pre className="rounded-md border border-border-default bg-surface-01 p-3 font-mono text-xs text-text-muted overflow-x-auto">
            {`CREATE POLICY "Users can manage own projects"
  ON public.projects
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);`}
          </pre>
          <p>
            No other user can read, query, export, or mutate your private projects unless you
            explicitly configure shared access controls when collaborative features are released.
          </p>
        </div>
      </section>

      {/* 06. Cookies & Session Management */}
      <section id="cookies-sessions" className="scroll-mt-24 space-y-4">
        <div className="flex items-center gap-3 border-b border-border-default pb-2">
          <span className="font-mono text-xs font-semibold text-text-muted">06</span>
          <h2 className="font-sans text-xl font-bold tracking-tight text-foreground">
            Cookies & Session Management
          </h2>
        </div>
        <div className="space-y-3.5 text-sm leading-relaxed text-text-secondary">
          <p>
            NXTQR uses strict, first-party HTTP cookies exclusively for authentication session
            maintenance and security token storage. We do not use third-party advertising cookies,
            commercial tracking beacons, or cross-site tracking scripts.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-foreground">Session Cookies:</strong> Set by our Supabase SSR
              middleware (<code className="font-mono text-xs text-foreground bg-surface-02 px-1 py-0.5 rounded">sb-*-auth-token</code>) to verify authentication state during Server-Side Rendering (SSR). These cookies carry <code className="font-mono text-xs text-foreground bg-surface-02 px-1 py-0.5 rounded">SameSite=Lax</code> and <code className="font-mono text-xs text-foreground bg-surface-02 px-1 py-0.5 rounded">Secure</code> flags.
            </li>
            <li>
              <strong className="text-foreground">PKCE Code Verifiers:</strong> Temporary cookies
              utilized during OAuth handshake to prevent authorization code interception and CSRF
              attacks.
            </li>
          </ul>
        </div>
      </section>

      {/* 07. Third-Party Service Providers */}
      <section id="third-parties" className="scroll-mt-24 space-y-4">
        <div className="flex items-center gap-3 border-b border-border-default pb-2">
          <span className="font-mono text-xs font-semibold text-text-muted">07</span>
          <h2 className="font-sans text-xl font-bold tracking-tight text-foreground">
            Third-Party Service Providers
          </h2>
        </div>
        <div className="space-y-3.5 text-sm leading-relaxed text-text-secondary">
          <p>
            To deliver an enterprise-grade studio, we partner with specialized infrastructure
            providers that adhere to strict data security certifications:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="rounded-md border border-border-default bg-surface-01 p-3 space-y-1">
              <span className="font-mono text-xs font-semibold text-foreground">Supabase Inc.</span>
              <p className="text-xs text-text-muted">
                Managed PostgreSQL database hosting, Row Level Security, Auth service, and secure
                token storage (SOC 2 Type II compliant).
              </p>
            </div>
            <div className="rounded-md border border-border-default bg-surface-01 p-3 space-y-1">
              <span className="font-mono text-xs font-semibold text-foreground">Cloudflare, Inc.</span>
              <p className="text-xs text-text-muted">
                DDoS defense, edge CDN routing, TLS encryption termination, and edge security proxy.
              </p>
            </div>
            <div className="rounded-md border border-border-default bg-surface-01 p-3 space-y-1">
              <span className="font-mono text-xs font-semibold text-foreground">Google Cloud Identity</span>
              <p className="text-xs text-text-muted">
                Federated OAuth 2.0 authentication gateway and user verification.
              </p>
            </div>
            <div className="rounded-md border border-border-default bg-surface-01 p-3 space-y-1">
              <span className="font-mono text-xs font-semibold text-foreground">Hosting Infrastructure</span>
              <p className="text-xs text-text-muted">
                Next.js application shell compute environment and edge serverless execution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 08. Data Sharing & Disclosure */}
      <section id="data-sharing" className="scroll-mt-24 space-y-4">
        <div className="flex items-center gap-3 border-b border-border-default pb-2">
          <span className="font-mono text-xs font-semibold text-text-muted">08</span>
          <h2 className="font-sans text-xl font-bold tracking-tight text-foreground">
            Data Sharing & Disclosure
          </h2>
        </div>
        <div className="space-y-3.5 text-sm leading-relaxed text-text-secondary">
          <p>
            <strong className="text-foreground">We never sell, rent, monetize, or lease your personal data or visualizer models to third parties.</strong>
          </p>
          <p>We disclose information only under the following strictly defined conditions:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-foreground">Legal Process:</strong> When compelled by valid,
              binding legal requests, such as a court order, subpoena, or applicable regulatory
              statute.
            </li>
            <li>
              <strong className="text-foreground">Security Protection:</strong> To investigate,
              prevent, or mitigate critical security breaches, denial-of-service attacks, or
              systemic platform abuse.
            </li>
            <li>
              <strong className="text-foreground">Corporate Reorganization:</strong> In connection
              with a merger, asset acquisition, or corporate restructuring, subject to equivalent
              privacy commitments by the successor entity.
            </li>
          </ul>
        </div>
      </section>

      {/* 09. Data Retention & Permanent Deletion */}
      <section id="retention-deletion" className="scroll-mt-24 space-y-4">
        <div className="flex items-center gap-3 border-b border-border-default pb-2">
          <span className="font-mono text-xs font-semibold text-text-muted">09</span>
          <h2 className="font-sans text-xl font-bold tracking-tight text-foreground">
            Data Retention & Permanent Deletion
          </h2>
        </div>
        <div className="space-y-3.5 text-sm leading-relaxed text-text-secondary">
          <p>
            We retain your profile data and projects for as long as your account remains active.
            When you request account termination or project deletion:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-foreground">Individual Project Deletion:</strong> Instantly
              removes the project row and cascades across all associated graph documents and
              simulation snapshots.
            </li>
            <li>
              <strong className="text-foreground">Account Purge:</strong> Deleting your account
              initiates a hard-cascade deletion of your user profile, all owned projects, and
              associated sessions within thirty (30) days from production databases.
            </li>
            <li>
              <strong className="text-foreground">Encrypted Backups:</strong> Disaster-recovery
              database snapshots expire and are overwritten according to our standard thirty (30)
              day backup cycle.
            </li>
          </ul>
        </div>
      </section>

      {/* 10. Security Safeguards & RLS */}
      <section id="security-safeguards" className="scroll-mt-24 space-y-4">
        <div className="flex items-center gap-3 border-b border-border-default pb-2">
          <span className="font-mono text-xs font-semibold text-text-muted">10</span>
          <h2 className="font-sans text-xl font-bold tracking-tight text-foreground">
            Security Safeguards & RLS
          </h2>
        </div>
        <div className="space-y-3.5 text-sm leading-relaxed text-text-secondary">
          <p>
            NXTQR applies defense-in-depth architectural safeguards to protect your intellectual
            property:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-foreground">TLS 1.3 Encryption in Transit:</strong> All HTTP
              and WebSocket transport is encrypted with modern cipher suites.
            </li>
            <li>
              <strong className="text-foreground">AES-256 at Rest:</strong> Database clusters and
              snapshot archives are protected by volume-level encryption.
            </li>
            <li>
              <strong className="text-foreground">Strict Payload Assertions:</strong> All inbound
              JSON payloads are validated against strict Zod schemas and checked by payload size
              guards (<code className="font-mono text-xs text-foreground bg-surface-02 px-1 py-0.5 rounded">assertPayloadSize</code>) before parsing.
            </li>
            <li>
              <strong className="text-foreground">Automated RLS Regression Testing:</strong> Our
              continuous integration pipeline executes automated SQL regression suites (<code className="font-mono text-xs text-foreground bg-surface-02 px-1 py-0.5 rounded">supabase/tests/rls_test.sql</code>) to verify that cross-tenant access is physically impossible.
            </li>
          </ul>
        </div>
      </section>

      {/* 11. Your Privacy Rights & Controls */}
      <section id="user-rights" className="scroll-mt-24 space-y-4">
        <div className="flex items-center gap-3 border-b border-border-default pb-2">
          <span className="font-mono text-xs font-semibold text-text-muted">11</span>
          <h2 className="font-sans text-xl font-bold tracking-tight text-foreground">
            Your Privacy Rights & Controls
          </h2>
        </div>
        <div className="space-y-3.5 text-sm leading-relaxed text-text-secondary">
          <p>
            Regardless of your geographic location, we extend comprehensive privacy controls in
            harmony with GDPR (EU), CCPA/CPRA (California), and global data privacy standards:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="rounded-md border border-border-default bg-surface-01 p-3 space-y-1">
              <span className="font-mono text-xs font-semibold text-foreground">Right of Access</span>
              <p className="text-xs text-text-muted">
                You may inspect and view all profile and project metadata linked to your account at any time.
              </p>
            </div>
            <div className="rounded-md border border-border-default bg-surface-01 p-3 space-y-1">
              <span className="font-mono text-xs font-semibold text-foreground">Data Portability</span>
              <p className="text-xs text-text-muted">
                Export your entire visualizer topology as structured JSON graph schemas without lock-in.
              </p>
            </div>
            <div className="rounded-md border border-border-default bg-surface-01 p-3 space-y-1">
              <span className="font-mono text-xs font-semibold text-foreground">Right to Rectification</span>
              <p className="text-xs text-text-muted">
                Update or rectify your user profile display name and preferences through workspace settings.
              </p>
            </div>
            <div className="rounded-md border border-border-default bg-surface-01 p-3 space-y-1">
              <span className="font-mono text-xs font-semibold text-foreground">Right to Erasure</span>
              <p className="text-xs text-text-muted">
                Permanently purge your account, profile, and all saved engineering assets upon request.
              </p>
            </div>
          </div>
          <p className="text-xs text-text-muted">
            To exercise any of these statutory rights, transmit an inquiry to{" "}
            <a href="mailto:privacy@nxtqr.dev" className="text-foreground underline underline-offset-4">
              privacy@nxtqr.dev
            </a>
            . We process and confirm verified requests within thirty (30) days.
          </p>
        </div>
      </section>

      {/* 12. International Processing */}
      <section id="international-transfers" className="scroll-mt-24 space-y-4">
        <div className="flex items-center gap-3 border-b border-border-default pb-2">
          <span className="font-mono text-xs font-semibold text-text-muted">12</span>
          <h2 className="font-sans text-xl font-bold tracking-tight text-foreground">
            International Processing
          </h2>
        </div>
        <div className="space-y-3.5 text-sm leading-relaxed text-text-secondary">
          <p>
            NXTQR utilizes distributed cloud infrastructure located primarily in the United States
            and the European Union. By utilizing the platform, you acknowledge that your information
            may be transferred to, stored, and processed in jurisdictions with differing data
            protection laws.
          </p>
          <p>
            Where cross-border transfers occur, we implement Standard Contractual Clauses (SCCs)
            adopted by the European Commission and rely on third-party provider Data Privacy
            Framework certifications to ensure equivalent protections.
          </p>
        </div>
      </section>

      {/* 13. Children's Privacy */}
      <section id="childrens-privacy" className="scroll-mt-24 space-y-4">
        <div className="flex items-center gap-3 border-b border-border-default pb-2">
          <span className="font-mono text-xs font-semibold text-text-muted">13</span>
          <h2 className="font-sans text-xl font-bold tracking-tight text-foreground">
            Children&apos;s Privacy
          </h2>
        </div>
        <div className="space-y-3.5 text-sm leading-relaxed text-text-secondary">
          <p>
            NXTQR is an interactive visual engineering studio engineered exclusively for
            professional software engineers, system architects, and technical researchers. The
            platform is not directed toward or designed to attract individuals under the age of
            sixteen (16).
          </p>
          <p>
            We do not knowingly collect personal information from children under 16. If we become
            aware that an account has been created by a child under 16, we will immediately take
            steps to terminate the account and permanently delete all associated data.
          </p>
        </div>
      </section>

      {/* 14. Policy Modifications */}
      <section id="policy-changes" className="scroll-mt-24 space-y-4">
        <div className="flex items-center gap-3 border-b border-border-default pb-2">
          <span className="font-mono text-xs font-semibold text-text-muted">14</span>
          <h2 className="font-sans text-xl font-bold tracking-tight text-foreground">
            Policy Modifications
          </h2>
        </div>
        <div className="space-y-3.5 text-sm leading-relaxed text-text-secondary">
          <p>
            We may revise this Privacy Policy periodically to reflect architectural evolutions,
            regulatory enhancements, or new platform features. When changes are made, the effective
            version (<code className="font-mono text-xs text-foreground bg-surface-02 px-1 py-0.5 rounded">{PRIVACY_CONFIG.version}</code>) and last updated date ({PRIVACY_CONFIG.lastUpdated}) at the head of this document will be revised.
          </p>
          <p>
            For material modifications that impact how personal data is processed, we will provide
            prominent advance notice through the application shell notification banner or via direct
            electronic transmission to your registered email address.
          </p>
        </div>
      </section>

      {/* 15. Contact & Privacy Inquiries */}
      <section id="contact-inquiries" className="scroll-mt-24 space-y-4">
        <div className="flex items-center gap-3 border-b border-border-default pb-2">
          <span className="font-mono text-xs font-semibold text-text-muted">15</span>
          <h2 className="font-sans text-xl font-bold tracking-tight text-foreground">
            Contact & Privacy Inquiries
          </h2>
        </div>
        <div className="space-y-3.5 text-sm leading-relaxed text-text-secondary">
          <p>
            For inquiries, data protection questions, security audit disclosures, or to exercise your
            privacy rights under applicable statutes, please contact our data protection team:
          </p>
          <div className="rounded-md border border-border-default bg-surface-01 p-4 space-y-2 font-mono text-xs text-foreground">
            <div>
              <span className="text-text-muted">Privacy Inquiries: </span>
              <a href="mailto:privacy@nxtqr.dev" className="text-foreground underline underline-offset-4">
                privacy@nxtqr.dev
              </a>
            </div>
            <div>
              <span className="text-text-muted">Security Audits: </span>
              <a href="mailto:security@nxtqr.dev" className="text-foreground underline underline-offset-4">
                security@nxtqr.dev
              </a>
            </div>
            <div>
              <span className="text-text-muted">Legal Operations: </span>
              <a href="mailto:legal@nxtqr.dev" className="text-foreground underline underline-offset-4">
                legal@nxtqr.dev
              </a>
            </div>
            <div className="pt-2 text-text-muted text-[11px]">
              NXTQR Interactive Visual Engineering Studio · Data Protection Division
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

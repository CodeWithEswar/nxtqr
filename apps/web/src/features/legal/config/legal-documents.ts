export interface LegalSectionMeta {
  id: string;
  number: string;
  title: string;
  summary?: string;
}

export interface LegalDocumentConfig {
  slug: "terms" | "privacy";
  title: string;
  shortTitle: string;
  version: string;
  effectiveDate: string;
  lastUpdated: string;
  description: string;
  canonicalPath: string;
  sections: LegalSectionMeta[];
}

export const TERMS_CONFIG: LegalDocumentConfig = {
  slug: "terms",
  title: "Terms of Service",
  shortTitle: "Terms",
  version: "v1.0.0",
  effectiveDate: "November 9, 2026",
  lastUpdated: "November 9, 2026",
  description:
    "The legal agreement governing your access to and use of the NXTQR Interactive Visual Engineering Studio.",
  canonicalPath: "/terms",
  sections: [
    { id: "overview", number: "01", title: "Overview & Agreement" },
    { id: "eligibility", number: "02", title: "User Eligibility" },
    { id: "authentication", number: "03", title: "Accounts & Authentication" },
    { id: "services", number: "04", title: "Description of Services" },
    { id: "acceptable-use", number: "05", title: "Acceptable Use Policy" },
    { id: "user-content", number: "06", title: "User Projects & Content Ownership" },
    { id: "platform-ip", number: "07", title: "Platform Intellectual Property" },
    { id: "availability", number: "08", title: "Service Availability & Maintenance" },
    { id: "commercial-terms", number: "09", title: "Commercial Terms & Subscriptions" },
    { id: "termination", number: "10", title: "Suspension & Account Closure" },
    { id: "disclaimers", number: "11", title: "Technical Disclaimers" },
    { id: "liability", number: "12", title: "Limitation of Liability" },
    { id: "indemnification", number: "13", title: "Indemnification" },
    { id: "governing-law", number: "14", title: "Governing Law & Disputes" },
    { id: "changes", number: "15", title: "Modifications to Terms" },
    { id: "contact", number: "16", title: "Contact Information" },
  ],
};

export const PRIVACY_CONFIG: LegalDocumentConfig = {
  slug: "privacy",
  title: "Privacy Policy",
  shortTitle: "Privacy",
  version: "v1.0.0",
  effectiveDate: "November 9, 2026",
  lastUpdated: "November 9, 2026",
  description:
    "How NXTQR collects, uses, stores, isolates, and protects your information and engineering diagrams.",
  canonicalPath: "/privacy",
  sections: [
    { id: "introduction", number: "01", title: "Introduction & Scope" },
    { id: "information-collected", number: "02", title: "Information We Collect" },
    { id: "google-auth", number: "03", title: "Google OAuth & Authentication Data" },
    { id: "how-we-use", number: "04", title: "How We Use Information" },
    { id: "project-storage", number: "05", title: "Project Storage & Security Isolation" },
    { id: "cookies-sessions", number: "06", title: "Cookies & Session Management" },
    { id: "third-parties", number: "07", title: "Third-Party Service Providers" },
    { id: "data-sharing", number: "08", title: "Data Sharing & Disclosure" },
    { id: "retention-deletion", number: "09", title: "Data Retention & Permanent Deletion" },
    { id: "security-safeguards", number: "10", title: "Security Safeguards & RLS" },
    { id: "user-rights", number: "11", title: "Your Privacy Rights & Controls" },
    { id: "international-transfers", number: "12", title: "International Processing" },
    { id: "childrens-privacy", number: "13", title: "Children's Privacy" },
    { id: "policy-changes", number: "14", title: "Policy Modifications" },
    { id: "contact-inquiries", number: "15", title: "Contact & Privacy Inquiries" },
  ],
};


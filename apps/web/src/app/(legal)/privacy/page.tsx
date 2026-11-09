import React from "react";
import type { Metadata } from "next";
import {
  PRIVACY_CONFIG,
  LegalLayout,
  LegalDocument,
  PrivacyContent,
} from "@/features/legal";

export const metadata: Metadata = {
  title: "Privacy Policy | NXTQR",
  description: PRIVACY_CONFIG.description,
  alternates: {
    canonical: PRIVACY_CONFIG.canonicalPath,
  },
  openGraph: {
    title: "Privacy Policy | NXTQR",
    description: PRIVACY_CONFIG.description,
    url: PRIVACY_CONFIG.canonicalPath,
    type: "website",
  },
};

export default function PrivacyPage() {
  return (
    <LegalLayout config={PRIVACY_CONFIG}>
      <LegalDocument config={PRIVACY_CONFIG}>
        <PrivacyContent />
      </LegalDocument>
    </LegalLayout>
  );
}


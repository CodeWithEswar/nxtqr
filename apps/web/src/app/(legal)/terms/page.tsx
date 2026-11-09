import React from "react";
import type { Metadata } from "next";
import {
  TERMS_CONFIG,
  LegalLayout,
  LegalDocument,
  TermsContent,
} from "@/features/legal";

export const metadata: Metadata = {
  title: "Terms of Service | NXTQR",
  description: TERMS_CONFIG.description,
  alternates: {
    canonical: TERMS_CONFIG.canonicalPath,
  },
  openGraph: {
    title: "Terms of Service | NXTQR",
    description: TERMS_CONFIG.description,
    url: TERMS_CONFIG.canonicalPath,
    type: "website",
  },
};

export default function TermsPage() {
  return (
    <LegalLayout config={TERMS_CONFIG}>
      <LegalDocument config={TERMS_CONFIG}>
        <TermsContent />
      </LegalDocument>
    </LegalLayout>
  );
}


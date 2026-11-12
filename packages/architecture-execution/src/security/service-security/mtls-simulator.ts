import type {
  MtlsSecurityPolicy,
  MtlsEvaluationResult,
} from "../security-schemas";

export class MtlsSimulator {
  public static evaluateHandshake(
    policy: MtlsSecurityPolicy,
    _virtualClockMs = 0
  ): MtlsEvaluationResult {
    if (!policy.enabled) {
      return {
        handshakeSuccess: true,
        clientVerified: false,
        spiffeIdVerified: false,
        explanation: "mTLS is not required; standard plaintext or one-way TLS connection established.",
      };
    }

    const certScenario = policy.clientCertScenario;

    // 1. Client Certificate Presence
    if (!certScenario || !certScenario.certPresent) {
      if (policy.requireClientCert) {
        return {
          handshakeSuccess: false,
          clientVerified: false,
          spiffeIdVerified: false,
          explanation: "mTLS handshake failed: Client certificate is required by mutual TLS policy but none was presented.",
        };
      }
      return {
        handshakeSuccess: true,
        clientVerified: false,
        spiffeIdVerified: false,
        explanation: "One-way TLS verified: Server authenticated, optional client certificate omitted.",
      };
    }

    // 2. Certificate Validity & Structure
    if (!certScenario.isValid) {
      return {
        handshakeSuccess: false,
        clientVerified: false,
        spiffeIdVerified: false,
        explanation: "mTLS handshake failed: Client X.509 certificate signature is corrupt or invalid.",
      };
    }

    // 3. Expiration Check
    if (certScenario.isExpired) {
      return {
        handshakeSuccess: false,
        clientVerified: false,
        spiffeIdVerified: false,
        explanation: "mTLS handshake failed: Client X.509 certificate has expired.",
      };
    }

    // 4. Trust Chain Check
    if (!certScenario.isIssuerTrusted) {
      return {
        handshakeSuccess: false,
        clientVerified: false,
        spiffeIdVerified: false,
        explanation: `mTLS handshake failed: Certificate issuer '${certScenario.issuerCommonName || "unknown"}' is not signed by a trusted root CA.`,
      };
    }

    // 5. SPIFFE ID Verification (Service Identity)
    let spiffeVerified = false;
    if (policy.allowedSpiffeIds && policy.allowedSpiffeIds.length > 0) {
      if (certScenario.spiffeId && policy.allowedSpiffeIds.includes(certScenario.spiffeId)) {
        spiffeVerified = true;
      } else {
        return {
          handshakeSuccess: false,
          clientVerified: true,
          spiffeIdVerified: false,
          explanation: `Service identity rejected: SPIFFE ID '${certScenario.spiffeId || "none"}' is not authorized in allowed mesh identities.`,
        };
      }
    }

    return {
      handshakeSuccess: true,
      clientVerified: true,
      spiffeIdVerified: spiffeVerified || Boolean(certScenario.spiffeId),
      explanation: `Mutual TLS handshake established (TLS 1.3, verified client: '${certScenario.subjectCommonName || "service_caller"}').`,
    };
  }
}

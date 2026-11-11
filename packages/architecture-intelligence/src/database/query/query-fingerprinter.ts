/**
 * NXTQR — Phase 05.3.23: Architecture Database Design, Query Performance & Storage Intelligence Engine
 * SQL Query Normalizer & Stable Fingerprinter
 */

export class QueryFingerprinter {
  public static fingerprint(rawSql: string): string {
    if (!rawSql || typeof rawSql !== "string") {
      return "";
    }

    // 1. Strip comments
    let normalized = rawSql
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/--.*$/gm, "")
      .trim();

    // 2. Normalize whitespace
    normalized = normalized.replace(/\s+/g, " ");

    // 3. Replace UUID literals
    normalized = normalized.replace(
      /'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'/gi,
      "?"
    );

    // 4. Replace string literals '...'
    normalized = normalized.replace(/'(?:[^'\\]|\\.)*'/g, "?");

    // 5. Replace parameter placeholders ($1, $2, :paramName, ?) before digits
    normalized = normalized.replace(/\$\d+/g, "?").replace(/:\w+/g, "?");

    // 6. Replace numeric literals
    normalized = normalized.replace(/\b\d+(\.\d+)?\b/g, "?");

    // 7. Collapse lists of placeholders: IN (?, ?, ?) -> IN (?)
    normalized = normalized.replace(/\(\s*\?(?:\s*,\s*\?)+\s*\)/g, "(?)");

    // 8. Lowercase keywords but preserve structure
    normalized = normalized.toLowerCase().trim();

    return normalized;
  }

  public static generateFingerprintId(fingerprint: string): string {
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return `fp-${Math.abs(hash).toString(16).padStart(8, "0")}`;
  }

  public static generateFingerprint(rawSql: string): { normalizedSql: string; fingerprintHash: string } {
    const normalizedSql = this.fingerprint(rawSql);
    const fingerprintHash = this.generateFingerprintId(normalizedSql);
    return { normalizedSql, fingerprintHash };
  }
}

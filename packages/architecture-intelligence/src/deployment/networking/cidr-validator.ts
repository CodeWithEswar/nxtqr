/**
 * NXTQR — Phase 05.3.18: Architecture Deployment Topology & Infrastructure Mapping Engine
 * CIDR Parsing and Bitwise IP Address Arithmetic
 */

export interface ParsedCIDR {
  cidr: string;
  ip: string;
  prefixLength: number;
  startInt: number;
  endInt: number;
  maskInt: number;
  hostCount: number;
  totalIps: number;
  usableIps: number;
  firstIp: string;
  lastIp: string;
}

export class CIDRValidator {
  /**
   * Converts IPv4 string to 32-bit unsigned integer
   */
  public static ipToInt(ip: string): number | null {
    const parts = ip.trim().split(".");
    if (parts.length !== 4) return null;

    let num = 0;
    for (const part of parts) {
      if (!/^\d+$/.test(part)) return null;
      const n = parseInt(part, 10);
      if (n < 0 || n > 255) return null;
      num = (num << 8) + n;
    }
    return num >>> 0;
  }

  /**
   * Converts 32-bit unsigned integer back to IPv4 string
   */
  public static intToIp(intVal: number): string {
    const n = intVal >>> 0;
    return [
      (n >>> 24) & 255,
      (n >>> 16) & 255,
      (n >>> 8) & 255,
      n & 255,
    ].join(".");
  }

  /**
   * Parses and validates an IPv4 CIDR string (e.g. "10.0.1.0/24")
   */
  public static parseCIDR(cidrStr: string): ParsedCIDR | null {
    if (!cidrStr || typeof cidrStr !== "string") return null;

    const parts = cidrStr.trim().split("/");
    if (parts.length !== 2) return null;

    const ip = parts[0];
    const prefixStr = parts[1];
    if (!/^\d+$/.test(prefixStr)) return null;

    const prefix = parseInt(prefixStr, 10);
    if (prefix < 0 || prefix > 32) return null;

    const ipInt = this.ipToInt(ip);
    if (ipInt === null) return null;

    const maskInt = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    const startInt = (ipInt & maskInt) >>> 0;
    const hostCount = prefix === 32 ? 1 : Math.pow(2, 32 - prefix);
    const endInt = (startInt + hostCount - 1) >>> 0;

    // Usable IPs: AWS standard reserves network, router, DNS, future, broadcast (-5) if /28 or larger
    const usableIps = hostCount <= 4 ? Math.max(1, hostCount - 2) : hostCount - 5;

    return {
      cidr: `${this.intToIp(startInt)}/${prefix}`,
      ip: this.intToIp(ipInt),
      prefixLength: prefix,
      startInt,
      endInt,
      maskInt,
      hostCount,
      totalIps: hostCount,
      usableIps,
      firstIp: this.intToIp(startInt),
      lastIp: this.intToIp(endInt),
    };
  }

  /**
   * Checks if two CIDRs have overlapping IP address spaces
   */
  public static checkOverlap(cidrA: string, cidrB: string): boolean {
    const parsedA = this.parseCIDR(cidrA);
    const parsedB = this.parseCIDR(cidrB);
    if (!parsedA || !parsedB) return false;

    return parsedA.startInt <= parsedB.endInt && parsedA.endInt >= parsedB.startInt;
  }

  /**
   * Checks if subnet CIDR is completely contained within parent VPC CIDR
   */
  public static isContainedWithin(subnetCidr: string, vpcCidr: string): boolean {
    const sub = this.parseCIDR(subnetCidr);
    const vpc = this.parseCIDR(vpcCidr);
    if (!sub || !vpc) return false;

    return sub.startInt >= vpc.startInt && sub.endInt <= vpc.endInt;
  }
}

// Convenient function exports
export function isValidCidr(cidr: string): boolean {
  return CIDRValidator.parseCIDR(cidr) !== null;
}

export function parseCidr(cidr: string): ParsedCIDR | null {
  return CIDRValidator.parseCIDR(cidr);
}

export function doCidrsOverlap(cidrA: string, cidrB: string): boolean {
  return CIDRValidator.checkOverlap(cidrA, cidrB);
}

export function isCidrContained(subnetCidr: string, vpcCidr: string): boolean {
  return CIDRValidator.isContainedWithin(subnetCidr, vpcCidr);
}

export function ipToInt(ip: string): number {
  const res = CIDRValidator.ipToInt(ip);
  if (res === null) throw new Error(`Invalid IP address: ${ip}`);
  return res;
}

export function intToIp(intVal: number): string {
  return CIDRValidator.intToIp(intVal);
}

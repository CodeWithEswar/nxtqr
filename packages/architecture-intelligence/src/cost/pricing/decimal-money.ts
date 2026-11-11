/**
 * Decimal-Safe Monetary Arithmetic
 *
 * Prevents floating-point rounding errors (e.g., 0.1 + 0.2 !== 0.3).
 * Operates with 6 decimal places of precision (scale factor: 1,000,000)
 * and formats outputs to standard currency decimals.
 */
export class DecimalMoney {
  private static readonly SCALE = 1_000_000n;
  private static readonly PRECISION = 6;

  /**
   * Converts a decimal string or number to scaled BigInt.
   */
  public static fromString(val: string | number | undefined | null): bigint {
    if (val === undefined || val === null || val === "") {
      return 0n;
    }

    const str = String(val).trim();
    if (!/^-?\d+(\.\d+)?$/.test(str)) {
      return 0n;
    }

    const isNegative = str.startsWith("-");
    const cleanStr = isNegative ? str.slice(1) : str;

    const [integerPart, fractionalPart = ""] = cleanStr.split(".");
    const paddedFraction = (fractionalPart + "000000").slice(0, DecimalMoney.PRECISION);

    const fullBigInt = BigInt(integerPart) * DecimalMoney.SCALE + BigInt(paddedFraction);
    return isNegative ? -fullBigInt : fullBigInt;
  }

  /**
   * Converts a scaled BigInt back to a standard two-decimal currency string (e.g. "12.50").
   */
  public static toString(units: bigint, decimals = 2): string {
    const isNegative = units < 0n;
    const absUnits = isNegative ? -units : units;

    const integerPart = absUnits / DecimalMoney.SCALE;
    const remainder = absUnits % DecimalMoney.SCALE;

    const fractionStr = remainder.toString().padStart(DecimalMoney.PRECISION, "0");
    const roundedFraction = fractionStr.slice(0, decimals);

    const prefix = isNegative ? "-" : "";
    return `${prefix}${integerPart.toString()}.${roundedFraction}`;
  }

  /**
   * Exact addition: a + b
   */
  public static add(a: string | number, b: string | number): string {
    const bigA = DecimalMoney.fromString(a);
    const bigB = DecimalMoney.fromString(b);
    return DecimalMoney.toString(bigA + bigB);
  }

  /**
   * Exact subtraction: a - b
   */
  public static subtract(a: string | number, b: string | number): string {
    const bigA = DecimalMoney.fromString(a);
    const bigB = DecimalMoney.fromString(b);
    return DecimalMoney.toString(bigA - bigB);
  }

  /**
   * Exact multiplication: unitPrice * quantity
   * Returns a 2-decimal rounded string.
   */
  public static multiply(priceStr: string | number, quantity: number): string {
    if (!isFinite(quantity) || quantity <= 0) return "0.00";

    const bigPrice = DecimalMoney.fromString(priceStr);
    // Quantity can be a decimal e.g. 730.5 hours or 1.25 GB
    const bigQty = DecimalMoney.fromString(quantity);

    // (bigPrice * bigQty) / SCALE
    const product = (bigPrice * bigQty) / DecimalMoney.SCALE;
    return DecimalMoney.toString(product);
  }

  /**
   * Compares two decimal amounts:
   * Returns 1 if a > b, -1 if a < b, 0 if equal.
   */
  public static compare(a: string | number, b: string | number): number {
    const bigA = DecimalMoney.fromString(a);
    const bigB = DecimalMoney.fromString(b);
    if (bigA > bigB) return 1;
    if (bigA < bigB) return -1;
    return 0;
  }

  /**
   * Checks if an amount represents exact zero.
   */
  public static isZero(val: string | number | undefined | null): boolean {
    return DecimalMoney.fromString(val) === 0n;
  }

  /**
   * Formats a decimal string into a user-facing currency string e.g. "$1,240.50".
   */
  public static format(amountStr: string, currency = "USD"): string {
    const num = Number(amountStr);
    if (!isFinite(num)) return `$0.00`;

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  }

  /**
   * Alias for format.
   */
  public static formatCurrency(amountStr: string, currency = "USD"): string {
    return DecimalMoney.format(amountStr, currency);
  }
}


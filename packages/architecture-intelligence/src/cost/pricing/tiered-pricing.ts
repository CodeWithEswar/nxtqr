import type { PricingRate } from "../contracts/pricing.types";
import { DecimalMoney } from "./decimal-money";

export class TieredPricingEvaluator {
  /**
   * Calculates the extended cost for a given consumption quantity based on rate tier definitions.
   */
  public static calculateCost(rate: PricingRate, quantity: number): string {
    if (!isFinite(quantity) || quantity <= 0) {
      return "0.00";
    }

    const tierType = rate.tierType;
    const tiers = rate.tiers;

    if (tierType === "flat") {
      return DecimalMoney.toString(DecimalMoney.fromString(rate.unitPrice));
    }

    if (tierType === "per_unit" || !tiers || tiers.length === 0) {
      return DecimalMoney.multiply(rate.unitPrice, quantity);
    }

    if (tierType === "volume") {
      // Find matching volume tier
      const matchingTier = tiers.find((tier) => {
        const inStart = quantity >= tier.startUnits;
        const inEnd = tier.endUnits === undefined || quantity <= tier.endUnits;
        return inStart && inEnd;
      });

      const effectivePrice = matchingTier ? matchingTier.unitPrice : rate.unitPrice;
      return DecimalMoney.multiply(effectivePrice, quantity);
    }

    if (tierType === "graduated") {
      // Calculate brackets progressively
      let remaining = quantity;
      let total = "0.00";

      // Sort tiers by startUnits ascending
      const sortedTiers = [...tiers].sort((a, b) => a.startUnits - b.startUnits);

      for (const tier of sortedTiers) {
        if (remaining <= 0) break;

        const tierSpan = tier.endUnits !== undefined ? tier.endUnits - tier.startUnits : remaining;
        const unitsInTier = Math.min(remaining, Math.max(0, tierSpan));

        if (unitsInTier > 0) {
          const tierCost = DecimalMoney.multiply(tier.unitPrice, unitsInTier);
          total = DecimalMoney.add(total, tierCost);
          remaining -= unitsInTier;
        }
      }

      return total;
    }

    return DecimalMoney.multiply(rate.unitPrice, quantity);
  }
}


import { DeterministicRandom } from "../../resilience/deterministic-random";
import type {
  CapForecastModel,
  CapQueueingTheoryResult,
  WorkloadProfileConfig,
} from "../capacity-schemas";

/**
 * Analytical M/M/1 Steady-State Queue Evaluator + Little's Law (L = λ × W).
 * Explicitly checks stability condition ρ = λ / μ < 1; never returns finite steady-state
 * metrics when unstable.
 */
export function evaluateMM1Queue(
  lambdaRps: number,
  muPerServerRps: number
): CapQueueingTheoryResult {
  const safeLambda = Math.max(0, lambdaRps);
  const safeMu = Math.max(0.0001, muPerServerRps);
  const rho = safeLambda / safeMu;

  if (rho >= 1) {
    return {
      model: "MM1",
      lambdaRps: Number(safeLambda.toFixed(2)),
      muPerServerRps: Number(safeMu.toFixed(2)),
      servers: 1,
      rhoUtilization: Number(rho.toFixed(4)),
      stable: false,
      applicable: false,
      probWaitErlangC: 1,
      expectedQueueLengthLq: null,
      expectedSystemLengthL: null,
      expectedWaitQueueMsWq: null,
      expectedTotalTimeMsW: null,
      littlesLawL: null,
      caveat: `Unstable M/M/1 queue (ρ = ${rho.toFixed(2)} >= 1.0): steady-state formulas inapplicable because queue grows without bound.`,
    };
  }

  const l = rho / (1 - rho);
  const lq = (rho * rho) / (1 - rho);
  const wSec = 1 / (safeMu - safeLambda);
  const wqSec = rho / (safeMu - safeLambda);
  const littlesL = safeLambda * wSec;

  return {
    model: "MM1",
    lambdaRps: Number(safeLambda.toFixed(2)),
    muPerServerRps: Number(safeMu.toFixed(2)),
    servers: 1,
    rhoUtilization: Number(rho.toFixed(4)),
    stable: true,
    applicable: true,
    probWaitErlangC: Number(rho.toFixed(4)),
    expectedQueueLengthLq: Number(lq.toFixed(3)),
    expectedSystemLengthL: Number(l.toFixed(3)),
    expectedWaitQueueMsWq: Number((wqSec * 1000).toFixed(2)),
    expectedTotalTimeMsW: Number((wSec * 1000).toFixed(2)),
    littlesLawL: Number(littlesL.toFixed(3)),
    caveat: `Valid steady-state M/M/1 (Poisson arrivals, exponential service, ρ=${rho.toFixed(2)} < 1); Little's Law L=${l.toFixed(2)} ≈ λW=${littlesL.toFixed(2)}.`,
  };
}

/**
 * Numerically stable M/M/c Erlang-C evaluator + Little's Law.
 * Requires λ < c × μ for steady-state applicability.
 */
export function evaluateMMcQueue(
  lambdaRps: number,
  muPerServerRps: number,
  servers: number
): CapQueueingTheoryResult {
  const c = Math.max(1, Math.round(servers));
  const safeLambda = Math.max(0, lambdaRps);
  const safeMu = Math.max(0.0001, muPerServerRps);
  const a = safeLambda / safeMu; // offered load in Erlangs
  const rho = a / c;

  if (rho >= 1) {
    return {
      model: "MMc",
      lambdaRps: Number(safeLambda.toFixed(2)),
      muPerServerRps: Number(safeMu.toFixed(2)),
      servers: c,
      rhoUtilization: Number(rho.toFixed(4)),
      stable: false,
      applicable: false,
      probWaitErlangC: 1,
      expectedQueueLengthLq: null,
      expectedSystemLengthL: null,
      expectedWaitQueueMsWq: null,
      expectedTotalTimeMsW: null,
      littlesLawL: null,
      caveat: `Unstable M/M/${c} queue (ρ = ${rho.toFixed(2)} >= 1.0): arrival rate λ=${safeLambda.toFixed(1)} exceeds aggregate capacity cμ=${(c * safeMu).toFixed(1)}.`,
    };
  }

  // Compute P0 iteratively via ratio term_n = a^n / n! to avoid factorial overflow
  let sumTerms = 1; // n = 0
  let term = 1;
  for (let n = 1; n < c; n++) {
    term = (term * a) / n;
    sumTerms += term;
  }
  const cTerm = (term * a) / c;
  const tailTerm = cTerm / (1 - rho);
  const p0 = 1 / (sumTerms + tailTerm);
  const probWait = tailTerm * p0;

  const lq = (probWait * rho) / (1 - rho);
  const wqSec = safeLambda > 0 ? lq / safeLambda : 0;
  const wSec = wqSec + 1 / safeMu;
  const l = safeLambda * wSec;

  return {
    model: "MMc",
    lambdaRps: Number(safeLambda.toFixed(2)),
    muPerServerRps: Number(safeMu.toFixed(2)),
    servers: c,
    rhoUtilization: Number(rho.toFixed(4)),
    stable: true,
    applicable: true,
    probWaitErlangC: Number(probWait.toFixed(4)),
    expectedQueueLengthLq: Number(lq.toFixed(3)),
    expectedSystemLengthL: Number(l.toFixed(3)),
    expectedWaitQueueMsWq: Number((wqSec * 1000).toFixed(2)),
    expectedTotalTimeMsW: Number((wSec * 1000).toFixed(2)),
    littlesLawL: Number(l.toFixed(3)),
    caveat: `Valid steady-state M/M/${c} (Erlang-C P(wait)=${(probWait * 100).toFixed(1)}%, ρ=${rho.toFixed(2)} < 1). Does not substitute for transient burst / bounded-queue simulation.`,
  };
}

export function evaluateWorkloadArrivalRps(
  profile: WorkloadProfileConfig,
  nowMs: number,
  rng: DeterministicRandom
): number {
  if (nowMs < profile.startMs || nowMs > profile.startMs + profile.durationMs) {
    return 0;
  }

  const base = profile.baseRequestsPerSecond;
  const peak = profile.peakRequestsPerSecond ?? base * 2;
  const rel = Math.max(0, Math.min(1, (nowMs - profile.startMs) / Math.max(1, profile.durationMs)));

  let rps = base;
  switch (profile.arrivalModel) {
    case "constant":
      rps = base;
      break;
    case "ramp":
      rps = base + (peak - base) * rel;
      break;
    case "step":
      rps = rel >= 0.3 ? peak : base;
      break;
    case "periodic":
      rps =
        base +
        ((peak - base) * (1 + Math.sin(rel * Math.PI * 2 - Math.PI / 2))) / 2;
      break;
    case "bursty":
      rps = rel >= 0.35 && rel <= 0.55 ? peak : base;
      break;
    case "poisson": {
      const jitter = (rng.next() - 0.5) * 0.25 * base;
      rps = Math.max(1, base + jitter);
      break;
    }
  }

  return Math.round(rps * profile.retryAmplificationFactor);
}

/**
 * Forecasts next-window workload strictly using past observations up to nowMs (zero future leakage).
 */
export function computeForecastNoLeakage(
  pastObservationsRps: number[],
  model: CapForecastModel
): number {
  if (pastObservationsRps.length === 0) return 0;
  const n = pastObservationsRps.length;

  switch (model) {
    case "moving_average": {
      const slice = pastObservationsRps.slice(-3);
      return Math.round(slice.reduce((a, b) => a + b, 0) / slice.length);
    }
    case "exponential_smoothing": {
      const alpha = 0.5;
      let s = pastObservationsRps[0]!;
      for (let i = 1; i < n; i++) {
        s = alpha * pastObservationsRps[i]! + (1 - alpha) * s;
      }
      return Math.round(s);
    }
    case "trend_extrapolation": {
      if (n < 2) return Math.round(pastObservationsRps[0]!);
      const last = pastObservationsRps[n - 1]!;
      const prev = pastObservationsRps[n - 2]!;
      return Math.max(1, Math.round(last + (last - prev) * 0.8));
    }
    case "seasonal_baseline": {
      const idx = n >= 4 ? n - 4 : 0;
      const latest = pastObservationsRps[n - 1]!;
      return Math.round(latest * 0.6 + pastObservationsRps[idx]! * 0.4);
    }
  }
}


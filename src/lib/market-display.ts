export type ProbabilityTone = "yes" | "no" | "neutral";

export interface MarketDisplay {
  probabilityPercent: number;
  yesPrice: number;
  noPrice: number;
  tone: ProbabilityTone;
}

const LIQUID_COLORS: Record<ProbabilityTone, [number, number, number]> = {
  yes: [0.216, 0.965, 0.655],
  no: [1, 0.373, 0.451],
  neutral: [0.318, 0.902, 1],
};

export function clampProbability(probability: number): number {
  if (!Number.isFinite(probability)) return 0.5;
  return Math.min(Math.max(probability, 0), 1);
}

export function getProbabilityTone(probability: number): ProbabilityTone {
  const clamped = clampProbability(probability);
  if (clamped >= 0.55) return "yes";
  if (clamped <= 0.44) return "no";
  return "neutral";
}

export function getMarketDisplay(probability: number): MarketDisplay {
  const clamped = clampProbability(probability);
  const probabilityPercent = Math.round(clamped * 100);

  return {
    probabilityPercent,
    yesPrice: probabilityPercent,
    noPrice: 100 - probabilityPercent,
    tone: getProbabilityTone(clamped),
  };
}

export function getLiquidColor(tone: ProbabilityTone): [number, number, number] {
  return LIQUID_COLORS[tone];
}

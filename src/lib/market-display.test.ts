import { describe, expect, it } from "vitest";
import {
  getMarketDisplay,
  getLiquidColor,
  getProbabilityTone,
} from "./market-display";

describe("market display helpers", () => {
  it("formats probability and cent quotes from a 0..1 probability", () => {
    expect(getMarketDisplay(0.673)).toEqual({
      probabilityPercent: 67,
      yesPrice: 67,
      noPrice: 33,
      tone: "yes",
    });
  });

  it("classifies uncertain probabilities as neutral", () => {
    expect(getProbabilityTone(0.5)).toBe("neutral");
    expect(getProbabilityTone(0.54)).toBe("neutral");
    expect(getProbabilityTone(0.45)).toBe("neutral");
  });

  it("clamps out-of-range probability input before formatting", () => {
    expect(getMarketDisplay(1.4)).toMatchObject({
      probabilityPercent: 100,
      yesPrice: 100,
      noPrice: 0,
      tone: "yes",
    });
    expect(getMarketDisplay(-0.2)).toMatchObject({
      probabilityPercent: 0,
      yesPrice: 0,
      noPrice: 100,
      tone: "no",
    });
  });

  it("returns RGB liquid colors normalized for Canvas UI", () => {
    expect(getLiquidColor("yes")).toEqual([0.216, 0.965, 0.655]);
    expect(getLiquidColor("no")).toEqual([1, 0.373, 0.451]);
    expect(getLiquidColor("neutral")).toEqual([0.318, 0.902, 1]);
  });
});

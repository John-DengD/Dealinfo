import { describe, expect, it } from "vitest";
import { computeHotScore } from "./markets";

const now = new Date("2026-07-29T00:00:00.000Z");

describe("computeHotScore", () => {
  it("交易笔数越多分越高", () => {
    const busy = computeHotScore({ tradeCount: 10, infoCardCount: 0, createdAt: now }, now);
    const quiet = computeHotScore({ tradeCount: 1, infoCardCount: 0, createdAt: now }, now);
    expect(busy).toBeGreaterThan(quiet);
  });

  it("同等交易/推荐下,越新分越高", () => {
    const base = { tradeCount: 5, infoCardCount: 2 };
    const fresh = computeHotScore({ ...base, createdAt: now }, now);
    const old = computeHotScore(
      { ...base, createdAt: new Date("2026-07-20T00:00:00.000Z") },
      now,
    );
    expect(fresh).toBeGreaterThan(old);
  });

  it("新近度加成不为负(很旧的市场也不会被拉到负分)", () => {
    const score = computeHotScore(
      { tradeCount: 0, infoCardCount: 0, createdAt: new Date("2020-01-01T00:00:00.000Z") },
      now,
    );
    expect(score).toBe(0);
  });

  it("推荐数计入热度", () => {
    const withCards = computeHotScore({ tradeCount: 0, infoCardCount: 5, createdAt: new Date("2020-01-01") }, now);
    expect(withCards).toBe(10);
  });
});

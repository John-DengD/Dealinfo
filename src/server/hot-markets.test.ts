import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { cleanupTestData } from "./test-cleanup";
import {
  autoResolveDueHotMarkets,
  generateDailyHotMarkets,
  HOT_MARKET_CATEGORIES,
  type HotNewsItem,
} from "./hot-markets";

const now = new Date("2026-07-24T08:00:00.000Z");

function fakeItems(category: string, namespace: string): HotNewsItem[] {
  return Array.from({ length: 12 }, (_, i) => ({
    title: `${category} 热点 ${i + 1}`,
    url: `https://example.com/hot/${namespace}/${category}/${i + 1}`,
    sourceName: `${category} News`,
    publishedAt: now,
  }));
}

describe("hot market generation", () => {
  beforeAll(cleanupTestData);
  afterAll(cleanupTestData);

  it("每天每个领域最多直接创建 3 个 OPEN 的 YES/NO 热点市场", async () => {
    const result = await generateDailyHotMarkets({
      now,
      generatedBy: "HOT_MARKET_CREATE_TEST",
      fetchItems: async (category) => fakeItems(category.category, "create"),
    });

    expect(HOT_MARKET_CATEGORIES).toHaveLength(10);
    expect(result.created).toBe(30);
    expect(result.skipped).toBe(90);

    const markets = await db.market.findMany({
      where: { generatedBy: "HOT_MARKET_CREATE_TEST" },
      orderBy: [{ category: "asc" }, { sourceUrl: "asc" }],
    });
    expect(markets).toHaveLength(30);
    expect(markets.every((market) => market.status === "OPEN")).toBe(true);
    expect(markets.every((market) => market.title.includes("是否会出现官方确认或重大后续"))).toBe(true);
    expect(markets.every((market) => market.sourceUrl?.startsWith("https://example.com/hot/"))).toBe(true);

    const counts = new Map<string, number>();
    for (const market of markets) counts.set(market.category, (counts.get(market.category) ?? 0) + 1);
    expect([...counts.values()].every((count) => count === 3)).toBe(true);
  });

  it("同一天重复抓取不会重复创建同一批热点市场", async () => {
    const result = await generateDailyHotMarkets({
      now,
      generatedBy: "HOT_MARKET_DUP_TEST",
      fetchItems: async (category) => fakeItems(category.category, "duplicate"),
    });
    const second = await generateDailyHotMarkets({
      now,
      generatedBy: "HOT_MARKET_DUP_TEST",
      fetchItems: async (category) => fakeItems(category.category, "duplicate"),
    });

    expect(result.created).toBe(30);
    expect(result.skipped).toBe(90);
    expect(second.created).toBe(0);
    // 第二次:每领域超额跳过 9 × 10 = 90,加上 30 个已存在 = 120
    expect(second.skipped).toBe(120);
  });

  it("每天自动结算到期的热点市场", async () => {
    await generateDailyHotMarkets({
      now,
      generatedBy: "HOT_MARKET_SETTLE_TEST",
      fetchItems: async (category) => fakeItems(category.category, "settle"),
    });

    const result = await autoResolveDueHotMarkets({
      now: new Date("2026-08-01T08:00:00.000Z"),
      generatedBy: "HOT_MARKET_SETTLE_TEST",
      decideOutcome: async (market) => (market.category === "体育" ? "YES" : "NO"),
    });

    expect(result.resolved).toBe(30);
    expect(result.skipped).toBe(0);

    const resolved = await db.market.findMany({
      where: { generatedBy: "HOT_MARKET_SETTLE_TEST" },
      select: { status: true, resolution: true, resolutionNote: true },
    });
    expect(resolved).toHaveLength(30);
    expect(resolved.every((market) => market.status === "RESOLVED")).toBe(true);
    expect(resolved.some((market) => market.resolution === "YES")).toBe(true);
    expect(resolved.some((market) => market.resolution === "NO")).toBe(true);
    expect(resolved.every((market) => market.resolutionNote?.includes("自动结算"))).toBe(true);
  }, 15000);

  it("自动结算证据不足时不结算,留给 admin 人工处理", async () => {
    await generateDailyHotMarkets({
      now,
      generatedBy: "HOT_MARKET_UNCLEAR_TEST",
      fetchItems: async (category) => fakeItems(category.category, "unclear"),
    });

    const result = await autoResolveDueHotMarkets({
      now: new Date("2026-08-01T08:00:00.000Z"),
      generatedBy: "HOT_MARKET_UNCLEAR_TEST",
      decideOutcome: async () => null,
    });

    expect(result.resolved).toBe(0);
    expect(result.skipped).toBe(30);

    const unresolved = await db.market.count({
      where: { generatedBy: "HOT_MARKET_UNCLEAR_TEST", status: "OPEN", resolution: null },
    });
    expect(unresolved).toBe(30);
  });
});

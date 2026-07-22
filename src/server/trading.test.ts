import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { placeOrder, resolveMarket } from "./trading";

let seq = 0;
async function seed() {
  seq += 1;
  const tag = `${Date.now()}_${seq}`;
  const u = await db.user.create({
    data: { username: `t_${tag}`, email: `t_${tag}@x.com`, passwordHash: "x" },
  });
  const m = await db.market.create({
    data: {
      title: "测试问题",
      description: "d",
      category: "test",
      status: "OPEN",
      creatorId: u.id,
      closesAt: new Date(Date.now() + 86400000),
      liquidityB: 100,
    },
  });
  return { u, m };
}

describe("trading service", () => {
  it("买入:扣积分、建持仓、更新市场份额、写流水", async () => {
    const { u, m } = await seed();
    const r = await placeOrder({ userId: u.id, marketId: m.id, side: "YES", action: "BUY", shares: 10 });
    const user = await db.user.findUnique({ where: { id: u.id } });
    const pos = await db.position.findUnique({
      where: { userId_marketId: { userId: u.id, marketId: m.id } },
    });
    const market = await db.market.findUnique({ where: { id: m.id } });
    const trades = await db.trade.findMany({ where: { userId: u.id, marketId: m.id } });
    expect(user!.pointsBalance).toBeCloseTo(1000 - r.costPoints, 4);
    expect(pos!.yesShares).toBe(10);
    expect(market!.qYes).toBe(10);
    expect(trades).toHaveLength(1);
  });

  it("积分不足:抛错且不改变任何状态", async () => {
    const { u, m } = await seed();
    await expect(
      placeOrder({ userId: u.id, marketId: m.id, side: "YES", action: "BUY", shares: 1e9 })
    ).rejects.toThrow();
    const user = await db.user.findUnique({ where: { id: u.id } });
    const market = await db.market.findUnique({ where: { id: m.id } });
    expect(user!.pointsBalance).toBe(1000);
    expect(market!.qYes).toBe(0);
  });

  it("卖出:退还积分、减少持仓", async () => {
    const { u, m } = await seed();
    await placeOrder({ userId: u.id, marketId: m.id, side: "YES", action: "BUY", shares: 10 });
    await placeOrder({ userId: u.id, marketId: m.id, side: "YES", action: "SELL", shares: 4 });
    const pos = await db.position.findUnique({
      where: { userId_marketId: { userId: u.id, marketId: m.id } },
    });
    expect(pos!.yesShares).toBeCloseTo(6, 6);
  });

  it("超额卖出:抛错", async () => {
    const { u, m } = await seed();
    await placeOrder({ userId: u.id, marketId: m.id, side: "YES", action: "BUY", shares: 5 });
    await expect(
      placeOrder({ userId: u.id, marketId: m.id, side: "YES", action: "SELL", shares: 99 })
    ).rejects.toThrow();
  });

  it("结算:赢方每份兑付 1 积分,输方归零", async () => {
    const { u, m } = await seed();
    const buy = await placeOrder({ userId: u.id, marketId: m.id, side: "YES", action: "BUY", shares: 10 });
    await resolveMarket(m.id, "YES");
    const user = await db.user.findUnique({ where: { id: u.id } });
    const market = await db.market.findUnique({ where: { id: m.id } });
    // 初始 1000 - 买入成本 + 10(赢得 10 份 × 1 积分)
    expect(user!.pointsBalance).toBeCloseTo(1000 - buy.costPoints + 10, 4);
    expect(market!.status).toBe("RESOLVED");
    expect(market!.resolution).toBe("YES");
  });

  it("已关闭市场禁止下单", async () => {
    const { u, m } = await seed();
    await db.market.update({ where: { id: m.id }, data: { status: "CLOSED" } });
    await expect(
      placeOrder({ userId: u.id, marketId: m.id, side: "YES", action: "BUY", shares: 1 })
    ).rejects.toThrow();
  });
});

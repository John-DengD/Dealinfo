import { afterAll, describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { registerUser } from "./accounts";
import { proposeMarket, approveMarket } from "./markets";
import { placeOrder, resolveMarket } from "./trading";
import { addInfoCard } from "./infocards";
import { cleanupTestData } from "./test-cleanup";

describe("端到端冒烟:注册→提议→上线→交易→信息卡→结算", () => {
  afterAll(cleanupTestData);

  it("完整流程,最终积分与状态正确", async () => {
    const tag = `smoke_${Date.now()}`;
    const user = await registerUser({ username: tag, email: `${tag}@x.com`, password: "secret123" });

    const proposed = await proposeMarket({
      title: "冒烟测试:某事件会发生吗?",
      description: "规则说明",
      category: "test",
      closesAt: new Date(Date.now() + 86400000),
      creatorId: user.id,
    });
    expect(proposed.status).toBe("PENDING");

    const opened = await approveMarket(proposed.id, 100);
    expect(opened.status).toBe("OPEN");

    const order = await placeOrder({
      userId: user.id,
      marketId: proposed.id,
      side: "YES",
      action: "BUY",
      shares: 20,
    });
    expect(order.probAfter).toBeGreaterThan(0.5);

    const card = await addInfoCard({
      marketId: proposed.id,
      authorId: user.id,
      stance: "YES",
      headline: "我认为会发生,因为……",
    });
    expect(card.id).toBeTruthy();

    await resolveMarket(proposed.id, "YES");

    const finalUser = await db.user.findUnique({ where: { id: user.id } });
    const finalMarket = await db.market.findUnique({ where: { id: proposed.id } });
    // 初始 1000 - 买入成本 + 20(赢得 20 份 × 1)
    expect(finalUser!.pointsBalance).toBeCloseTo(1000 - order.costPoints + 20, 3);
    expect(finalMarket!.status).toBe("RESOLVED");
    expect(finalMarket!.resolution).toBe("YES");
  });
});

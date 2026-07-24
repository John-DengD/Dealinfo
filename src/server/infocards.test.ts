import { afterAll, describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { addInfoCard, voteCard, listCards } from "./infocards";
import { cleanupTestData } from "./test-cleanup";

let seq = 0;
async function seedMarketAndUsers() {
  seq += 1;
  const tag = `${Date.now()}_${seq}`;
  const author = await db.user.create({
    data: { username: `a_${tag}`, email: `a_${tag}@x.com`, passwordHash: "x" },
  });
  const voter1 = await db.user.create({
    data: { username: `v1_${tag}`, email: `v1_${tag}@x.com`, passwordHash: "x" },
  });
  const voter2 = await db.user.create({
    data: { username: `v2_${tag}`, email: `v2_${tag}@x.com`, passwordHash: "x" },
  });
  const market = await db.market.create({
    data: {
      title: "info test",
      description: "d",
      category: "test",
      status: "OPEN",
      creatorId: author.id,
      closesAt: new Date(Date.now() + 86400000),
    },
  });
  return { author, voter1, voter2, market };
}

describe("info cards", () => {
  afterAll(cleanupTestData);

  it("添加信息卡(无来源)", async () => {
    const { author, market } = await seedMarketAndUsers();
    const card = await addInfoCard({
      marketId: market.id,
      authorId: author.id,
      stance: "YES",
      headline: "最新民调差距缩小",
    });
    expect(card.stance).toBe("YES");
    expect(card.score).toBe(0);
  });

  it("同一用户重复投票不叠加(去重)", async () => {
    const { author, voter1, market } = await seedMarketAndUsers();
    const card = await addInfoCard({
      marketId: market.id,
      authorId: author.id,
      stance: "NO",
      headline: "反方证据",
    });
    await voteCard(voter1.id, card.id, 1);
    const score = await voteCard(voter1.id, card.id, 1);
    expect(score).toBe(1); // 同一人两次 +1 只算一次
  });

  it("多人投票累加,改票生效", async () => {
    const { author, voter1, voter2, market } = await seedMarketAndUsers();
    const card = await addInfoCard({
      marketId: market.id,
      authorId: author.id,
      stance: "NEUTRAL",
      headline: "中立数据",
    });
    await voteCard(voter1.id, card.id, 1);
    await voteCard(voter2.id, card.id, 1);
    let score = await voteCard(voter1.id, card.id, -1); // voter1 改为踩
    expect(score).toBe(0); // +1(voter2) -1(voter1)
    score = (await db.infoCard.findUnique({ where: { id: card.id } }))!.score;
    expect(score).toBe(0);
  });

  it("listCards 按分数降序", async () => {
    const { author, voter1, market } = await seedMarketAndUsers();
    const low = await addInfoCard({ marketId: market.id, authorId: author.id, stance: "YES", headline: "低分卡" });
    const high = await addInfoCard({ marketId: market.id, authorId: author.id, stance: "YES", headline: "高分卡" });
    await voteCard(voter1.id, high.id, 1);
    const cards = await listCards(market.id, "top");
    expect(cards[0].id).toBe(high.id);
    expect(cards.some((c) => c.id === low.id)).toBe(true);
  });
});

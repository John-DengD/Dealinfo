import { db } from "@/lib/db";

const TEST_USER_PREFIXES = ["a_", "v1_", "v2_", "t_", "smoke_", "reg_", "dup_"];

function testUserWhere() {
  return {
    OR: TEST_USER_PREFIXES.map((prefix) => ({
      username: { startsWith: prefix },
      email: { endsWith: "@x.com" },
    })),
  };
}

function testMarketWhere() {
  return {
    OR: [
      { title: "info test", category: "test" },
      { title: "测试问题", category: "test" },
      { title: { startsWith: "冒烟测试:" }, category: "test" },
      { generatedBy: { startsWith: "HOT_MARKET_" } },
    ],
  };
}

export async function cleanupTestData() {
  const [users, markets] = await Promise.all([
    db.user.findMany({ where: testUserWhere(), select: { id: true } }),
    db.market.findMany({ where: testMarketWhere(), select: { id: true } }),
  ]);
  const userIds = users.map((user) => user.id);
  const marketIds = markets.map((market) => market.id);

  const infoCards = await db.infoCard.findMany({
    where: { OR: [{ marketId: { in: marketIds } }, { authorId: { in: userIds } }] },
    select: { id: true },
  });
  const cardIds = infoCards.map((card) => card.id);

  await db.cardVote.deleteMany({
    where: { OR: [{ userId: { in: userIds } }, { cardId: { in: cardIds } }] },
  });
  await db.infoCard.deleteMany({
    where: { OR: [{ id: { in: cardIds } }, { marketId: { in: marketIds } }, { authorId: { in: userIds } }] },
  });
  await db.trade.deleteMany({
    where: { OR: [{ userId: { in: userIds } }, { marketId: { in: marketIds } }] },
  });
  await db.position.deleteMany({
    where: { OR: [{ userId: { in: userIds } }, { marketId: { in: marketIds } }] },
  });
  await db.market.deleteMany({ where: { id: { in: marketIds } } });
  await db.recharge.deleteMany({ where: { userId: { in: userIds } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });

  return {
    users: userIds.length,
    markets: marketIds.length,
    infoCards: cardIds.length,
  };
}

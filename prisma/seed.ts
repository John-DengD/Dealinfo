import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { placeOrder } from "../src/server/trading";
import { addInfoCard } from "../src/server/infocards";

const db = new PrismaClient();

async function main() {
  // 清空(FK 安全顺序)
  await db.cardVote.deleteMany();
  await db.infoCard.deleteMany();
  await db.trade.deleteMany();
  await db.position.deleteMany();
  await db.market.deleteMany();
  await db.user.deleteMany();

  const hash = (pw: string) => bcrypt.hash(pw, 10);

  const admin = await db.user.create({
    data: {
      username: "admin",
      email: "admin@dealinfo.dev",
      passwordHash: await hash("admin123"),
      role: "ADMIN",
      pointsBalance: 100000,
    },
  });
  const alice = await db.user.create({
    data: { username: "alice", email: "alice@dealinfo.dev", passwordHash: await hash("demo123") },
  });
  const bob = await db.user.create({
    data: { username: "bob", email: "bob@dealinfo.dev", passwordHash: await hash("demo123") },
  });

  const marketsData = [
    {
      title: "2026 年底前比特币会突破 15 万美元吗?",
      description: "以主流交易所现货价格为准,任一时刻触及 150,000 美元即判定 Yes。",
      category: "加密",
    },
    {
      title: "今年 AI 大模型会通过公开的图灵测试吗?",
      description: "以权威机构公布的标准化图灵测试结果为准。",
      category: "科技",
    },
    {
      title: "本赛季某热门球队会夺冠吗?",
      description: "以官方赛事最终结果为准。",
      category: "体育",
    },
  ];

  const created = [];
  for (const m of marketsData) {
    const market = await db.market.create({
      data: {
        ...m,
        status: "OPEN",
        creatorId: admin.id,
        liquidityB: 100,
        closesAt: new Date(Date.now() + 30 * 86400000),
      },
    });
    created.push(market);
  }

  // 制造一些交易,形成概率走势
  await placeOrder({ userId: alice.id, marketId: created[0].id, side: "YES", action: "BUY", shares: 30 });
  await placeOrder({ userId: bob.id, marketId: created[0].id, side: "NO", action: "BUY", shares: 15 });
  await placeOrder({ userId: alice.id, marketId: created[1].id, side: "NO", action: "BUY", shares: 20 });
  await placeOrder({ userId: bob.id, marketId: created[2].id, side: "YES", action: "BUY", shares: 25 });

  // 信息卡(带个人推荐署名)
  await addInfoCard({
    marketId: created[0].id,
    authorId: alice.id,
    stance: "YES",
    headline: "机构持续增持,现货 ETF 资金流入创新高",
    body: "过去一个月净流入显著,历史上与价格突破正相关。",
    sourceUrl: "https://www.bitcoin.org",
  });
  await addInfoCard({
    marketId: created[0].id,
    authorId: bob.id,
    stance: "NO",
    headline: "宏观流动性收紧,短期上行动力不足",
  });
  await addInfoCard({
    marketId: created[1].id,
    authorId: bob.id,
    stance: "NEUTRAL",
    headline: "图灵测试的判定标准本身存在争议",
  });

  console.log("Seed 完成:");
  console.log("  管理员  admin@dealinfo.dev / admin123");
  console.log("  演示用户 alice@dealinfo.dev / demo123, bob@dealinfo.dev / demo123");
  console.log(`  市场 ${created.length} 个`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

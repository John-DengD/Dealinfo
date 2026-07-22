import { db } from "@/lib/db";

export type Stance = "YES" | "NO" | "NEUTRAL";
export type CardSort = "top" | "new" | "sourced";

async function fetchSourceTitle(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal, redirect: "follow" });
    clearTimeout(timer);
    const html = await res.text();
    const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    return match ? match[1].trim().slice(0, 200) : null;
  } catch {
    return null; // 抓取失败不阻断创建
  }
}

export interface AddCardInput {
  marketId: string;
  authorId: string;
  stance: Stance;
  headline: string;
  body?: string;
  sourceUrl?: string;
}

export async function addInfoCard(input: AddCardInput) {
  const headline = input.headline.trim();
  if (headline.length < 3) throw new Error("一句话观点太短");
  const sourceUrl = input.sourceUrl?.trim() || null;
  const sourceTitle = sourceUrl ? await fetchSourceTitle(sourceUrl) : null;
  return db.infoCard.create({
    data: {
      marketId: input.marketId,
      authorId: input.authorId,
      stance: input.stance,
      headline,
      body: input.body?.trim() || null,
      sourceUrl,
      sourceTitle,
    },
  });
}

/** 投票:同一用户对同一卡片只保留最新一票;返回卡片最新净分 */
export async function voteCard(userId: string, cardId: string, value: 1 | -1): Promise<number> {
  return db.$transaction(async (tx) => {
    await tx.cardVote.upsert({
      where: { userId_cardId: { userId, cardId } },
      create: { userId, cardId, value },
      update: { value },
    });
    const agg = await tx.cardVote.aggregate({
      where: { cardId },
      _sum: { value: true },
    });
    const score = agg._sum.value ?? 0;
    await tx.infoCard.update({ where: { id: cardId }, data: { score } });
    return score;
  });
}

export function listCards(marketId: string, sort: CardSort = "top") {
  const orderBy =
    sort === "new"
      ? [{ createdAt: "desc" as const }]
      : [{ score: "desc" as const }, { createdAt: "desc" as const }];
  return db.infoCard.findMany({
    where: { marketId },
    orderBy,
    include: { author: { select: { username: true, avatarUrl: true } } },
  });
}

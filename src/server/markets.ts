import { db } from "@/lib/db";
import { priceYes } from "@/lib/amm";

/** 市场列表项(首页卡片用) */
export interface MarketSummary {
  id: string;
  title: string;
  category: string;
  status: string;
  closesAt: Date;
  createdAt: Date;
  imageUrl: string | null;
  probYes: number;
  infoCardCount: number;
  tradeCount: number;
  /** 概率走势(时间升序),用于迷你 sparkline */
  probHistory: number[];
}

function toSummary(m: {
  id: string;
  title: string;
  category: string;
  status: string;
  closesAt: Date;
  createdAt: Date;
  imageUrl: string | null;
  qYes: number;
  qNo: number;
  liquidityB: number;
  trades: { probAfter: number }[];
  _count: { infoCards: number; trades: number };
}): MarketSummary {
  return {
    id: m.id,
    title: m.title,
    category: m.category,
    status: m.status,
    closesAt: m.closesAt,
    createdAt: m.createdAt,
    imageUrl: m.imageUrl,
    probYes: priceYes({ qYes: m.qYes, qNo: m.qNo, b: m.liquidityB }),
    infoCardCount: m._count.infoCards,
    tradeCount: m._count.trades,
    probHistory: [0.5, ...m.trades.map((t) => t.probAfter)],
  };
}

/** 事件列表项(首页事件卡用):聚合其下多个二元子市场。 */
export interface EventSummary {
  id: string;
  title: string;
  category: string;
  createdAt: Date;
  imageUrl: string | null;
  tradeCount: number;
  infoCardCount: number;
  /** 按 Yes 概率降序的结果列表 */
  outcomes: { marketId: string; label: string; probYes: number }[];
}

/** 首页信息流条目:独立市场 或 多结果事件。 */
export type FeedItem =
  | { kind: "market"; createdAt: Date; hot: number; market: MarketSummary }
  | { kind: "event"; createdAt: Date; hot: number; event: EventSummary };

/**
 * 综合热度:交易笔数(×3)+ 社区推荐数(×2)+ 新近度加成。
 * 新近度在 48 小时内线性衰减,最高 +20,避免只靠单一指标刷榜、也让新上线热点有曝光。
 */
export function computeHotScore(
  m: { tradeCount: number; infoCardCount: number; createdAt: Date },
  now: Date = new Date(),
): number {
  const ageHours = Math.max(0, (now.getTime() - m.createdAt.getTime()) / 3_600_000);
  const freshness = Math.max(0, 20 * (1 - ageHours / 48));
  return m.tradeCount * 3 + m.infoCardCount * 2 + freshness;
}

/** 首页信息流:独立市场 + 多结果事件,按新近度降序。 */
export async function listFeed(category?: string, query?: string): Promise<FeedItem[]> {
  const now = new Date();
  const [markets, events] = await Promise.all([
    listOpenMarkets(category, query),
    listOpenEvents(category, query),
  ]);
  const items: FeedItem[] = [
    ...markets.map(
      (market): FeedItem => ({ kind: "market", createdAt: market.createdAt, hot: computeHotScore(market, now), market }),
    ),
    ...events.map(
      (event): FeedItem => ({ kind: "event", createdAt: event.createdAt, hot: computeHotScore(event, now), event }),
    ),
  ];
  return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/** 首页轮播:综合热度最高的前 N 个信息流条目。 */
export async function listHotFeed(limit = 5): Promise<FeedItem[]> {
  const items = await listFeed();
  return [...items].sort((a, b) => b.hot - a.hot).slice(0, limit);
}

export async function listOpenMarkets(category?: string, query?: string): Promise<MarketSummary[]> {
  const markets = await db.market.findMany({
    where: {
      status: "OPEN",
      eventId: null, // 多结果事件的子市场不单独出现在信息流里
      ...(category && category !== "全部" ? { category } : {}),
      ...(query ? { title: { contains: query, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      trades: { select: { probAfter: true }, orderBy: { createdAt: "asc" } },
      _count: { select: { infoCards: true, trades: true } },
    },
  });
  return markets.map(toSummary);
}

export async function listOpenEvents(category?: string, query?: string): Promise<EventSummary[]> {
  const events = await db.event.findMany({
    where: {
      status: "OPEN",
      ...(category && category !== "全部" ? { category } : {}),
      ...(query ? { title: { contains: query, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      markets: { include: { _count: { select: { infoCards: true, trades: true } } } },
    },
  });
  return events.map((e) => ({
    id: e.id,
    title: e.title,
    category: e.category,
    createdAt: e.createdAt,
    imageUrl: e.imageUrl,
    tradeCount: e.markets.reduce((s, m) => s + m._count.trades, 0),
    infoCardCount: e.markets.reduce((s, m) => s + m._count.infoCards, 0),
    outcomes: e.markets
      .map((m) => ({
        marketId: m.id,
        label: m.outcomeLabel ?? m.title,
        probYes: priceYes({ qYes: m.qYes, qNo: m.qNo, b: m.liquidityB }),
      }))
      .sort((a, b) => b.probYes - a.probYes),
  }));
}

export async function listCategories(): Promise<string[]> {
  const rows = await db.market.findMany({
    where: { status: "OPEN" },
    select: { category: true },
    distinct: ["category"],
  });
  return rows.map((r) => r.category);
}

export async function getMarket(id: string) {
  const m = await db.market.findUnique({
    where: { id },
    include: {
      creator: { select: { username: true } },
      trades: {
        select: {
          id: true,
          probAfter: true,
          createdAt: true,
          side: true,
          action: true,
          shares: true,
          costPoints: true,
          user: { select: { username: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      positions: {
        where: { OR: [{ yesShares: { gt: 0 } }, { noShares: { gt: 0 } }] },
        select: {
          yesShares: true,
          noShares: true,
          user: { select: { username: true } },
        },
      },
      infoCards: {
        include: { author: { select: { username: true, avatarUrl: true } } },
      },
    },
  });
  if (!m) return null;
  return {
    ...m,
    probYes: priceYes({ qYes: m.qYes, qNo: m.qNo, b: m.liquidityB }),
  };
}

export interface ProposeInput {
  title: string;
  description: string;
  category: string;
  closesAt: Date;
  creatorId: string;
}

export async function proposeMarket(input: ProposeInput) {
  if (input.title.trim().length < 5) throw new Error("标题太短");
  return db.market.create({
    data: {
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category.trim() || "其他",
      closesAt: input.closesAt,
      creatorId: input.creatorId,
      status: "PENDING",
    },
  });
}

export async function approveMarket(id: string, liquidityB: number) {
  if (!Number.isFinite(liquidityB) || liquidityB <= 0) throw new Error("流动性参数须为正数");
  return db.market.update({
    where: { id },
    data: { status: "OPEN", liquidityB },
  });
}

export async function rejectMarket(id: string) {
  return db.market.update({ where: { id }, data: { status: "REJECTED" } });
}

export function listPendingMarkets() {
  return db.market.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: { creator: { select: { username: true } } },
  });
}

export function listResolvableMarkets() {
  return db.market.findMany({
    where: { status: { in: ["OPEN", "CLOSED"] } },
    orderBy: { closesAt: "asc" },
  });
}

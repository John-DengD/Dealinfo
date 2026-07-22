import { db } from "@/lib/db";
import { priceYes } from "@/lib/amm";

/** 市场列表项(首页卡片用) */
export interface MarketSummary {
  id: string;
  title: string;
  category: string;
  status: string;
  closesAt: Date;
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
    probYes: priceYes({ qYes: m.qYes, qNo: m.qNo, b: m.liquidityB }),
    infoCardCount: m._count.infoCards,
    tradeCount: m._count.trades,
    probHistory: [0.5, ...m.trades.map((t) => t.probAfter)],
  };
}

export async function listOpenMarkets(category?: string, query?: string): Promise<MarketSummary[]> {
  const markets = await db.market.findMany({
    where: {
      status: "OPEN",
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

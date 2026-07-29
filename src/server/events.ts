import { db } from "@/lib/db";
import { priceYes } from "@/lib/amm";
import { resolveMarket } from "./trading";

export interface EventOutcome {
  marketId: string;
  label: string;
  probYes: number;
  status: string;
  resolution: "YES" | "NO" | null;
  tradeCount: number;
}

export interface EventDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  closesAt: Date;
  createdAt: Date;
  imageUrl: string | null;
  creatorName: string;
  outcomes: EventOutcome[];
}

export interface CreateEventInput {
  title: string;
  description: string;
  category: string;
  closesAt: Date;
  outcomes: string[];
  creatorId: string;
  status?: "PENDING" | "OPEN";
  liquidityB?: number;
}

/** 建一个多结果事件:事件本体 + 每个结果一个独立二元子市场。 */
export async function createEvent(input: CreateEventInput) {
  if (input.title.trim().length < 5) throw new Error("标题太短");
  const labels = Array.from(
    new Set(input.outcomes.map((s) => s.trim()).filter(Boolean)),
  );
  if (labels.length < 2) throw new Error("多结果事件至少需要 2 个不同的结果");

  const status = input.status ?? "PENDING";
  const liquidityB = input.liquidityB ?? 100;
  const base = {
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category.trim() || "其他",
    closesAt: input.closesAt,
    creatorId: input.creatorId,
    status,
  };

  return db.event.create({
    data: {
      ...base,
      markets: {
        create: labels.map((label) => ({ ...base, liquidityB, outcomeLabel: label })),
      },
    },
    include: { markets: true },
  });
}

export async function getEvent(id: string): Promise<EventDetail | null> {
  const e = await db.event.findUnique({
    where: { id },
    include: {
      creator: { select: { username: true } },
      markets: {
        orderBy: { createdAt: "asc" },
        include: { _count: { select: { trades: true } } },
      },
    },
  });
  if (!e) return null;
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    category: e.category,
    status: e.status,
    closesAt: e.closesAt,
    createdAt: e.createdAt,
    imageUrl: e.imageUrl,
    creatorName: e.creator.username,
    outcomes: e.markets
      .map((m) => ({
        marketId: m.id,
        label: m.outcomeLabel ?? m.title,
        probYes: priceYes({ qYes: m.qYes, qNo: m.qNo, b: m.liquidityB }),
        status: m.status,
        resolution: m.resolution,
        tradeCount: m._count.trades,
      }))
      .sort((a, b) => b.probYes - a.probYes),
  };
}

/** 审核通过:事件与其全部子市场一起上线。 */
export async function approveEvent(id: string, liquidityB: number) {
  if (!Number.isFinite(liquidityB) || liquidityB <= 0) throw new Error("流动性参数须为正数");
  await db.$transaction([
    db.event.update({ where: { id }, data: { status: "OPEN" } }),
    db.market.updateMany({ where: { eventId: id }, data: { status: "OPEN", liquidityB } }),
  ]);
}

export async function rejectEvent(id: string) {
  await db.$transaction([
    db.event.update({ where: { id }, data: { status: "REJECTED" } }),
    db.market.updateMany({ where: { eventId: id }, data: { status: "REJECTED" } }),
  ]);
}

/** 结算事件:选中的结果 → YES,其余结果 → NO。 */
export async function resolveEvent(eventId: string, winnerMarketId: string, note?: string) {
  const markets = await db.market.findMany({ where: { eventId }, select: { id: true } });
  if (markets.length === 0) throw new Error("事件下没有结果市场");
  if (!markets.some((m) => m.id === winnerMarketId)) throw new Error("所选结果不属于该事件");
  for (const m of markets) {
    await resolveMarket(
      m.id,
      m.id === winnerMarketId ? "YES" : "NO",
      note ?? "事件结算:选定获胜结果",
    );
  }
  await db.event.update({ where: { id: eventId }, data: { status: "RESOLVED" } });
}

export function listPendingEvents() {
  return db.event.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: {
      creator: { select: { username: true } },
      markets: { select: { outcomeLabel: true } },
    },
  });
}

export function listResolvableEvents() {
  return db.event.findMany({
    where: { status: "OPEN" },
    orderBy: { closesAt: "asc" },
    include: {
      markets: { select: { id: true, outcomeLabel: true, qYes: true, qNo: true, liquidityB: true } },
    },
  });
}

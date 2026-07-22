import { db } from "@/lib/db";
import { quoteBuy, quoteSell, type Side } from "@/lib/amm";

export interface OrderInput {
  userId: string;
  marketId: string;
  side: Side;
  action: "BUY" | "SELL";
  shares: number;
}

export interface OrderResult {
  costPoints: number;
  probAfter: number;
}

/**
 * 下单(买入/卖出)。整个操作在数据库事务内原子完成:
 * 校验 → 计算 AMM 报价 → 改积分 → 改持仓 → 更新市场份额 → 写流水。
 * 任一步失败则全部回滚,防止并发导致积分为负或状态不一致。
 */
export async function placeOrder(input: OrderInput): Promise<OrderResult> {
  const { userId, marketId, side, action, shares } = input;
  if (!Number.isFinite(shares) || shares <= 0) throw new Error("份额必须为正数");

  return db.$transaction(async (tx) => {
    const market = await tx.market.findUnique({ where: { id: marketId } });
    if (!market) throw new Error("市场不存在");
    if (market.status !== "OPEN") throw new Error("市场未开放交易");
    if (market.closesAt < new Date()) throw new Error("市场已截止");

    const state = { qYes: market.qYes, qNo: market.qNo, b: market.liquidityB };
    const pos = await tx.position.upsert({
      where: { userId_marketId: { userId, marketId } },
      create: { userId, marketId },
      update: {},
    });

    const quote = action === "BUY" ? quoteBuy(state, side, shares) : quoteSell(state, side, shares);
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });

    if (action === "BUY") {
      if (user.pointsBalance < quote.costPoints) throw new Error("积分不足");
    } else {
      const held = side === "YES" ? pos.yesShares : pos.noShares;
      if (held < shares) throw new Error("持仓份额不足");
    }

    const pointsDelta = action === "BUY" ? -quote.costPoints : quote.costPoints;
    const sharesDelta = action === "BUY" ? shares : -shares;

    await tx.user.update({
      where: { id: userId },
      data: { pointsBalance: { increment: pointsDelta } },
    });
    await tx.position.update({
      where: { userId_marketId: { userId, marketId } },
      data: side === "YES" ? { yesShares: { increment: sharesDelta } } : { noShares: { increment: sharesDelta } },
    });
    await tx.market.update({
      where: { id: marketId },
      data: { qYes: quote.newState.qYes, qNo: quote.newState.qNo },
    });
    await tx.trade.create({
      data: { userId, marketId, side, action, shares, costPoints: quote.costPoints, probAfter: quote.probAfter },
    });

    return { costPoints: quote.costPoints, probAfter: quote.probAfter };
  });
}

/**
 * 结算市场:赢方每份额兑付 1 积分,输方归零。批量写入后标记市场为已结算。
 */
export async function resolveMarket(marketId: string, outcome: "YES" | "NO"): Promise<void> {
  await db.$transaction(async (tx) => {
    const market = await tx.market.findUniqueOrThrow({ where: { id: marketId } });
    if (market.status === "RESOLVED") throw new Error("市场已结算");

    const positions = await tx.position.findMany({ where: { marketId } });
    for (const p of positions) {
      const payout = outcome === "YES" ? p.yesShares : p.noShares;
      if (payout > 0) {
        await tx.user.update({
          where: { id: p.userId },
          data: { pointsBalance: { increment: payout } },
        });
      }
    }

    await tx.market.update({
      where: { id: marketId },
      data: { status: "RESOLVED", resolution: outcome, resolvedAt: new Date() },
    });
  });
}

"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { quoteBuy, quoteSell, type Side } from "@/lib/amm";
import { tracker, visitorIdFromCookie } from "@/lib/tracker";
import { placeOrder } from "./trading";

/** 只读报价:预览这笔交易的成本与成交后概率(不落库) */
export async function getQuote(
  marketId: string,
  side: Side,
  action: "BUY" | "SELL",
  shares: number
): Promise<{ costPoints: number; probAfter: number } | { error: string }> {
  if (!Number.isFinite(shares) || shares <= 0) return { error: "份额须为正数" };
  const m = await db.market.findUnique({ where: { id: marketId } });
  if (!m) return { error: "市场不存在" };
  const state = { qYes: m.qYes, qNo: m.qNo, b: m.liquidityB };
  const q = action === "BUY" ? quoteBuy(state, side, shares) : quoteSell(state, side, shares);
  return { costPoints: q.costPoints, probAfter: q.probAfter };
}

/** 提交下单:校验登录态,调用交易服务 */
export async function submitOrder(
  marketId: string,
  side: Side,
  action: "BUY" | "SELL",
  shares: number
): Promise<{ ok: true; costPoints: number } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "请先登录" };
  try {
    const r = await placeOrder({ userId: session.user.id, marketId, side, action, shares });
    await tracker.trackImmediate("trade_placed", {
      distinctId: session.user.id,
      visitorId: await visitorIdFromCookie(await cookies()),
      metadata: {
        market_id: marketId,
        side,
        action,
        shares,
        cost_points: r.costPoints,
      },
    });
    revalidatePath(`/market/${marketId}`);
    return { ok: true, costPoints: r.costPoints };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "下单失败" };
  }
}

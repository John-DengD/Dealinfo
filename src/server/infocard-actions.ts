"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { tracker, visitorIdFromCookie } from "@/lib/tracker";
import { addInfoCard, voteCard, type Stance } from "./infocards";

export async function addCardAction(input: {
  marketId: string;
  stance: Stance;
  headline: string;
  body?: string;
  sourceUrl?: string;
}): Promise<{ ok: true } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "请先登录" };
  try {
    const card = await addInfoCard({ ...input, authorId: session.user.id });
    await tracker.trackImmediate("infocard_added", {
      distinctId: session.user.id,
      visitorId: await visitorIdFromCookie(await cookies()),
      metadata: { market_id: input.marketId, card_id: card.id, stance: input.stance },
    });
    revalidatePath(`/market/${input.marketId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "提交失败" };
  }
}

export async function voteCardAction(
  cardId: string,
  value: 1 | -1,
  marketId: string
): Promise<{ ok: true; score: number } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "请先登录" };
  try {
    const score = await voteCard(session.user.id, cardId, value);
    revalidatePath(`/market/${marketId}`);
    return { ok: true, score };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "投票失败" };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { tracker } from "@/lib/tracker";
import { approveMarket, rejectMarket } from "@/server/markets";
import { approveEvent, rejectEvent, resolveEvent } from "@/server/events";
import { runDailyHotMarketJob } from "@/server/hot-markets";
import { cancelMarketAndRefund, resolveMarket } from "@/server/trading";

async function assertAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("无权限");
}

export async function approveAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  const b = Number(formData.get("liquidityB") || 100);
  const market = await approveMarket(id, b);
  await tracker.trackImmediate("market_approved", {
    distinctId: market.creatorId,
    eventId: `market-approved:${market.id}`,
    metadata: { market_id: market.id, category: market.category },
  });
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function rejectAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  await rejectMarket(id);
  revalidatePath("/admin");
}

export async function resolveAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  const outcome = String(formData.get("outcome"));
  if (outcome !== "YES" && outcome !== "NO") throw new Error("结果无效");
  await resolveMarket(id, outcome);
  revalidatePath("/admin");
  revalidatePath(`/market/${id}`);
}

export async function approveEventAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  const b = Number(formData.get("liquidityB") || 100);
  await approveEvent(id, b);
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function rejectEventAction(formData: FormData) {
  await assertAdmin();
  await rejectEvent(String(formData.get("id")));
  revalidatePath("/admin");
}

export async function resolveEventAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  const winnerMarketId = String(formData.get("winnerMarketId") ?? "");
  if (!winnerMarketId) throw new Error("请选择获胜结果");
  await resolveEvent(id, winnerMarketId);
  revalidatePath("/admin");
  revalidatePath(`/event/${id}`);
  revalidatePath("/");
}

export async function syncHotMarketsAction() {
  await assertAdmin();
  await runDailyHotMarketJob();
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function cancelMarketAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  await cancelMarketAndRefund(id);
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/market/${id}`);
}

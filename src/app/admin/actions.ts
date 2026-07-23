"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { tracker } from "@/lib/tracker";
import { approveMarket, rejectMarket } from "@/server/markets";
import { resolveMarket } from "@/server/trading";

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

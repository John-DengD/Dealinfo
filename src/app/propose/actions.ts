"use server";

import { auth } from "@/lib/auth";
import { proposeMarket } from "@/server/markets";

export type ProposeState = { error?: string; ok?: boolean };

export async function proposeAction(
  _prev: ProposeState,
  formData: FormData
): Promise<ProposeState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "请先登录" };

  const title = String(formData.get("title") ?? "");
  const description = String(formData.get("description") ?? "");
  const category = String(formData.get("category") ?? "");
  const closesAtRaw = String(formData.get("closesAt") ?? "");
  const closesAt = new Date(closesAtRaw);
  if (Number.isNaN(closesAt.getTime())) return { error: "请填写有效的截止时间" };
  if (closesAt <= new Date()) return { error: "截止时间必须在未来" };

  try {
    await proposeMarket({ title, description, category, closesAt, creatorId: session.user.id });
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "提交失败" };
  }
}

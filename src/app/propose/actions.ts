"use server";

import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { proposeMarket } from "@/server/markets";
import { createEvent } from "@/server/events";
import { tracker, visitorIdFromCookie } from "@/lib/tracker";

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

  const isMulti = String(formData.get("mode") ?? "single") === "multi";

  try {
    if (isMulti) {
      const outcomes = formData.getAll("outcome").map((v) => String(v));
      const event = await createEvent({ title, description, category, closesAt, outcomes, creatorId: session.user.id });
      await tracker.trackImmediate("event_proposed", {
        distinctId: session.user.id,
        visitorId: await visitorIdFromCookie(await cookies()),
        metadata: { event_id: event.id, category: event.category, outcomes: outcomes.length },
      });
    } else {
      const market = await proposeMarket({ title, description, category, closesAt, creatorId: session.user.id });
      await tracker.trackImmediate("market_proposed", {
        distinctId: session.user.id,
        visitorId: await visitorIdFromCookie(await cookies()),
        metadata: { market_id: market.id, category: market.category },
      });
    }
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "提交失败" };
  }
}

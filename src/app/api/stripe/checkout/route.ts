import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createRechargeCheckoutSession, resolveAppOrigin } from "@/server/recharge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const checkout = await createRechargeCheckoutSession({
      userId: session.user.id,
      email: session.user.email,
      origin: resolveAppOrigin(request),
    });
    return NextResponse.json({ url: checkout.url });
  } catch {
    return NextResponse.json({ error: "充值入口创建失败" }, { status: 500 });
  }
}

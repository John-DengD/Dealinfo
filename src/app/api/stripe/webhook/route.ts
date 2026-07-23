import type { NextRequest } from "next/server";
import type Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { stripe, centsToPoints } from "@/lib/stripe";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return new Response("missing signature or secret", { status: 400 });
  }

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch {
    return new Response("invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;
    const amountCents = session.amount_total ?? 0;

    if (session.payment_status === "paid" && userId && amountCents > 0) {
      const points = centsToPoints(amountCents);
      try {
        await db.$transaction(async (tx) => {
          // 幂等:同一 session 只入账一次(stripeSessionId 唯一约束)
          await tx.recharge.create({
            data: {
              userId,
              stripeSessionId: session.id,
              amountCents,
              points,
              currency: session.currency ?? "usd",
            },
          });
          await tx.user.update({
            where: { id: userId },
            data: { pointsBalance: { increment: points } },
          });
        });
      } catch (e) {
        // 唯一冲突 = 该笔已处理过,安全忽略
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          return new Response("already processed", { status: 200 });
        }
        // 其他错误 → 返回 500,让 Stripe 重试
        return new Response("processing error", { status: 500 });
      }
    }
  }

  return new Response("ok", { status: 200 });
}

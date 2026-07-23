import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

/** 汇率:1 美元 = 1 积分。amount_total 单位是「分」,故积分 = 分 / 100。 */
export function centsToPoints(amountCents: number): number {
  return amountCents / 100;
}

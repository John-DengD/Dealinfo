import Stripe from "stripe";

let _stripe: Stripe | null = null;

/** 懒加载 Stripe 客户端:仅在运行时(处理请求)创建,避免构建期因缺少密钥而报错。 */
export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");
  }
  return _stripe;
}

/** 汇率:1 美元 = 1 积分。amount_total 单位是「分」,故积分 = 分 / 100。 */
export function centsToPoints(amountCents: number): number {
  return amountCents / 100;
}

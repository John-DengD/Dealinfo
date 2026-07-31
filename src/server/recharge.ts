import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

type AppOriginEnv = {
  [key: string]: string | undefined;
  NEXT_PUBLIC_APP_URL?: string;
  AUTH_URL?: string;
  NEXTAUTH_URL?: string;
  VERCEL_URL?: string;
};

type RechargeEnv = AppOriginEnv & {
  STRIPE_RECHARGE_PRICE_ID?: string;
  STRIPE_RECHARGE_CURRENCY?: string;
  STRIPE_RECHARGE_UNIT_AMOUNT_CENTS?: string;
  STRIPE_RECHARGE_DEFAULT_QUANTITY?: string;
  STRIPE_RECHARGE_MAX_QUANTITY?: string;
};

type RechargeCheckoutInput = {
  userId: string;
  email?: string | null;
  origin: string;
  visitorId?: string;
  env?: RechargeEnv;
};

const DEFAULT_CURRENCY = "usd";
const DEFAULT_UNIT_AMOUNT_CENTS = 100;
const DEFAULT_QUANTITY = 1;
const DEFAULT_MAX_QUANTITY = 1000;

export function resolveAppOrigin(request: Request, env: AppOriginEnv = process.env): string {
  const configured =
    firstHeaderValue(env.NEXT_PUBLIC_APP_URL) ??
    firstHeaderValue(env.AUTH_URL) ??
    firstHeaderValue(env.NEXTAUTH_URL) ??
    firstHeaderValue(env.VERCEL_URL);
  if (configured) return normalizeOrigin(configured);

  const requestUrl = new URL(request.url);
  const host =
    firstHeaderValue(request.headers.get("x-forwarded-host")) ??
    firstHeaderValue(request.headers.get("host")) ??
    requestUrl.host;
  const protocol =
    firstHeaderValue(request.headers.get("x-forwarded-proto")) ??
    requestUrl.protocol.replace(":", "");

  return normalizeOrigin(`${protocol}://${host}`);
}

export function buildRechargeCheckoutParams({
  userId,
  email,
  origin,
  visitorId,
  env = process.env,
}: RechargeCheckoutInput): Stripe.Checkout.SessionCreateParams {
  const appOrigin = normalizeOrigin(origin);
  const quantity = readPositiveInt(env.STRIPE_RECHARGE_DEFAULT_QUANTITY, DEFAULT_QUANTITY);
  const maxQuantity = Math.max(
    quantity,
    readPositiveInt(env.STRIPE_RECHARGE_MAX_QUANTITY, DEFAULT_MAX_QUANTITY)
  );
  const priceId = firstHeaderValue(env.STRIPE_RECHARGE_PRICE_ID);

  const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
    quantity,
    adjustable_quantity: {
      enabled: true,
      minimum: 1,
      maximum: maxQuantity,
    },
    ...(priceId
      ? { price: priceId }
      : {
          price_data: {
            currency: (firstHeaderValue(env.STRIPE_RECHARGE_CURRENCY) ?? DEFAULT_CURRENCY).toLowerCase(),
            unit_amount: readPositiveInt(
              env.STRIPE_RECHARGE_UNIT_AMOUNT_CENTS,
              DEFAULT_UNIT_AMOUNT_CENTS
            ),
            product_data: {
              name: "DealInfo 积分",
            },
          },
        }),
  };

  return {
    mode: "payment",
    client_reference_id: userId,
    customer_email: email || undefined,
    line_items: [lineItem],
    locale: "auto",
    metadata: {
      kind: "points_recharge",
      userId,
      ...(visitorId ? { hy_vid: visitorId } : {}),
    },
    success_url: `${appOrigin}/?recharge=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appOrigin}/?recharge=cancelled`,
  };
}

export async function createRechargeCheckoutSession(input: RechargeCheckoutInput) {
  const session = await getStripe().checkout.sessions.create(buildRechargeCheckoutParams(input));
  if (!session.url) throw new Error("Stripe did not return a Checkout URL");
  return { id: session.id, url: session.url };
}

function normalizeOrigin(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return new URL(withProtocol).origin;
}

function firstHeaderValue(value: string | null | undefined): string | undefined {
  const first = value?.split(",")[0]?.trim();
  return first || undefined;
}

function readPositiveInt(value: string | undefined, fallback: number): number {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

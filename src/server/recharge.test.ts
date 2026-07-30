import { describe, expect, it } from "vitest";
import { buildRechargeCheckoutParams, resolveAppOrigin } from "./recharge";

describe("recharge checkout", () => {
  it("creates a one-point Stripe Checkout session that returns to the homepage", () => {
    const params = buildRechargeCheckoutParams({
      userId: "user_123",
      email: "me@example.com",
      origin: "https://dealinfo.example",
    });

    expect(params.client_reference_id).toBe("user_123");
    expect(params.customer_email).toBe("me@example.com");
    expect(params.success_url).toBe(
      "https://dealinfo.example/?recharge=success&session_id={CHECKOUT_SESSION_ID}"
    );
    expect(params.cancel_url).toBe("https://dealinfo.example/?recharge=cancelled");
    expect(params.mode).toBe("payment");
    expect(params.line_items).toHaveLength(1);
    expect(params.line_items?.[0]).toMatchObject({
      quantity: 1,
      adjustable_quantity: {
        enabled: true,
        minimum: 1,
        maximum: 1000,
      },
      price_data: {
        currency: "usd",
        unit_amount: 100,
        product_data: {
          name: "DealInfo 积分",
        },
      },
    });
  });

  it("can use a configured Stripe price id instead of inline price data", () => {
    const params = buildRechargeCheckoutParams({
      userId: "user_123",
      origin: "https://dealinfo.example",
      env: {
        STRIPE_RECHARGE_PRICE_ID: "price_123",
        STRIPE_RECHARGE_DEFAULT_QUANTITY: "3",
      },
    });

    expect(params.line_items?.[0]).toMatchObject({
      price: "price_123",
      quantity: 3,
    });
    expect(params.line_items?.[0]).not.toHaveProperty("price_data");
  });

  it("uses the configured public app origin before forwarded request headers", () => {
    const request = new Request("http://internal.local/api/stripe/checkout", {
      headers: {
        "x-forwarded-host": "wrong.example",
        "x-forwarded-proto": "https",
      },
    });

    expect(resolveAppOrigin(request, { NEXT_PUBLIC_APP_URL: "https://dealinfo.app/" })).toBe(
      "https://dealinfo.app"
    );
  });

  it("falls back to forwarded request headers for preview deployments", () => {
    const request = new Request("http://internal.local/api/stripe/checkout", {
      headers: {
        "x-forwarded-host": "preview.dealinfo.app",
        "x-forwarded-proto": "https",
      },
    });

    expect(resolveAppOrigin(request, {})).toBe("https://preview.dealinfo.app");
  });
});

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BrandLogo } from "@/components/BrandLogo";

describe("BrandLogo", () => {
  it("renders the DealInfo wordmark with the logo asset", () => {
    const html = renderToStaticMarkup(createElement(BrandLogo));

    expect(html).toContain(">Deal<span");
    expect(html).toContain("neon-text-glow");
    expect(html).toContain("Prediction Signal");
    expect(html).toContain("/dealinfo-mark.svg");
    expect(html).toContain("DealInfo probability pulse mark");
  });

  it("can render the compact mark without the wordmark", () => {
    const html = renderToStaticMarkup(createElement(BrandLogo, { compact: true }));

    expect(html).toContain("/dealinfo-mark.svg");
    expect(html).not.toContain(">Deal<span");
    expect(html).not.toContain("neon-text-glow");
    expect(html).not.toContain("Prediction Signal");
  });
});

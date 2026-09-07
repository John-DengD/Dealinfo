import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

describe("Google Ads head tag", () => {
  it("renders the raw Google Ads snippet once from the root layout head", () => {
    const layoutSource = readFileSync(
      path.join(rootDir, "src/app/layout.tsx"),
      "utf8"
    );

    expect(layoutSource).toContain("<head>");
    expect(layoutSource).toContain("<script async src={GOOGLE_ADS_SCRIPT_SRC}");
    expect(layoutSource).toContain(
      "dangerouslySetInnerHTML={{ __html: GOOGLE_ADS_INIT_SCRIPT }}"
    );
    expect(layoutSource).not.toContain('from "next/script"');
    expect(layoutSource).not.toContain("GoogleAdsHeadTag");
    expect(layoutSource).not.toContain("useServerInsertedHTML");
  });
});

describe("Google Tag Manager install", () => {
  it("renders the GTM script in head and noscript iframe at the start of body", () => {
    const layoutSource = readFileSync(
      path.join(rootDir, "src/app/layout.tsx"),
      "utf8"
    );

    expect(layoutSource).toContain(
      "dangerouslySetInnerHTML={{ __html: GOOGLE_TAG_MANAGER_INIT_SCRIPT }}"
    );
    expect(layoutSource).toContain("<noscript>");
    expect(layoutSource).toContain('src={GOOGLE_TAG_MANAGER_IFRAME_SRC}');
    expect(layoutSource.indexOf("<noscript>")).toBeLessThan(
      layoutSource.indexOf("<SiteHeader />")
    );
  });
});

import { describe, expect, it } from "vitest";
import {
  GOOGLE_ADS_ID,
  GOOGLE_ADS_SCRIPT_SRC,
  GOOGLE_ADS_INIT_SCRIPT,
} from "./google-ads";

describe("google ads tag", () => {
  it("uses the provided Google Ads account id", () => {
    expect(GOOGLE_ADS_ID).toBe("AW-17943630116");
    expect(GOOGLE_ADS_SCRIPT_SRC).toBe(
      "https://www.googletagmanager.com/gtag/js?id=AW-17943630116"
    );
    expect(GOOGLE_ADS_INIT_SCRIPT).toContain("window.dataLayer = window.dataLayer || [];");
    expect(GOOGLE_ADS_INIT_SCRIPT).toContain("gtag('config', 'AW-17943630116');");
  });
});

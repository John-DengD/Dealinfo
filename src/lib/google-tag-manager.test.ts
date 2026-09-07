import { describe, expect, it } from "vitest";
import {
  GOOGLE_TAG_MANAGER_ID,
  GOOGLE_TAG_MANAGER_IFRAME_SRC,
  GOOGLE_TAG_MANAGER_INIT_SCRIPT,
} from "./google-tag-manager";

describe("google tag manager", () => {
  it("uses the provided GTM container id", () => {
    expect(GOOGLE_TAG_MANAGER_ID).toBe("GTM-MBC5RW38");
    expect(GOOGLE_TAG_MANAGER_IFRAME_SRC).toBe(
      "https://www.googletagmanager.com/ns.html?id=GTM-MBC5RW38"
    );
    expect(GOOGLE_TAG_MANAGER_INIT_SCRIPT).toContain(
      "https://www.googletagmanager.com/gtm.js?id="
    );
    expect(GOOGLE_TAG_MANAGER_INIT_SCRIPT).toContain("'GTM-MBC5RW38'");
  });
});

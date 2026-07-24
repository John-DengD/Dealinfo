import { afterAll, describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { registerUser } from "./accounts";
import { cleanupTestData } from "./test-cleanup";

describe("registerUser", () => {
  afterAll(cleanupTestData);

  it("成功注册并发放初始 1000 积分", async () => {
    const tag = `reg_${Date.now()}`;
    const u = await registerUser({ username: tag, email: `${tag}@x.com`, password: "secret123" });
    expect(u.pointsBalance).toBe(1000);
    const stored = await db.user.findUnique({ where: { id: u.id } });
    expect(stored!.passwordHash).not.toBe("secret123"); // 已哈希
  });

  it("重复邮箱抛错", async () => {
    const tag = `dup_${Date.now()}`;
    await registerUser({ username: tag, email: `${tag}@x.com`, password: "secret123" });
    await expect(
      registerUser({ username: `${tag}_2`, email: `${tag}@x.com`, password: "secret123" })
    ).rejects.toThrow();
  });

  it("密码过短抛错", async () => {
    await expect(
      registerUser({ username: `short_${Date.now()}`, email: `s${Date.now()}@x.com`, password: "123" })
    ).rejects.toThrow();
  });
});

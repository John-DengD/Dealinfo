import { createXRay } from "@hellyeah/x-ray/server";

export const TRACKER_ID =
  process.env.HELLYEAH_TRACKER_ID || "019efdba-f2f0-7000-82fa-bd78eb65f951";

export const tracker = createXRay(TRACKER_ID, {
  env: process.env.HELLYEAH_TRACKER_ENV,
});

export { cv } from "@hellyeah/x-ray/server";

/**
 * 从 hy_attr cookie 解出浏览器访客 id,用于把服务端转化事件归因到广告点击。
 * cookie 值是 base64url 编码的 JSON,需解码后读取 vid。
 */
export async function visitorIdFromCookie(
  cookieStore: { get(name: string): { value: string } | undefined }
): Promise<string | undefined> {
  const raw = cookieStore.get("hy_attr")?.value;
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (parsed && typeof parsed.vid === "string") return parsed.vid;
  } catch {
    // cookie 格式异常时忽略,归因回退到其他机制
  }
  return undefined;
}

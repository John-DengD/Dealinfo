/**
 * 定时任务接口的鉴权:请求头 Authorization 必须携带 `Bearer <CRON_SECRET>`。
 * 未设置 CRON_SECRET 时,仅在非生产环境放行(方便本地开发)。
 */
export function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

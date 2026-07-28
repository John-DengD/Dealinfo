import { authorizeCron } from "@/lib/cron-auth";
import { runDailyHotMarketJob } from "@/server/hot-markets";

export const dynamic = "force-dynamic";

// 旧接口:服务器直接抓 Google News。仅在墙外(本地/手动)可用;
// 生产的定时任务改走 /plan + /run(见 scripts/hot-markets-runner.mjs)。
export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runDailyHotMarketJob();
  return Response.json(result);
}

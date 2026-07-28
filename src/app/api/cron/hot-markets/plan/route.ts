import { authorizeCron } from "@/lib/cron-auth";
import {
  HOT_MARKET_CATEGORIES,
  buildGoogleNewsRssUrl,
  buildResolveQuery,
  findDueHotMarkets,
} from "@/server/hot-markets";

export const dynamic = "force-dynamic";

// 返回 runner 需要抓取的 Google News URL 清单:
//  - generate: 10 个分类的热点 RSS(用于生成新市场)
//  - resolve : 每个到期待结算市场的搜索 RSS(用于自动判定)
export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const generate = HOT_MARKET_CATEGORIES.map((category) => ({
    category: category.category,
    url: buildGoogleNewsRssUrl(category.query),
  }));

  const dueMarkets = await findDueHotMarkets();
  const resolve = dueMarkets
    .map((market) => {
      const query = buildResolveQuery(market);
      return query ? { id: market.id, url: buildGoogleNewsRssUrl(query) } : null;
    })
    .filter((entry): entry is { id: string; url: string } => entry !== null);

  return Response.json({ generate, resolve });
}

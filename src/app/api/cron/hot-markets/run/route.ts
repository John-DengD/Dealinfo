import { authorizeCron } from "@/lib/cron-auth";
import {
  autoResolveDueHotMarkets,
  decideOutcomeFromItems,
  generateDailyHotMarkets,
  normalizeUrl,
  parseGoogleNewsXml,
  type HotNewsItem,
} from "@/server/hot-markets";

export const dynamic = "force-dynamic";

interface RunBody {
  generate?: Array<{ category: string; xml: string }>;
  resolve?: Array<{ id: string; xml: string }>;
  images?: Array<{ link: string; imageUrl: string }>;
}

// 接收 runner 从墙外抓来的原始 RSS XML,服务器解析后建市场 + 自动结算。
export async function POST(request: Request) {
  if (!authorizeCron(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RunBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const now = new Date();

  const itemsByCategory = new Map<string, HotNewsItem[]>();
  for (const entry of body.generate ?? []) {
    if (!entry?.category || typeof entry.xml !== "string") continue;
    itemsByCategory.set(entry.category, parseGoogleNewsXml(entry.xml));
  }

  const itemsByMarket = new Map<string, HotNewsItem[]>();
  for (const entry of body.resolve ?? []) {
    if (!entry?.id || typeof entry.xml !== "string") continue;
    itemsByMarket.set(entry.id, parseGoogleNewsXml(entry.xml));
  }

  // runner 抓来的 og:image,按归一化后的文章 URL 建索引
  const imageByUrl = new Map<string, string>();
  for (const entry of body.images ?? []) {
    if (!entry?.link || typeof entry.imageUrl !== "string" || !entry.imageUrl) continue;
    imageByUrl.set(normalizeUrl(entry.link), entry.imageUrl);
  }

  const errors: string[] = [];

  let generated: Awaited<ReturnType<typeof generateDailyHotMarkets>> = { created: 0, skipped: 0 };
  try {
    generated = await generateDailyHotMarkets({
      now,
      fetchItems: async (category) => itemsByCategory.get(category.category) ?? [],
      imageForUrl: (sourceUrl) => imageByUrl.get(sourceUrl) ?? null,
    });
  } catch (error) {
    errors.push(`generate: ${error instanceof Error ? error.message : String(error)}`);
  }

  let resolved: Awaited<ReturnType<typeof autoResolveDueHotMarkets>> = { resolved: 0, skipped: 0 };
  try {
    resolved = await autoResolveDueHotMarkets({
      now,
      decideOutcome: async (market) => decideOutcomeFromItems(market, itemsByMarket.get(market.id) ?? []),
    });
  } catch (error) {
    errors.push(`resolve: ${error instanceof Error ? error.message : String(error)}`);
  }

  return Response.json({ generated, resolved, errors });
}

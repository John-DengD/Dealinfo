import { db } from "@/lib/db";
import { resolveMarket } from "./trading";

export interface HotMarketCategory {
  category: string;
  query: string;
}

export interface HotNewsItem {
  title: string;
  url: string;
  sourceName: string;
  publishedAt?: Date | null;
  snippet?: string | null;
}

export interface GenerateHotMarketsOptions {
  now?: Date;
  generatedBy?: string;
  fetchItems?: (category: HotMarketCategory) => Promise<HotNewsItem[]>;
}

export interface AutoResolveOptions {
  now?: Date;
  generatedBy?: string;
  decideOutcome?: (market: AutoResolvableMarket) => Promise<"YES" | "NO" | null>;
}

export interface AutoResolvableMarket {
  id: string;
  title: string;
  description: string;
  category: string;
  sourceUrl: string | null;
  sourceName: string | null;
}

export const HOT_MARKET_CATEGORIES: HotMarketCategory[] = [
  { category: "体育", query: "体育 热点 赛事 夺冠 转会 伤病" },
  { category: "科技", query: "科技 热点 AI 芯片 手机 产品发布" },
  { category: "娱乐明星", query: "娱乐 明星 电影 音乐 综艺 热点" },
  { category: "财经", query: "财经 热点 股票 利率 财报 IPO" },
  { category: "国际", query: "国际 热点 外交 冲突 选举 协议" },
  { category: "政治", query: "政治 热点 政策 选举 法案 民调" },
  { category: "健康", query: "健康 热点 医药 疫情 FDA 临床" },
  { category: "科学", query: "科学 热点 航天 气候 物理 生物" },
  { category: "游戏电竞", query: "游戏 电竞 热点 发布 比赛 战队" },
  { category: "加密/Web3", query: "加密 Web3 热点 比特币 以太坊 ETF" },
];

const DEFAULT_GENERATOR = "daily_hot_markets";
const MARKET_DURATION_DAYS = 7;
const MAX_MARKETS_PER_CATEGORY = 10;
const AUTO_RESOLVE_CONCURRENCY = 6;

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeUrl(url: string) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.searchParams.delete("utm_source");
    parsed.searchParams.delete("utm_medium");
    parsed.searchParams.delete("utm_campaign");
    return parsed.toString();
  } catch {
    return url.trim();
  }
}

function buildMarketTitle(item: HotNewsItem) {
  const cleanTitle = stripHtml(item.title).replace(/[?？。.!！]+$/g, "");
  return `${cleanTitle} 是否会出现官方确认或重大后续?`;
}

function buildMarketDescription(item: HotNewsItem, category: string) {
  const lines = [
    `热点领域: ${category}`,
    `来源: ${item.sourceName}`,
    `链接: ${item.url}`,
    "",
    "结算规则:",
    "若该热点在市场截止前出现官方公告、主流媒体确认、赛事/机构正式结果或可核验的重大后续,判定 Yes。",
    "若截止时没有可靠来源确认,或原消息被澄清/否认/未发生重大后续,判定 No。",
  ];
  if (item.snippet) lines.splice(3, 0, `摘要: ${stripHtml(item.snippet)}`);
  return lines.join("\n");
}

async function getHotMarketCreatorId() {
  const existingAdmin = await db.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (existingAdmin) return existingAdmin.id;

  const bot = await db.user.upsert({
    where: { email: "hotbot@dealinfo.dev" },
    update: { role: "ADMIN" },
    create: {
      username: "hotbot",
      email: "hotbot@dealinfo.dev",
      passwordHash: "system",
      role: "ADMIN",
      pointsBalance: 0,
    },
    select: { id: true },
  });
  return bot.id;
}

export async function fetchGoogleNewsRss(category: HotMarketCategory): Promise<HotNewsItem[]> {
  const url = new URL("https://news.google.com/rss/search");
  url.searchParams.set("q", `${category.query} when:1d`);
  url.searchParams.set("hl", "zh-CN");
  url.searchParams.set("gl", "CN");
  url.searchParams.set("ceid", "CN:zh-Hans");

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`抓取 ${category.category} 热点失败: ${res.status}`);
  const xml = await res.text();

  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => {
    const itemXml = match[1];
    const title = stripHtml(itemXml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/)?.[1] ?? itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
    const link = stripHtml(itemXml.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? "");
    const sourceName = stripHtml(itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] ?? "Google News");
    const pubDate = stripHtml(itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? "");
    const description = stripHtml(
      itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/)?.[1] ?? "",
    );
    return {
      title,
      url: normalizeUrl(link),
      sourceName,
      publishedAt: pubDate ? new Date(pubDate) : null,
      snippet: description,
    };
  }).filter((item) => item.title.length >= 6 && item.url.startsWith("http"));
}

export async function generateDailyHotMarkets(options: GenerateHotMarketsOptions = {}) {
  const now = options.now ?? new Date();
  const generatedBy = options.generatedBy ?? DEFAULT_GENERATOR;
  const generationDate = startOfUtcDay(now);
  const fetchItems = options.fetchItems ?? fetchGoogleNewsRss;
  const creatorId = await getHotMarketCreatorId();
  let skipped = 0;
  const candidates: Array<{
    title: string;
    description: string;
    category: string;
    status: "OPEN";
    creatorId: string;
    closesAt: Date;
    liquidityB: number;
    sourceUrl: string;
    sourceName: string;
    sourcePublishedAt: Date | null;
    generatedBy: string;
    generationDate: Date;
  }> = [];
  const seenSourceUrls = new Set<string>();

  for (const category of HOT_MARKET_CATEGORIES) {
    const items = await fetchItems(category);
    for (const item of items.slice(0, MAX_MARKETS_PER_CATEGORY)) {
      const sourceUrl = normalizeUrl(item.url);
      if (seenSourceUrls.has(sourceUrl)) {
        skipped += 1;
        continue;
      }
      seenSourceUrls.add(sourceUrl);
      candidates.push({
        title: buildMarketTitle(item),
        description: buildMarketDescription({ ...item, url: sourceUrl }, category.category),
        category: category.category,
        status: "OPEN",
        creatorId,
        closesAt: new Date(now.getTime() + MARKET_DURATION_DAYS * 86400000),
        liquidityB: 100,
        sourceUrl,
        sourceName: item.sourceName,
        sourcePublishedAt: item.publishedAt ?? null,
        generatedBy,
        generationDate,
      });
    }
    skipped += Math.max(items.length - MAX_MARKETS_PER_CATEGORY, 0);
  }

  if (candidates.length === 0) return { created: 0, skipped };

  const existing = await db.market.findMany({
    where: { sourceUrl: { in: candidates.map((candidate) => candidate.sourceUrl) } },
    select: { sourceUrl: true },
  });
  const existingUrls = new Set(existing.map((market) => market.sourceUrl).filter((url): url is string => Boolean(url)));
  const newMarkets = candidates.filter((candidate) => !existingUrls.has(candidate.sourceUrl));
  skipped += candidates.length - newMarkets.length;

  if (newMarkets.length === 0) return { created: 0, skipped };

  const result = await db.market.createMany({ data: newMarkets });
  return { created: result.count, skipped: skipped + newMarkets.length - result.count };
}

function getCoreTerms(market: AutoResolvableMarket) {
  return market.title
    .replace("是否会出现官方确认或重大后续?", "")
    .split(/[\s,，。:：;；!?！？、"'“”‘’()[\]【】]+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2)
    .slice(0, 8);
}

export async function decideOutcomeFromNews(market: AutoResolvableMarket): Promise<"YES" | "NO" | null> {
  const terms = getCoreTerms(market);
  if (terms.length === 0) return null;
  const query = `${terms.slice(0, 5).join(" ")} 确认 官方 结果 后续`;
  const items = await fetchGoogleNewsRss({ category: market.category, query }).catch(() => []);
  const haystack = items.map((item) => `${item.title} ${item.snippet ?? ""}`).join(" ");
  const matchedTerms = terms.filter((term) => haystack.includes(term));
  const hasConfirmation = /确认|宣布|官方|结果|获批|通过|夺冠|签约|发布|上线|达成|发生|完成/.test(haystack);
  const hasDenial = /否认|辟谣|澄清|取消|推迟|失败|未能|不会|没有/.test(haystack);
  if (matchedTerms.length >= Math.min(3, terms.length) && hasConfirmation && !hasDenial) return "YES";
  if (matchedTerms.length >= Math.min(3, terms.length) && hasDenial && !hasConfirmation) return "NO";
  return null;
}

export async function autoResolveDueHotMarkets(options: AutoResolveOptions = {}) {
  const now = options.now ?? new Date();
  const generatedBy = options.generatedBy ?? DEFAULT_GENERATOR;
  const decideOutcome = options.decideOutcome ?? decideOutcomeFromNews;
  const markets = await db.market.findMany({
    where: {
      status: "OPEN",
      generatedBy,
      closesAt: { lte: now },
      resolution: null,
    },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      sourceUrl: true,
      sourceName: true,
    },
  });

  const results: Array<"resolved" | "skipped"> = [];
  for (let i = 0; i < markets.length; i += AUTO_RESOLVE_CONCURRENCY) {
    const chunk = markets.slice(i, i + AUTO_RESOLVE_CONCURRENCY);
    const chunkResults = await Promise.all(chunk.map(async (market) => {
      const outcome = await decideOutcome(market);
      if (!outcome) return "skipped" as const;
      await resolveMarket(market.id, outcome, `自动结算: 新闻证据判定为 ${outcome}`);
      return "resolved" as const;
    }));
    results.push(...chunkResults);
  }

  return {
    resolved: results.filter((result) => result === "resolved").length,
    skipped: results.filter((result) => result === "skipped").length,
  };
}

export async function runDailyHotMarketJob(options: GenerateHotMarketsOptions & AutoResolveOptions = {}) {
  const now = options.now ?? new Date();
  const [generated, resolved] = await Promise.all([
    generateDailyHotMarkets({ ...options, now }),
    autoResolveDueHotMarkets({ ...options, now }),
  ]);
  return { generated, resolved };
}

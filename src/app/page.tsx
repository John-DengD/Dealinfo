import Link from "next/link";
import { listFeed, listCategories, listHotFeed } from "@/server/markets";
import { MarketCard } from "@/components/MarketCard";
import { EventCard } from "@/components/EventCard";
import { CategoryNav } from "@/components/CategoryNav";
import { HotCarousel } from "@/components/HotCarousel";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string }>;
}) {
  const { cat, q } = await searchParams;
  const active = cat ?? "全部";
  const filtering = active !== "全部" || Boolean(q);

  const [feed, categories, hot] = await Promise.all([
    listFeed(active, q),
    listCategories(),
    listHotFeed(5),
  ]);

  return (
    <div className="neon-page mx-auto max-w-7xl px-4 py-6">
      <div className="sticky top-16 z-30 -mx-4 mb-6 border-b border-primary/15 bg-background/55 px-4 py-3 backdrop-blur-xl">
        <CategoryNav categories={categories} active={active} />
      </div>

      {/* 默认视图才显示"全局最热"轮播;搜索/分类过滤时收起,直接看结果 */}
      {!filtering && <HotCarousel items={hot} />}

      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h1 className="text-xl font-black sm:text-2xl">
          {q ? `搜索:“${q}”` : active === "全部" ? "全部市场" : active}
        </h1>
        <span className="shrink-0 text-xs text-muted-foreground">{feed.length} 个进行中</span>
      </div>

      {feed.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-primary/40 bg-card/45 py-20 text-center text-muted-foreground">
          <p>没有匹配的市场。</p>
          <Link href="/propose" className="mt-2 inline-block text-primary hover:underline">
            提议一个新市场 →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {feed.map((item, i) => (
            <div key={item.kind === "event" ? `e-${item.event.id}` : `m-${item.market.id}`} className="animate-fade-up" style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}>
              {item.kind === "event" ? <EventCard event={item.event} /> : <MarketCard market={item.market} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

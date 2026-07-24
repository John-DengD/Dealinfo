import Link from "next/link";
import { Activity, RadioTower, Sparkles, TrendingUp } from "lucide-react";
import { listOpenMarkets, listCategories } from "@/server/markets";
import { MarketCard } from "@/components/MarketCard";
import { CategoryNav } from "@/components/CategoryNav";
import { NeonSurface } from "@/components/NeonLiquid";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string }>;
}) {
  const { cat, q } = await searchParams;
  const active = cat ?? "全部";
  const [markets, categories] = await Promise.all([
    listOpenMarkets(active, q),
    listCategories(),
  ]);
  const totalTrades = markets.reduce((sum, market) => sum + market.tradeCount, 0);
  const totalInfoCards = markets.reduce((sum, market) => sum + market.infoCardCount, 0);
  const hotMarket = markets[0];
  const yesAverage = markets.length
    ? Math.round((markets.reduce((sum, market) => sum + market.probYes, 0) / markets.length) * 100)
    : 0;

  return (
    <div className="neon-page mx-auto max-w-7xl px-4 py-6">
      <div className="sticky top-16 z-30 -mx-4 mb-6 border-b border-primary/15 bg-background/55 px-4 py-3 backdrop-blur-xl">
        <CategoryNav categories={categories} active={active} />
      </div>

      <NeonSurface className="mb-6 rounded-3xl p-5 sm:p-6">
        <div className="relative z-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase text-primary">
              <RadioTower className="h-4 w-4" />
              Live Market Intelligence
            </div>
            <h1 className="text-3xl font-black leading-tight tracking-normal sm:text-5xl">
              {q ? `搜索:“${q}”` : active === "全部" ? "热门市场" : active}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              {markets.length} 个进行中的市场 · {totalTrades.toLocaleString()} 笔交易 · {totalInfoCards.toLocaleString()} 条社区个人推荐
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-[28rem]">
            <div className="rounded-2xl border border-border/70 bg-background/45 p-3">
              <Activity className="mb-3 h-4 w-4 text-primary" />
              <div className="num text-2xl font-black">{totalTrades.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">交易信号</div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/45 p-3">
              <Sparkles className="mb-3 h-4 w-4 text-yes" />
              <div className="num text-2xl font-black">{totalInfoCards.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">推荐</div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/45 p-3">
              <TrendingUp className="mb-3 h-4 w-4 text-chart-5" />
              <div className="num text-2xl font-black">{yesAverage}%</div>
              <div className="text-xs text-muted-foreground">Yes 均值</div>
            </div>
          </div>
        </div>
        {hotMarket && (
          <div className="relative z-10 mt-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-yes/30 bg-yes/10 px-3 py-1 text-yes">热度最高</span>
            <Link href={`/market/${hotMarket.id}`} className="hover:text-primary">
              {hotMarket.title}
            </Link>
          </div>
        )}
      </NeonSurface>

      {markets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-primary/40 bg-card/45 py-20 text-center text-muted-foreground">
          <p>没有匹配的市场。</p>
          <Link href="/propose" className="mt-2 inline-block text-primary hover:underline">
            提议一个新市场 →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {markets.map((m, i) => (
            <div key={m.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}>
              <MarketCard market={m} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

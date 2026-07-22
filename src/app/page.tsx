import Link from "next/link";
import { listOpenMarkets, listCategories } from "@/server/markets";
import { MarketCard } from "@/components/MarketCard";
import { CategoryNav } from "@/components/CategoryNav";

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="sticky top-14 z-30 -mx-4 mb-6 border-b border-border/50 glass px-4 py-3">
        <CategoryNav categories={categories} active={active} />
      </div>

      <div className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold">
            {q ? `搜索:“${q}”` : active === "全部" ? "热门市场" : active}
          </h1>
          <p className="text-sm text-muted-foreground">
            {markets.length} 个进行中的市场 · 交易概率,查看社区个人推荐
          </p>
        </div>
      </div>

      {markets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-20 text-center text-muted-foreground">
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

import Link from "next/link";
import { listOpenMarkets, listCategories } from "@/server/markets";
import { MarketCard } from "@/components/MarketCard";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const active = cat ?? "全部";
  const [markets, categories] = await Promise.all([
    listOpenMarkets(active),
    listCategories(),
  ]);
  const tabs = ["全部", ...categories];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">预测市场</h1>
        <p className="text-sm text-muted-foreground">
          用虚拟积分交易事件概率,并查看来自其他用户的个人推荐信息。
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t}
            href={t === "全部" ? "/" : `/?cat=${encodeURIComponent(t)}`}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              active === t
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            {t}
          </Link>
        ))}
      </div>

      {markets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
          <p>该分类下暂无进行中的市场。</p>
          <Link href="/propose" className="mt-2 inline-block text-primary hover:underline">
            提议一个新市场 →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {markets.map((m) => (
            <MarketCard key={m.id} market={m} />
          ))}
        </div>
      )}
    </div>
  );
}

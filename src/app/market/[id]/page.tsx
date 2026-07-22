import { notFound } from "next/navigation";
import { getMarket } from "@/server/markets";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { priceYes } from "@/lib/amm";
import { MarketChart } from "@/components/MarketChart";
import { TradePanel } from "@/components/TradePanel";
import { MarketTabs } from "@/components/MarketTabs";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; cls: string }> = {
  OPEN: { label: "进行中", cls: "bg-yes/15 text-yes" },
  CLOSED: { label: "已截止", cls: "bg-secondary text-muted-foreground" },
  RESOLVED: { label: "已结算", cls: "bg-primary/15 text-primary" },
  PENDING: { label: "待审核", cls: "bg-secondary text-muted-foreground" },
  REJECTED: { label: "已拒绝", cls: "bg-no/15 text-no" },
};

export default async function MarketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const market = await getMarket(id);
  if (!market) notFound();

  const session = await auth();
  const userId = session?.user?.id;
  const position = userId
    ? await db.position.findUnique({ where: { userId_marketId: { userId, marketId: id } } })
    : null;

  const tradeable = market.status === "OPEN" && market.closesAt > new Date();
  const st = STATUS[market.status] ?? { label: market.status, cls: "bg-secondary" };

  const chartPoints = [
    { t: market.createdAt.getTime(), p: 0.5 },
    ...market.trades.map((tr) => ({ t: tr.createdAt.getTime(), p: tr.probAfter })),
  ];
  const activity = [...market.trades]
    .reverse()
    .map((tr) => ({
      id: tr.id,
      userName: tr.user.username,
      side: tr.side as "YES" | "NO",
      action: tr.action,
      shares: tr.shares,
      costPoints: tr.costPoints,
      createdAt: tr.createdAt.toISOString(),
    }));
  const holders = market.positions.map((p) => ({
    userName: p.user.username,
    yesShares: p.yesShares,
    noShares: p.noShares,
  }));
  const cards = market.infoCards.map((c) => ({
    id: c.id,
    stance: c.stance,
    headline: c.headline,
    body: c.body,
    sourceUrl: c.sourceUrl,
    sourceTitle: c.sourceTitle,
    score: c.score,
    createdAt: c.createdAt.toISOString(),
    authorName: c.author.username,
    authorAvatar: c.author.avatarUrl,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* 标题区 */}
      <div className="mb-5 flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/25 to-yes/20 text-lg font-bold">
          {market.category.slice(0, 1)}
        </div>
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-xs">
            <span className="rounded bg-secondary px-2 py-0.5">{market.category}</span>
            <span className={`rounded px-2 py-0.5 font-medium ${st.cls}`}>{st.label}</span>
            <span className="text-muted-foreground">截止 {market.closesAt.toLocaleDateString("zh-CN")}</span>
          </div>
          <h1 className="text-xl font-bold leading-snug sm:text-2xl">{market.title}</h1>
          <p className="mt-1 text-xs text-muted-foreground">由 @{market.creator.username} 创建</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 主区 */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-4">
            <MarketChart points={chartPoints} now={Date.now()} />
          </Card>

          {market.status === "RESOLVED" && (
            <Card className="border-primary/40 bg-primary/5 p-4">
              <p className="text-sm">
                该市场已结算,结果为{" "}
                <span className={`font-bold ${market.resolution === "YES" ? "text-yes" : "text-no"}`}>
                  {market.resolution}
                </span>
                。持仓已按结果兑付。
              </p>
            </Card>
          )}

          <MarketTabs
            marketId={market.id}
            cards={cards}
            activity={activity}
            holders={holders}
            description={market.description}
            loggedIn={!!userId}
          />
        </div>

        {/* 侧栏 */}
        <div className="space-y-4">
          <div className="lg:sticky lg:top-20">
            <TradePanel marketId={market.id} probYes={market.probYes} tradeable={tradeable} loggedIn={!!userId} />

            {position && (position.yesShares > 0 || position.noShares > 0) && (
              <Card className="mt-4 p-4">
                <h3 className="mb-2 text-sm font-semibold">我的持仓</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-yes">Yes 份额</span>
                    <span className="num">{position.yesShares.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-no">No 份额</span>
                    <span className="num">{position.noShares.toFixed(1)}</span>
                  </div>
                  <div className="mt-2 flex justify-between border-t border-border pt-2 text-muted-foreground">
                    <span>当前市值</span>
                    <span className="num">
                      {(position.yesShares * market.probYes + position.noShares * (1 - market.probYes)).toFixed(1)} 积分
                    </span>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

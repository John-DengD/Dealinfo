import { notFound } from "next/navigation";
import { getMarket } from "@/server/markets";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MarketChart } from "@/components/MarketChart";
import { TradePanel } from "@/components/TradePanel";
import { MarketTabs } from "@/components/MarketTabs";
import { NeonLiquid, NeonSurface } from "@/components/NeonLiquid";
import { getMarketDisplay } from "@/lib/market-display";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; cls: string }> = {
  OPEN: { label: "进行中", cls: "bg-yes/15 text-yes" },
  CLOSED: { label: "已截止", cls: "bg-secondary text-muted-foreground" },
  RESOLVED: { label: "已结算", cls: "bg-primary/15 text-primary" },
  PENDING: { label: "待审核", cls: "bg-secondary text-muted-foreground" },
  REJECTED: { label: "已拒绝", cls: "bg-no/15 text-no" },
  CANCELED: { label: "已下线", cls: "bg-no/15 text-no" },
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
  const display = getMarketDisplay(market.probYes);

  const chartPoints = [
    { t: market.createdAt.getTime(), p: 0.5 },
    ...market.trades.map((tr) => ({ t: tr.createdAt.getTime(), p: tr.probAfter })),
  ];
  const chartNow = chartPoints[chartPoints.length - 1]?.t ?? market.createdAt.getTime();
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
    <div className="neon-page mx-auto max-w-7xl px-4 py-6">
      <NeonSurface className="mb-6 rounded-3xl p-5 sm:p-6">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="neon-button grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-lg font-black">
              {market.category.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full border border-border/70 bg-secondary/50 px-2.5 py-1">{market.category}</span>
                <span className={`rounded-full px-2.5 py-1 font-bold ${st.cls}`}>{st.label}</span>
                <span className="text-muted-foreground">截止 {market.closesAt.toLocaleDateString("zh-CN")}</span>
              </div>
              <h1 className="max-w-4xl text-2xl font-black leading-snug tracking-normal sm:text-4xl">{market.title}</h1>
              <p className="mt-2 text-xs text-muted-foreground">由 @{market.creator.username} 创建 · 社区推荐实时汇入交易判断</p>
            </div>
          </div>
          <div className="grid min-w-48 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-border/70 bg-background/45 p-3">
              <div className="text-xs text-muted-foreground">Yes 概率</div>
              <div className={`num neon-text-glow mt-1 text-3xl font-black ${display.tone === "no" ? "text-no" : "text-yes"}`}>
                {display.probabilityPercent}%
              </div>
            </div>
            <div className="rounded-2xl border border-yes/30 bg-yes/10 p-3">
              <div className="text-xs text-muted-foreground">Yes 报价</div>
              <div className="num mt-1 text-xl font-black text-yes">{display.yesPrice}¢</div>
            </div>
            <div className="rounded-2xl border border-no/30 bg-no/10 p-3">
              <div className="text-xs text-muted-foreground">No 报价</div>
              <div className="num mt-1 text-xl font-black text-no">{display.noPrice}¢</div>
            </div>
          </div>
        </div>
      </NeonSurface>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <NeonLiquid tone={display.tone} strength="terminal" className="rounded-3xl p-4">
            <MarketChart points={chartPoints} now={chartNow} />
          </NeonLiquid>

          {market.status === "RESOLVED" && (
            <NeonSurface className="rounded-2xl border-primary/40 bg-primary/5 p-4">
              <p className="text-sm">
                该市场已结算,结果为{" "}
                <span className={`font-bold ${market.resolution === "YES" ? "text-yes" : "text-no"}`}>
                  {market.resolution}
                </span>
                。持仓已按结果兑付。
              </p>
            </NeonSurface>
          )}

          {market.status === "CANCELED" && (
            <NeonSurface className="rounded-2xl border-no/40 bg-no/5 p-4">
              <p className="text-sm">
                该市场已下线,相关交易已退款。原因:{" "}
                <span className="font-bold text-no">{market.cancelReason ?? "admin_removed"}</span>
              </p>
            </NeonSurface>
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

        <div className="space-y-4">
          <div className="lg:sticky lg:top-20">
            <TradePanel marketId={market.id} probYes={market.probYes} tradeable={tradeable} loggedIn={!!userId} />

            {position && (position.yesShares > 0 || position.noShares > 0) && (
              <NeonSurface className="mt-4 rounded-3xl p-4">
                <h3 className="relative z-10 mb-3 text-sm font-black">我的持仓</h3>
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
              </NeonSurface>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import { getMarket } from "@/server/markets";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { priceYes } from "@/lib/amm";
import { ProbabilityChart } from "@/components/ProbabilityChart";
import { TradePanel } from "@/components/TradePanel";
import { InfoCardsSection } from "@/components/InfoCardsSection";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  OPEN: "进行中",
  CLOSED: "已截止",
  RESOLVED: "已结算",
  PENDING: "待审核",
  REJECTED: "已拒绝",
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
  const pct = Math.round(market.probYes * 100);
  const chartPoints = [
    { t: "", p: 0.5 },
    ...market.trades.map((tr) => ({ t: tr.createdAt.toISOString(), p: tr.probAfter })),
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 主区 */}
        <div className="space-y-6 lg:col-span-2">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs">
              <span className="rounded bg-secondary px-2 py-0.5">{market.category}</span>
              <span className="text-muted-foreground">{STATUS_LABEL[market.status] ?? market.status}</span>
            </div>
            <h1 className="text-2xl font-bold">{market.title}</h1>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`font-mono text-4xl font-bold ${market.probYes >= 0.5 ? "text-yes" : "text-no"}`}>
                {pct}%
              </span>
              <span className="text-sm text-muted-foreground">当前 Yes 概率</span>
            </div>
          </div>

          <Card className="p-4">
            <ProbabilityChart points={chartPoints} />
          </Card>

          {market.description && (
            <Card className="p-4">
              <h2 className="mb-2 text-sm font-semibold">市场说明</h2>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{market.description}</p>
            </Card>
          )}

          {market.status === "RESOLVED" && (
            <Card className="border-primary/40 p-4">
              <p className="text-sm">
                该市场已结算,结果为{" "}
                <span className={market.resolution === "YES" ? "text-yes" : "text-no"}>
                  {market.resolution}
                </span>
                。
              </p>
            </Card>
          )}

          <InfoCardsSection
            marketId={market.id}
            cards={market.infoCards.map((c) => ({
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
            }))}
            loggedIn={!!userId}
          />
        </div>

        {/* 侧栏:交易 + 持仓 */}
        <div className="space-y-4">
          <TradePanel
            marketId={market.id}
            probYes={market.probYes}
            tradeable={tradeable}
            loggedIn={!!userId}
          />

          {position && (position.yesShares > 0 || position.noShares > 0) && (
            <Card className="p-4">
              <h3 className="mb-2 text-sm font-semibold">我的持仓</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-yes">Yes 份额</span>
                  <span className="font-mono">{position.yesShares.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-no">No 份额</span>
                  <span className="font-mono">{position.noShares.toFixed(1)}</span>
                </div>
                <div className="mt-2 flex justify-between border-t border-border pt-2 text-muted-foreground">
                  <span>当前市值</span>
                  <span className="font-mono">
                    {(
                      position.yesShares * market.probYes +
                      position.noShares * priceYes({ qYes: market.qNo, qNo: market.qYes, b: market.liquidityB })
                    ).toFixed(1)}{" "}
                    积分
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

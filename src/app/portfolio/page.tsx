import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { priceYes } from "@/lib/amm";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const [user, positions, trades] = await Promise.all([
    db.user.findUnique({ where: { id: userId } }),
    db.position.findMany({
      where: { userId, OR: [{ yesShares: { gt: 0 } }, { noShares: { gt: 0 } }] },
      include: { market: true },
    }),
    db.trade.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { market: { select: { title: true, id: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">我的资产</h1>
      <div className="mb-8 flex items-baseline gap-2">
        <span className="font-mono text-3xl font-bold text-primary">
          {Math.round(user?.pointsBalance ?? 0).toLocaleString()}
        </span>
        <span className="text-sm text-muted-foreground">可用积分</span>
      </div>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">当前持仓</h2>
        {positions.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无持仓。</p>
        ) : (
          <div className="space-y-2">
            {positions.map((p) => {
              const yes = priceYes({ qYes: p.market.qYes, qNo: p.market.qNo, b: p.market.liquidityB });
              const value = p.yesShares * yes + p.noShares * (1 - yes);
              return (
                <Card key={p.id} className="flex items-center justify-between p-3">
                  <Link href={`/market/${p.marketId}`} className="text-sm font-medium hover:text-primary">
                    {p.market.title}
                  </Link>
                  <div className="flex items-center gap-4 text-sm">
                    {p.yesShares > 0 && <span className="text-yes">Yes {p.yesShares.toFixed(1)}</span>}
                    {p.noShares > 0 && <span className="text-no">No {p.noShares.toFixed(1)}</span>}
                    <span className="font-mono text-muted-foreground">≈{value.toFixed(1)} 积分</span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">交易记录</h2>
        {trades.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无交易。</p>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border">
            {trades.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs ${
                      t.action === "BUY" ? "bg-secondary" : "bg-secondary"
                    } ${t.side === "YES" ? "text-yes" : "text-no"}`}
                  >
                    {t.action === "BUY" ? "买入" : "卖出"} {t.side}
                  </span>
                  <Link href={`/market/${t.market.id}`} className="text-muted-foreground hover:text-foreground">
                    {t.market.title}
                  </Link>
                </div>
                <div className="flex items-center gap-4 font-mono text-xs text-muted-foreground">
                  <span>{t.shares.toFixed(1)} 份</span>
                  <span>{t.costPoints.toFixed(1)} 积分</span>
                  <span>{t.createdAt.toLocaleDateString("zh-CN")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

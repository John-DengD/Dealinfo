import { notFound } from "next/navigation";
import Link from "next/link";
import { getEvent } from "@/server/events";
import { auth } from "@/lib/auth";
import { TradePanel } from "@/components/TradePanel";
import { NeonSurface } from "@/components/NeonLiquid";
import { getMarketDisplay } from "@/lib/market-display";

export const dynamic = "force-dynamic";

function toneColor(tone: "yes" | "no" | "neutral") {
  return tone === "yes" ? "var(--yes)" : tone === "no" ? "var(--no)" : "var(--primary)";
}

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const session = await auth();
  const loggedIn = Boolean(session?.user?.id);
  const tradeable = event.status === "OPEN" && event.closesAt > new Date();
  const winner = event.outcomes.find((o) => o.resolution === "YES");

  return (
    <div className="neon-page mx-auto max-w-5xl px-4 py-6">
      <NeonSurface className="mb-6 rounded-3xl p-5 sm:p-6">
        <div className="relative z-10">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-border/70 bg-secondary/50 px-2.5 py-1">{event.category}</span>
            <span className="rounded-full bg-primary/15 px-2.5 py-1 font-bold text-primary">多结果事件</span>
            <span className="text-muted-foreground">截止 {event.closesAt.toLocaleDateString("zh-CN")}</span>
          </div>
          <h1 className="max-w-4xl text-2xl font-black leading-snug tracking-normal sm:text-4xl">{event.title}</h1>
          <p className="mt-2 text-xs text-muted-foreground">
            由 @{event.creatorName} 创建 · {event.outcomes.length} 个结果 · 每个结果独立买卖 Yes/No
          </p>
          {event.description && (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{event.description}</p>
          )}
        </div>
      </NeonSurface>

      {event.status === "RESOLVED" && (
        <NeonSurface className="mb-6 rounded-2xl border-primary/40 bg-primary/5 p-4 text-sm">
          该事件已结算,获胜结果为 <span className="font-bold text-yes">{winner?.label ?? "—"}</span>。持仓已按结果兑付。
        </NeonSurface>
      )}

      <div className="space-y-3">
        {event.outcomes.map((o) => {
          const d = getMarketDisplay(o.probYes);
          return (
            <div key={o.marketId} className="rounded-2xl border border-border/70 bg-background/40 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <Link href={`/market/${o.marketId}`} className="text-[15px] font-black hover:text-primary">
                  {o.label}
                  {o.resolution && (
                    <span className={`ml-2 text-xs ${o.resolution === "YES" ? "text-yes" : "text-no"}`}>
                      {o.resolution === "YES" ? "✓ 命中" : "✗ 未中"}
                    </span>
                  )}
                </Link>
                <span className="num text-xl font-black" style={{ color: toneColor(d.tone) }}>
                  {d.probabilityPercent}%
                </span>
              </div>
              <TradePanel
                marketId={o.marketId}
                probYes={o.probYes}
                tradeable={tradeable && o.status === "OPEN"}
                loggedIn={loggedIn}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

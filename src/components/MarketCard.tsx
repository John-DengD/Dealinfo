import Link from "next/link";
import type { MarketSummary } from "@/server/markets";
import { getMarketDisplay } from "@/lib/market-display";

function Thumb({ imageUrl, label }: { imageUrl: string | null; label: string }) {
  if (imageUrl) {
    return (
      <div
        className="h-10 w-10 shrink-0 rounded-md border border-border bg-muted bg-cover bg-center"
        style={{ backgroundImage: `url(${imageUrl})` }}
        role="img"
        aria-label={label}
      />
    );
  }
  return (
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border bg-muted text-sm font-bold text-muted-foreground">
      {label.slice(0, 1)}
    </div>
  );
}

export function MarketCard({ market }: { market: MarketSummary }) {
  const d = getMarketDisplay(market.probYes);
  const pctColor = d.tone === "yes" ? "text-yes" : d.tone === "no" ? "text-no" : "text-foreground";

  return (
    <Link
      href={`/market/${market.id}`}
      className="group flex h-full flex-col gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/50"
    >
      <div className="flex items-start gap-2.5">
        <Thumb imageUrl={market.imageUrl} label={market.category} />
        <h3 className="line-clamp-3 flex-1 text-sm font-medium leading-snug text-foreground group-hover:text-primary">
          {market.title}
        </h3>
        <div className="shrink-0 text-right">
          <div className={`num text-lg font-bold leading-none ${pctColor}`}>{d.probabilityPercent}%</div>
          <div className="mt-0.5 text-[10px] text-muted-foreground">几率</div>
        </div>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2">
        <span className="flex items-center justify-center gap-1 rounded-md bg-yes/15 py-1.5 text-xs font-semibold text-yes">
          Yes {d.yesPrice}¢
        </span>
        <span className="flex items-center justify-center gap-1 rounded-md bg-no/15 py-1.5 text-xs font-semibold text-no">
          No {d.noPrice}¢
        </span>
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{market.tradeCount} 笔 · {market.infoCardCount} 讨论</span>
        <span>截止 {market.closesAt.toLocaleDateString("zh-CN")}</span>
      </div>
    </Link>
  );
}

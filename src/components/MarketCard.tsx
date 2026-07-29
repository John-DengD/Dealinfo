import Link from "next/link";
import { MessageSquare, TrendingUp } from "lucide-react";
import type { MarketSummary } from "@/server/markets";
import { getMarketDisplay } from "@/lib/market-display";

export function MarketCard({ market }: { market: MarketSummary }) {
  const d = getMarketDisplay(market.probYes);
  const pctColor = d.tone === "yes" ? "text-yes" : d.tone === "no" ? "text-no" : "text-foreground";

  return (
    <Link
      href={`/market/${market.id}`}
      className="group flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
    >
      {market.imageUrl && (
        <div
          className="h-28 w-full rounded-lg bg-muted bg-cover bg-center"
          style={{ backgroundImage: `url(${market.imageUrl})` }}
          role="img"
          aria-label={market.title}
        />
      )}

      <div className="flex items-start justify-between gap-2">
        <span className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {market.category}
        </span>
        <span className={`num shrink-0 text-base font-bold leading-none ${pctColor}`}>{d.probabilityPercent}%</span>
      </div>

      <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
        {market.title}
      </h3>

      <div className="mt-auto grid grid-cols-2 gap-2">
        <span className="flex items-center justify-between rounded-md border border-yes/25 bg-yes/10 px-2.5 py-1.5 text-xs font-semibold text-yes">
          <span>Yes</span>
          <span className="num">{d.yesPrice}¢</span>
        </span>
        <span className="flex items-center justify-between rounded-md border border-no/25 bg-no/10 px-2.5 py-1.5 text-xs font-semibold text-no">
          <span>No</span>
          <span className="num">{d.noPrice}¢</span>
        </span>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          {market.tradeCount}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          {market.infoCardCount}
        </span>
      </div>
    </Link>
  );
}

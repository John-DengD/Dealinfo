import Link from "next/link";
import { Layers, TrendingUp } from "lucide-react";
import type { EventSummary } from "@/server/markets";
import { getMarketDisplay } from "@/lib/market-display";

export function EventCard({ event }: { event: EventSummary }) {
  const top = event.outcomes.slice(0, 3);
  const rest = event.outcomes.length - top.length;

  return (
    <Link
      href={`/event/${event.id}`}
      className="group flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
    >
      {event.imageUrl && (
        <div
          className="h-28 w-full rounded-lg bg-muted bg-cover bg-center"
          style={{ backgroundImage: `url(${event.imageUrl})` }}
          role="img"
          aria-label={event.title}
        />
      )}

      <div className="flex items-start justify-between gap-2">
        <span className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {event.category}
        </span>
        <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
          <Layers className="h-3 w-3" />
          多结果
        </span>
      </div>

      <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
        {event.title}
      </h3>

      <div className="mt-auto space-y-1">
        {top.map((o) => {
          const d = getMarketDisplay(o.probYes);
          return (
            <div
              key={o.marketId}
              className="flex items-center justify-between gap-2 rounded-md border border-border bg-background/40 px-2.5 py-1.5 text-[11px]"
            >
              <span className="truncate text-muted-foreground">{o.label}</span>
              <span className="num shrink-0 font-bold text-foreground">{d.probabilityPercent}%</span>
            </div>
          );
        })}
        {rest > 0 && <div className="text-[10px] text-muted-foreground">+{rest} 个结果</div>}
      </div>

      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          {event.tradeCount}
        </span>
        <span>{event.outcomes.length} 个结果</span>
      </div>
    </Link>
  );
}

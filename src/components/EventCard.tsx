import Link from "next/link";
import type { EventSummary } from "@/server/markets";
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

export function EventCard({ event }: { event: EventSummary }) {
  const top = event.outcomes.slice(0, 3);
  const rest = event.outcomes.length - top.length;

  return (
    <Link
      href={`/event/${event.id}`}
      className="group flex h-full flex-col gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/50"
    >
      <div className="flex items-start gap-2.5">
        <Thumb imageUrl={event.imageUrl} label={event.category} />
        <h3 className="line-clamp-3 flex-1 text-sm font-medium leading-snug text-foreground group-hover:text-primary">
          {event.title}
        </h3>
      </div>

      <div className="mt-auto space-y-1.5">
        {top.map((o) => {
          const d = getMarketDisplay(o.probYes);
          return (
            <div key={o.marketId} className="flex items-center gap-2 text-xs">
              <span className="flex-1 truncate text-muted-foreground">{o.label}</span>
              <span className="num w-9 shrink-0 text-right font-bold text-foreground">{d.probabilityPercent}%</span>
              <span className="shrink-0 rounded bg-yes/15 px-1.5 py-0.5 text-[10px] font-semibold text-yes">
                {d.yesPrice}¢
              </span>
              <span className="shrink-0 rounded bg-no/15 px-1.5 py-0.5 text-[10px] font-semibold text-no">
                {d.noPrice}¢
              </span>
            </div>
          );
        })}
        {rest > 0 && <div className="text-[10px] text-muted-foreground">+{rest} 个结果</div>}
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{event.outcomes.length} 个结果 · {event.tradeCount} 笔</span>
        <span className="rounded bg-secondary/60 px-1.5 py-0.5">多结果</span>
      </div>
    </Link>
  );
}

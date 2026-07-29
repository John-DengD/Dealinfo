"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Layers, MessageSquare, TrendingUp } from "lucide-react";
import type { EventSummary } from "@/server/markets";
import { NeonLiquid } from "@/components/NeonLiquid";
import { getMarketDisplay } from "@/lib/market-display";

export function EventCard({ event }: { event: EventSummary }) {
  const top = event.outcomes.slice(0, 3);
  const rest = event.outcomes.length - top.length;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="h-full"
    >
      <NeonLiquid
        tone="neutral"
        strength="terminal"
        className="h-full rounded-2xl transition-shadow hover:shadow-[0_0_36px_color-mix(in_oklch,var(--primary),transparent_80%)]"
      >
        <Link href={`/event/${event.id}`} className="group flex h-full flex-col gap-2.5 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate rounded-full border border-border/70 bg-secondary/55 px-2 py-0.5 text-[11px] text-muted-foreground">
              {event.category}
            </span>
            <span className="flex shrink-0 items-center gap-1 text-[11px] font-black text-primary">
              <Layers className="h-3 w-3" />
              多结果
            </span>
          </div>

          <h3 className="line-clamp-2 min-h-[2.5rem] text-[14px] font-black leading-snug tracking-normal group-hover:text-primary">
            {event.title}
          </h3>

          <div className="mt-auto space-y-1">
            {top.map((o) => {
              const d = getMarketDisplay(o.probYes);
              return (
                <div
                  key={o.marketId}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/40 px-2 py-1 text-[11px]"
                >
                  <span className="truncate">{o.label}</span>
                  <span
                    className="num shrink-0 font-black"
                    style={{ color: d.tone === "no" ? "var(--no)" : d.tone === "yes" ? "var(--yes)" : "var(--primary)" }}
                  >
                    {d.probabilityPercent}%
                  </span>
                </div>
              );
            })}
            {rest > 0 && <div className="text-[10px] text-muted-foreground">+{rest} 个结果</div>}
          </div>

          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {event.infoCardCount}
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {event.tradeCount}
            </span>
          </div>
        </Link>
      </NeonLiquid>
    </motion.div>
  );
}

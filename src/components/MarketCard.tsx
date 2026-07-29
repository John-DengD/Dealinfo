"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MessageSquare, TrendingUp } from "lucide-react";
import type { MarketSummary } from "@/server/markets";
import { NeonLiquid } from "@/components/NeonLiquid";
import { getMarketDisplay } from "@/lib/market-display";

export function MarketCard({ market }: { market: MarketSummary }) {
  const display = getMarketDisplay(market.probYes);
  const color =
    display.tone === "yes" ? "var(--yes)" : display.tone === "no" ? "var(--no)" : "var(--primary)";

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="h-full"
    >
      <NeonLiquid
        tone={display.tone}
        strength="terminal"
        className="h-full rounded-2xl transition-shadow hover:shadow-[0_0_36px_color-mix(in_oklch,var(--primary),transparent_80%)]"
      >
        <Link href={`/market/${market.id}`} className="group flex h-full flex-col gap-2.5 p-3.5">
          {market.imageUrl && (
            <div
              className="h-24 w-full rounded-xl border border-border/50 bg-cover bg-center"
              style={{ backgroundImage: `url(${market.imageUrl})` }}
              role="img"
              aria-label={market.title}
            />
          )}
          <div className="flex items-center justify-between gap-2">
            <span className="truncate rounded-full border border-border/70 bg-secondary/55 px-2 py-0.5 text-[11px] text-muted-foreground">
              {market.category}
            </span>
            <span className="num shrink-0 text-lg font-black leading-none" style={{ color }}>
              {display.probabilityPercent}%
            </span>
          </div>

          <h3 className="line-clamp-2 min-h-[2.5rem] text-[14px] font-black leading-snug tracking-normal group-hover:text-primary">
            {market.title}
          </h3>

          <div className="mt-auto grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between rounded-lg bg-yes px-2.5 py-1.5 text-[11px] font-black text-yes-foreground">
              <span>YES</span>
              <span className="num">{display.yesPrice}¢</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-no/35 bg-no/20 px-2.5 py-1.5 text-[11px] font-black text-no">
              <span>NO</span>
              <span className="num">{display.noPrice}¢</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {market.infoCardCount}
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {market.tradeCount}
            </span>
          </div>
        </Link>
      </NeonLiquid>
    </motion.div>
  );
}

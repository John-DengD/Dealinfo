"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { LineChart, Line, YAxis, ResponsiveContainer } from "recharts";
import { MessageSquare, RadioTower, TrendingUp } from "lucide-react";
import type { MarketSummary } from "@/server/markets";
import { NeonLiquid } from "@/components/NeonLiquid";
import { getMarketDisplay } from "@/lib/market-display";

export function MarketCard({ market }: { market: MarketSummary }) {
  const display = getMarketDisplay(market.probYes);
  const pct = display.probabilityPercent;
  const data =
    market.probHistory.length >= 2
      ? market.probHistory.map((p, i) => ({ i, p: p * 100 }))
      : Array.from({ length: 12 }, (_, i) => ({ i, p: pct }));
  const color =
    display.tone === "yes" ? "var(--yes)" : display.tone === "no" ? "var(--no)" : "var(--primary)";

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 280, damping: 20 }}
      className="h-full"
    >
      <NeonLiquid
        tone={display.tone}
        strength="terminal"
        className="h-full rounded-2xl transition-shadow hover:shadow-[0_0_50px_color-mix(in_oklch,var(--primary),transparent_76%)]"
      >
        <Link href={`/market/${market.id}`} className="group flex h-full min-h-[18rem] flex-col p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase text-muted-foreground">
                <RadioTower className="h-3.5 w-3.5 text-primary" />
                Live Market
              </div>
              <h3 className="line-clamp-2 min-h-[2.75rem] text-[15px] font-black leading-snug tracking-normal group-hover:text-primary">
                {market.title}
              </h3>
            </div>
            <div
              className="neon-ring relative grid h-16 w-16 shrink-0 place-items-center rounded-full"
              style={{
                color,
                background: `conic-gradient(${color} ${pct}%, color-mix(in oklch, var(--foreground), transparent 90%) 0)`,
              }}
            >
              <span className="grid h-12 w-12 place-items-center rounded-full bg-background/90">
                <span className="num neon-text-glow text-sm font-black" style={{ color }}>{pct}%</span>
              </span>
            </div>
          </div>

          <div className="mb-4 h-16 w-full rounded-xl border border-border/60 bg-background/35 p-1.5 shadow-inner shadow-primary/5">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <YAxis domain={[0, 100]} hide />
                <Line
                  type="monotone"
                  dataKey="p"
                  stroke={color}
                  strokeWidth={3}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2">
            <div className="neon-scan flex items-center justify-between rounded-xl bg-yes px-3 py-2.5 text-xs font-black text-yes-foreground shadow-[0_0_26px_color-mix(in_oklch,var(--yes),transparent_68%)]">
              <span>YES</span>
              <span className="num">{display.yesPrice}¢</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-no/35 bg-no/20 px-3 py-2.5 text-xs font-black text-no shadow-[0_0_22px_color-mix(in_oklch,var(--no),transparent_78%)]">
              <span>NO</span>
              <span className="num">{display.noPrice}¢</span>
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
            <span className="rounded-full border border-border/70 bg-secondary/55 px-2.5 py-1">{market.category}</span>
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{market.infoCardCount}</span>
              <span className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" />{market.tradeCount}</span>
            </span>
          </div>
        </Link>
      </NeonLiquid>
    </motion.div>
  );
}

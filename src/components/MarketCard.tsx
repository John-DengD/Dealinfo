"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { LineChart, Line, YAxis, ResponsiveContainer } from "recharts";
import { MessageSquare, TrendingUp } from "lucide-react";
import type { MarketSummary } from "@/server/markets";

export function MarketCard({ market }: { market: MarketSummary }) {
  const pct = Math.round(market.probYes * 100);
  const up = market.probYes >= 0.5;
  const data = market.probHistory.map((p, i) => ({ i, p: p * 100 }));
  const color = up ? "var(--yes)" : "var(--no)";

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="h-full"
    >
      <Link
        href={`/market/${market.id}`}
        className="group flex h-full flex-col rounded-xl border border-border bg-card/80 p-4 shadow-sm transition-colors hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug group-hover:text-primary">
            {market.title}
          </h3>
          {/* 概率环 */}
          <div className="relative grid h-12 w-12 shrink-0 place-items-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="17" fill="none" stroke="var(--secondary)" strokeWidth="4" />
              <circle
                cx="20" cy="20" r="17" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * 2 * Math.PI * 17} ${2 * Math.PI * 17}`}
              />
            </svg>
            <span className={`num text-xs font-bold ${up ? "text-yes" : "text-no"}`}>{pct}%</span>
          </div>
        </div>

        <div className="mb-3 h-8 w-full opacity-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <YAxis domain={[0, 100]} hide />
              <Line type="monotone" dataKey="p" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Yes / No pill 报价 */}
        <div className="mb-3 grid grid-cols-2 gap-2">
          <div className="flex items-center justify-between rounded-lg bg-yes/10 px-2.5 py-1.5 text-xs font-semibold text-yes transition-colors group-hover:bg-yes/20">
            <span>Yes</span>
            <span className="num">{pct}¢</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-no/10 px-2.5 py-1.5 text-xs font-semibold text-no transition-colors group-hover:bg-no/20">
            <span>No</span>
            <span className="num">{100 - pct}¢</span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
          <span className="rounded bg-secondary px-2 py-0.5">{market.category}</span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{market.infoCardCount}</span>
            <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{market.tradeCount}</span>
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

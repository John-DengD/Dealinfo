"use client";

import Link from "next/link";
import { LineChart, Line, YAxis, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import type { MarketSummary } from "@/server/markets";

export function MarketCard({ market }: { market: MarketSummary }) {
  const pct = Math.round(market.probYes * 100);
  const up = market.probYes >= 0.5;
  const data = market.probHistory.map((p, i) => ({ i, p: p * 100 }));

  return (
    <Link href={`/market/${market.id}`} className="block">
      <Card className="group h-full gap-0 overflow-hidden p-4 transition-colors hover:border-primary/60">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-primary">
            {market.title}
          </h3>
          <div className="shrink-0 text-right">
            <div className={`font-mono text-2xl font-bold ${up ? "text-yes" : "text-no"}`}>
              {pct}%
            </div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">概率 Yes</div>
          </div>
        </div>

        <div className="h-10 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <YAxis domain={[0, 100]} hide />
              <Line
                type="monotone"
                dataKey="p"
                stroke={up ? "var(--yes)" : "var(--no)"}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span className="rounded bg-secondary px-2 py-0.5">{market.category}</span>
          <span>
            {market.infoCardCount} 条信息 · {market.tradeCount} 笔交易
          </span>
        </div>
      </Card>
    </Link>
  );
}

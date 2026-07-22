"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

export interface ChartPoint {
  t: number; // epoch ms
  p: number; // 0..1
}

const RANGES = [
  { key: "1H", ms: 3600e3 },
  { key: "6H", ms: 6 * 3600e3 },
  { key: "1D", ms: 24 * 3600e3 },
  { key: "1W", ms: 7 * 24 * 3600e3 },
  { key: "ALL", ms: Infinity },
] as const;

export function MarketChart({ points, now }: { points: ChartPoint[]; now: number }) {
  const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("ALL");

  const data = useMemo(() => {
    const win = RANGES.find((r) => r.key === range)!.ms;
    const cutoff = now - win;
    const filtered = points.filter((p) => p.t >= cutoff);
    const use = filtered.length >= 2 ? filtered : points;
    return use.map((p) => ({ t: p.t, p: Math.round(p.p * 100) }));
  }, [points, range, now]);

  const last = data.length ? data[data.length - 1].p : 50;
  const up = last >= 50;
  const color = up ? "var(--yes)" : "var(--no)";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <motion.span
            key={last}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`num text-3xl font-bold ${up ? "text-yes" : "text-no"}`}
          >
            {last}%
          </motion.span>
          <span className="text-xs text-muted-foreground">Yes 概率</span>
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                range === r.key ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.key}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -22 }}>
            <defs>
              <linearGradient id="mktFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="t" hide />
            <YAxis
              domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v}%`}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false}
            />
            <ReferenceLine y={50} stroke="var(--border)" strokeDasharray="3 3" />
            <Tooltip
              formatter={(v) => [`${v}%`, "Yes"]}
              labelFormatter={(t) => new Date(Number(t)).toLocaleString("zh-CN")}
              contentStyle={{
                background: "var(--popover)", border: "1px solid var(--border)",
                borderRadius: 8, color: "var(--popover-foreground)", fontSize: 12,
              }}
            />
            <Area type="monotone" dataKey="p" stroke={color} strokeWidth={2.5} fill="url(#mktFill)" isAnimationActive />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

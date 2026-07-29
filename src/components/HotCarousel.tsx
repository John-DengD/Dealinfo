"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Flame, Layers } from "lucide-react";
import type { FeedItem } from "@/server/markets";
import { getMarketDisplay } from "@/lib/market-display";

const ROTATE_MS = 6000;

function toneColor(tone: "yes" | "no" | "neutral") {
  return tone === "yes" ? "var(--yes)" : tone === "no" ? "var(--no)" : "var(--primary)";
}

export function HotCarousel({ items }: { items: FeedItem[] }) {
  const count = items.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback((n: number) => setIndex(((n % count) + count) % count), [count]);

  useEffect(() => {
    if (paused || count <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => clearInterval(timer);
  }, [paused, count]);

  if (count === 0) return null;

  const item = items[Math.min(index, count - 1)];
  const isEvent = item.kind === "event";
  const href = isEvent ? `/event/${item.event.id}` : `/market/${item.market.id}`;
  const title = isEvent ? item.event.title : item.market.title;
  const category = isEvent ? item.event.category : item.market.category;
  const imageUrl = isEvent ? item.event.imageUrl : item.market.imageUrl;
  const infoCardCount = isEvent ? item.event.infoCardCount : item.market.infoCardCount;
  const tradeCount = isEvent ? item.event.tradeCount : item.market.tradeCount;
  const key = isEvent ? `e-${item.event.id}` : `m-${item.market.id}`;

  const marketDisplay = item.kind === "market" ? getMarketDisplay(item.market.probYes) : null;
  const accent = marketDisplay ? toneColor(marketDisplay.tone) : "var(--primary)";

  return (
    <div
      className="relative mb-6 overflow-hidden rounded-2xl border border-border bg-card"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.35 }}
        >
          <Link
            href={href}
            className="grid gap-5 p-5 sm:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] sm:items-center sm:p-7"
          >
            {/* 真实配图(子项目②),没有就霓虹渐变占位 */}
            {imageUrl ? (
              <div
                className="h-40 rounded-xl border border-border bg-muted bg-cover bg-center sm:h-full sm:min-h-[12rem]"
                style={{ backgroundImage: `url(${imageUrl})` }}
                role="img"
                aria-label={title}
              />
            ) : (
              <div className="grid h-40 place-items-center rounded-xl border border-border bg-muted sm:h-full sm:min-h-[12rem]">
                {marketDisplay ? (
                  <span className="num text-5xl font-black" style={{ color: accent }}>
                    {marketDisplay.probabilityPercent}%
                  </span>
                ) : (
                  <Layers className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
            )}

            <div className="flex flex-col">
              <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase text-primary">
                <Flame className="h-4 w-4" /> 最热 · {index + 1}/{count}
                {isEvent && <span className="flex items-center gap-1 text-primary/80"><Layers className="h-3.5 w-3.5" />多结果</span>}
              </div>
              <h2 className="line-clamp-3 text-2xl font-black leading-tight sm:text-3xl">{title}</h2>

              {item.kind === "market" && marketDisplay ? (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="rounded-lg border border-yes/25 bg-yes/10 px-4 py-2 text-sm font-semibold text-yes">
                    Buy Yes · {marketDisplay.yesPrice}¢
                  </span>
                  <span className="rounded-lg border border-no/25 bg-no/10 px-4 py-2 text-sm font-semibold text-no">
                    Buy No · {marketDisplay.noPrice}¢
                  </span>
                </div>
              ) : (
                <div className="mt-4 flex flex-col gap-1.5">
                  {item.kind === "event" &&
                    item.event.outcomes.slice(0, 3).map((o) => {
                      const d = getMarketDisplay(o.probYes);
                      return (
                        <div key={o.marketId} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/40 px-3 py-1.5 text-sm">
                          <span className="truncate font-semibold">{o.label}</span>
                          <span className="num shrink-0 font-black" style={{ color: toneColor(d.tone) }}>{d.probabilityPercent}%</span>
                        </div>
                      );
                    })}
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="rounded-full border border-border/70 bg-secondary/55 px-2.5 py-1">{category}</span>
                <span>💬 {infoCardCount} 推荐</span>
                <span>📈 {tradeCount} 交易</span>
              </div>
            </div>
          </Link>
        </motion.div>
      </AnimatePresence>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="上一个"
            onClick={() => go(index - 1)}
            className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-border/70 bg-background/70 text-foreground backdrop-blur hover:border-primary/60 hover:text-primary"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="下一个"
            onClick={() => go(index + 1)}
            className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-border/70 bg-background/70 text-foreground backdrop-blur hover:border-primary/60 hover:text-primary"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {items.map((it, i) => (
              <button
                key={it.kind === "event" ? `e-${it.event.id}` : `m-${it.market.id}`}
                type="button"
                aria-label={`第 ${i + 1} 个`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground/70"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

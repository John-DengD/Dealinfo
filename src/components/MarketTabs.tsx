"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { InfoCardsSection, type CardData } from "@/components/InfoCardsSection";

export interface ActivityItem {
  id: string;
  userName: string;
  side: "YES" | "NO";
  action: string;
  shares: number;
  costPoints: number;
  createdAt: string;
}
export interface HolderItem {
  userName: string;
  yesShares: number;
  noShares: number;
}

type Tab = "info" | "activity" | "holders" | "rules";

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  return `${Math.floor(h / 24)} 天前`;
}

export function MarketTabs({
  marketId,
  cards,
  activity,
  holders,
  description,
  loggedIn,
}: {
  marketId: string;
  cards: CardData[];
  activity: ActivityItem[];
  holders: HolderItem[];
  description: string;
  loggedIn: boolean;
}) {
  const [tab, setTab] = useState<Tab>("info");
  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: "info", label: "社区信息", badge: cards.length },
    { key: "activity", label: "活动", badge: activity.length },
    { key: "holders", label: "持有人", badge: holders.length },
    { key: "rules", label: "规则" },
  ];

  return (
    <div>
      <div className="mb-4 flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {t.badge !== undefined && t.badge > 0 && (
              <span className="ml-1.5 rounded-full bg-secondary px-1.5 text-xs">{t.badge}</span>
            )}
            {tab === t.key && (
              <motion.div layoutId="tab-underline" className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {tab === "info" && (
            <InfoCardsSection marketId={marketId} cards={cards} loggedIn={loggedIn} />
          )}

          {tab === "activity" && (
            <div className="divide-y divide-border rounded-lg border border-border">
              {activity.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">暂无交易活动。</p>
              ) : (
                activity.map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs">
                        {a.userName.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="text-muted-foreground">
                        <span className="font-medium text-foreground">@{a.userName}</span>{" "}
                        {a.action === "BUY" ? "买入" : "卖出"}{" "}
                        <span className={a.side === "YES" ? "text-yes" : "text-no"}>{a.side}</span>
                      </span>
                    </span>
                    <span className="num flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{a.shares.toFixed(1)} 份</span>
                      <span>{a.costPoints.toFixed(1)} 积分</span>
                      <span>{timeAgo(a.createdAt)}</span>
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "holders" && (
            <div className="grid gap-4 md:grid-cols-2">
              {(["YES", "NO"] as const).map((side) => {
                const sorted = [...holders]
                  .filter((h) => (side === "YES" ? h.yesShares > 0 : h.noShares > 0))
                  .sort((a, b) => (side === "YES" ? b.yesShares - a.yesShares : b.noShares - a.noShares))
                  .slice(0, 10);
                return (
                  <div key={side}>
                    <div className={`mb-2 text-sm font-semibold ${side === "YES" ? "text-yes" : "text-no"}`}>
                      {side} 持有人
                    </div>
                    <div className="divide-y divide-border rounded-lg border border-border">
                      {sorted.length === 0 ? (
                        <p className="p-3 text-center text-xs text-muted-foreground">暂无</p>
                      ) : (
                        sorted.map((h, i) => (
                          <div key={h.userName} className="flex items-center justify-between px-3 py-2 text-sm">
                            <span className="flex items-center gap-2">
                              <span className="w-4 text-xs text-muted-foreground">{i + 1}</span>
                              <span>@{h.userName}</span>
                            </span>
                            <span className="num text-xs text-muted-foreground">
                              {(side === "YES" ? h.yesShares : h.noShares).toFixed(1)} 份
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "rules" && (
            <div className="rounded-lg border border-border p-4 text-sm leading-relaxed text-muted-foreground">
              {description ? (
                <p className="whitespace-pre-wrap">{description}</p>
              ) : (
                <p>该市场暂无补充规则说明。</p>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

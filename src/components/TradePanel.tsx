"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { track, cv } from "@hellyeah/x-ray";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getQuote, submitOrder } from "@/server/trading-actions";
import type { Side } from "@/lib/amm";
import { NeonLiquid } from "@/components/NeonLiquid";
import { getMarketDisplay } from "@/lib/market-display";

interface Props {
  marketId: string;
  probYes: number;
  tradeable: boolean;
  loggedIn: boolean;
}

export function TradePanel({ marketId, probYes, tradeable, loggedIn }: Props) {
  const router = useRouter();
  const [side, setSide] = useState<Side>("YES");
  const [action, setAction] = useState<"BUY" | "SELL">("BUY");
  const [shares, setShares] = useState("10");
  const [quote, setQuote] = useState<{ costPoints: number; probAfter: number } | null>(null);
  const [pending, startTransition] = useTransition();

  const display = getMarketDisplay(probYes);
  const n = Number(shares);
  const validShares = Number.isFinite(n) && n > 0;
  const visibleQuote = validShares ? quote : null;

  useEffect(() => {
    track(cv.viewContent, { market_id: marketId });
  }, [marketId]);

  useEffect(() => {
    if (!validShares) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const q = await getQuote(marketId, side, action, n);
      if (!cancelled) setQuote("error" in q ? null : q);
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [marketId, side, action, n, validShares]);

  function onSubmit() {
    if (!loggedIn) {
      router.push("/login");
      return;
    }
    if (!validShares) return;
    startTransition(async () => {
      const r = await submitOrder(marketId, side, action, n);
      if ("error" in r) {
        toast.error(r.error);
      } else {
        toast.success(
          action === "BUY"
            ? `买入成功,花费 ${r.costPoints.toFixed(1)} 积分`
            : `卖出成功,获得 ${r.costPoints.toFixed(1)} 积分`
        );
        router.refresh();
      }
    });
  }

  return (
    <NeonLiquid tone={side === "YES" ? "yes" : "no"} strength="terminal" className="rounded-3xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-black uppercase text-primary">Trade Terminal</div>
          <div className="mt-1 text-sm text-muted-foreground">实时做市 · LMSR</div>
        </div>
        <div className={`num neon-text-glow text-3xl font-black ${display.tone === "no" ? "text-no" : "text-yes"}`}>
          {display.probabilityPercent}%
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => setSide("YES")}
          className={`rounded-2xl border px-3 py-3 text-left text-sm font-black transition-all ${
            side === "YES"
              ? "neon-scan border-transparent bg-yes text-yes-foreground shadow-[0_0_30px_color-mix(in_oklch,var(--yes),transparent_62%)]"
              : "border-border/70 bg-background/45 text-muted-foreground hover:border-yes/40 hover:text-yes"
          }`}
        >
          <span className="block text-xs uppercase opacity-70">Yes</span>
          <span className="num text-lg">{display.yesPrice}¢</span>
        </button>
        <button
          onClick={() => setSide("NO")}
          className={`rounded-2xl border px-3 py-3 text-left text-sm font-black transition-all ${
            side === "NO"
              ? "border-transparent bg-no text-no-foreground shadow-[0_0_30px_color-mix(in_oklch,var(--no),transparent_64%)]"
              : "border-border/70 bg-background/45 text-muted-foreground hover:border-no/40 hover:text-no"
          }`}
        >
          <span className="block text-xs uppercase opacity-70">No</span>
          <span className="num text-lg">{display.noPrice}¢</span>
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
        {(["BUY", "SELL"] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAction(a)}
            className={`rounded-2xl border py-2.5 font-bold transition-colors ${
              action === a
                ? "border-primary/60 bg-primary/20 text-foreground shadow-[0_0_24px_color-mix(in_oklch,var(--primary),transparent_76%)]"
                : "border-border/70 bg-background/35 text-muted-foreground hover:text-foreground"
            }`}
          >
            {a === "BUY" ? "买入" : "卖出"}
          </button>
        ))}
      </div>

      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">份额数量</label>
      <Input
        type="number"
        min={0}
        step="1"
        value={shares}
        onChange={(e) => setShares(e.target.value)}
        className="mb-4 h-11 rounded-2xl border-primary/20 bg-background/50 px-4 font-mono text-lg font-black focus-visible:border-primary"
      />

      <div className="mb-4 space-y-2 rounded-2xl border border-border/70 bg-background/45 p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{action === "BUY" ? "预计花费" : "预计获得"}</span>
          <span className="num font-black">{visibleQuote ? `${visibleQuote.costPoints.toFixed(1)} 积分` : "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">成交后概率</span>
          <span className={`num font-black ${side === "YES" ? "text-yes" : "text-no"}`}>
            {visibleQuote ? `${Math.round(visibleQuote.probAfter * 100)}%` : "—"}
          </span>
        </div>
      </div>

      {tradeable ? (
        <Button
          onClick={onSubmit}
          disabled={pending || !validShares}
          className={`h-12 w-full rounded-2xl text-sm font-black ${side === "YES" ? "neon-button" : "bg-no text-no-foreground hover:bg-no/85"}`}
          variant={side === "YES" ? "default" : "secondary"}
        >
          {pending ? "处理中…" : loggedIn ? `确认${action === "BUY" ? "买入" : "卖出"} ${side}` : "登录后交易"}
        </Button>
      ) : (
        <p className="rounded-2xl border border-border/70 bg-background/45 py-3 text-center text-sm text-muted-foreground">
          该市场已停止交易
        </p>
      )}
    </NeonLiquid>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getQuote, submitOrder } from "@/server/trading-actions";
import type { Side } from "@/lib/amm";

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

  const n = Number(shares);
  const validShares = Number.isFinite(n) && n > 0;

  useEffect(() => {
    if (!validShares) {
      setQuote(null);
      return;
    }
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
    <Card className="p-4">
      <div className="mb-3 flex gap-2">
        <button
          onClick={() => setSide("YES")}
          className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
            side === "YES" ? "bg-yes text-yes-foreground" : "bg-secondary text-muted-foreground"
          }`}
        >
          Yes {Math.round(probYes * 100)}¢
        </button>
        <button
          onClick={() => setSide("NO")}
          className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
            side === "NO" ? "bg-no text-no-foreground" : "bg-secondary text-muted-foreground"
          }`}
        >
          No {Math.round((1 - probYes) * 100)}¢
        </button>
      </div>

      <div className="mb-3 flex gap-2 text-sm">
        {(["BUY", "SELL"] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAction(a)}
            className={`flex-1 rounded-md border py-1.5 transition-colors ${
              action === a ? "border-primary text-foreground" : "border-border text-muted-foreground"
            }`}
          >
            {a === "BUY" ? "买入" : "卖出"}
          </button>
        ))}
      </div>

      <label className="mb-1 block text-xs text-muted-foreground">份额数量</label>
      <Input
        type="number"
        min={0}
        step="1"
        value={shares}
        onChange={(e) => setShares(e.target.value)}
        className="mb-3 font-mono"
      />

      <div className="mb-3 space-y-1 rounded-md bg-secondary/50 p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{action === "BUY" ? "预计花费" : "预计获得"}</span>
          <span className="font-mono">{quote ? `${quote.costPoints.toFixed(1)} 积分` : "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">成交后概率</span>
          <span className="font-mono">{quote ? `${Math.round(quote.probAfter * 100)}%` : "—"}</span>
        </div>
      </div>

      {tradeable ? (
        <Button
          onClick={onSubmit}
          disabled={pending || !validShares}
          className="w-full"
          variant={side === "YES" ? "default" : "secondary"}
        >
          {pending ? "处理中…" : loggedIn ? `确认${action === "BUY" ? "买入" : "卖出"} ${side}` : "登录后交易"}
        </Button>
      ) : (
        <p className="rounded-md bg-secondary py-2 text-center text-sm text-muted-foreground">
          该市场已停止交易
        </p>
      )}
    </Card>
  );
}

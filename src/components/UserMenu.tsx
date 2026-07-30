"use client";

import { useState } from "react";
import Link from "next/link";
import { Wallet, User, LogOut, CreditCard } from "lucide-react";
import { signOutAction } from "@/server/auth-actions";

export function UserMenu({
  name,
  points,
}: {
  name: string;
  points: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [recharging, setRecharging] = useState(false);
  const [rechargeError, setRechargeError] = useState<string | null>(null);
  const initial = (name || "?").slice(0, 1).toUpperCase();

  async function recharge() {
    setRechargeError(null);
    setRecharging(true);
    try {
      const response = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = (await response.json().catch(() => null)) as { url?: unknown; error?: string } | null;
      if (!response.ok || typeof data?.url !== "string") {
        throw new Error(data?.error ?? "无法打开充值页面");
      }
      window.location.assign(data.url);
    } catch (e) {
      setRecharging(false);
      setRechargeError(e instanceof Error ? e.message : "无法打开充值页面");
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-yes/80 text-xs font-bold text-primary-foreground ring-offset-2 ring-offset-background transition-shadow hover:ring-2 hover:ring-primary/50"
        aria-label="用户菜单"
      >
        {initial}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-52 animate-fade-up rounded-xl border border-border bg-popover p-1.5 shadow-xl">
            <div className="border-b border-border px-3 py-2">
              <div className="truncate text-sm font-medium">@{name}</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Wallet className="h-3.5 w-3.5 text-yes" />
                <span className="num">{points !== null ? Math.round(points).toLocaleString() : "—"} 积分</span>
              </div>
            </div>

            <Link
              href="/portfolio"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-secondary"
            >
              <User className="h-4 w-4" /> 个人中心
            </Link>

            <button
              onClick={recharge}
              disabled={recharging}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-yes hover:bg-yes/10"
            >
              <CreditCard className="h-4 w-4" /> {recharging ? "打开中..." : "充值积分"}
            </button>
            {rechargeError && <div className="px-3 pb-2 text-xs text-no">{rechargeError}</div>}

            <form action={signOutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-no hover:bg-no/10"
              >
                <LogOut className="h-4 w-4" /> 登出
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

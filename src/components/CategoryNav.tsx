"use client";

import Link from "next/link";
import { Bitcoin, Cpu, Globe, Landmark, Sparkles, Trophy } from "lucide-react";
import type { ComponentType } from "react";

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  政治: Landmark,
  加密: Bitcoin,
  "加密/Web3": Bitcoin,
  体育: Trophy,
  科技: Cpu,
  国际: Globe,
};

// 去掉了"全部" chip:默认(无选中)即显示全部;点某分类过滤,再点当前分类回到全部。
export function CategoryNav({ categories, active }: { categories: string[]; active: string }) {
  return (
    <div className="hide-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {categories.map((t) => {
        const Icon = ICONS[t] ?? Sparkles;
        const on = active === t;
        return (
          <Link
            key={t}
            href={on ? "/" : `/?cat=${encodeURIComponent(t)}`}
            className={`neon-scan flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-all ${
              on
                ? "border-primary/70 bg-primary/20 text-foreground shadow-[0_0_24px_color-mix(in_oklch,var(--primary),transparent_72%)]"
                : "border-border/70 bg-secondary/45 text-muted-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-foreground"
            }`}
          >
            <Icon className={`h-4 w-4 ${on ? "text-primary neon-text-glow" : ""}`} />
            {t}
          </Link>
        );
      })}
    </div>
  );
}

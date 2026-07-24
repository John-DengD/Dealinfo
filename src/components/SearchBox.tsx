"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export function SearchBox() {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/?q=${encodeURIComponent(q)}` : "/");
  }

  return (
    <form onSubmit={submit} className="neon-scan relative w-full max-w-xl rounded-full">
      <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-primary" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="搜索市场、主题、社区推荐…"
        className="relative z-0 h-10 w-full rounded-full border border-primary/25 bg-background/70 pl-11 pr-4 text-sm shadow-[0_0_28px_color-mix(in_oklch,var(--primary),transparent_78%)] outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:bg-background/90 focus:ring-2 focus:ring-primary/25"
      />
    </form>
  );
}

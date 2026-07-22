import Link from "next/link";
import { Suspense } from "react";
import { TrendingUp, Trophy, PlusCircle, Wallet } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { SearchBox } from "@/components/SearchBox";

export async function SiteHeader() {
  const session = await auth().catch(() => null);
  let points: number | null = null;
  if (session?.user?.id) {
    const u = await db.user
      .findUnique({ where: { id: session.user.id }, select: { pointsBalance: true } })
      .catch(() => null);
    points = u?.pointsBalance ?? null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 glass">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-yes text-sm text-primary-foreground shadow-lg shadow-primary/20">
            D
          </span>
          <span className="hidden sm:inline">
            Deal<span className="text-primary">Info</span>
          </span>
        </Link>

        <div className="flex flex-1 justify-center px-2">
          <Suspense>
            <SearchBox />
          </Suspense>
        </div>

        <nav className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
          <Link href="/leaderboard" className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 hover:bg-secondary hover:text-foreground">
            <Trophy className="h-4 w-4" /> 排行榜
          </Link>
          <Link href="/propose" className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 hover:bg-secondary hover:text-foreground">
            <PlusCircle className="h-4 w-4" /> 提议
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {session?.user ? (
            <>
              <Link
                href="/portfolio"
                className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-sm transition-colors hover:border-primary/60"
              >
                <Wallet className="h-4 w-4 text-yes" />
                <span className="num font-semibold">{points !== null ? Math.round(points).toLocaleString() : "—"}</span>
              </Link>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-yes/80 text-xs font-bold text-primary-foreground">
                {(session.user.name ?? session.user.email ?? "?").slice(0, 1).toUpperCase()}
              </div>
            </>
          ) : (
            <>
              <Button render={<Link href="/login">登录</Link>} variant="ghost" size="sm" />
              <Button render={<Link href="/register">注册</Link>} size="sm" />
            </>
          )}
        </div>
      </div>
    </header>
  );
}

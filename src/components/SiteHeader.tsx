import Link from "next/link";
import { Suspense } from "react";
import { PlusCircle, Trophy, Wallet, Zap } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import { SearchBox } from "@/components/SearchBox";
import { UserMenu } from "@/components/UserMenu";

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
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex min-h-14 max-w-7xl flex-wrap items-center gap-3 px-4 py-2">
        <Link href="/" aria-label="DealInfo 首页" className="group flex shrink-0 items-center">
          <BrandLogo />
        </Link>

        <div className="min-w-48 flex-1 px-0 sm:px-2">
          <Suspense>
            <SearchBox />
          </Suspense>
        </div>

        <nav className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
          <Link href="/leaderboard" className="flex items-center gap-1.5 rounded-md px-3 py-2 hover:bg-secondary hover:text-foreground">
            <Trophy className="h-4 w-4" /> 排行榜
          </Link>
          <Link href="/propose" className="flex items-center gap-1.5 rounded-md px-3 py-2 hover:bg-secondary hover:text-foreground">
            <PlusCircle className="h-4 w-4" /> 提议
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {session?.user ? (
            <>
              <Link
                href="/portfolio"
                className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:border-primary/50"
              >
                <Wallet className="h-4 w-4 text-yes" />
                <span className="num font-semibold">{points !== null ? Math.round(points).toLocaleString() : "—"}</span>
              </Link>
              <UserMenu
                name={session.user.name ?? session.user.email ?? "?"}
                points={points}
              />
            </>
          ) : (
            <>
              <Button render={<Link href="/login">登录</Link>} nativeButton={false} variant="ghost" size="sm" />
              <Button render={<Link href="/register"><Zap className="h-3.5 w-3.5" />注册</Link>} nativeButton={false} size="sm" />
            </>
          )}
        </div>
      </div>
    </header>
  );
}

import Link from "next/link";
import { Suspense } from "react";
import { PlusCircle, Trophy, Wallet, Zap } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
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
    <header className="glass sticky top-0 z-40 border-b border-primary/20 shadow-[0_12px_50px_color-mix(in_oklch,black,transparent_72%)]">
      <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center gap-4 px-4 py-2">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-black tracking-tight">
          <span className="neon-scan neon-button flex h-9 w-9 items-center justify-center rounded-xl text-sm text-primary-foreground">
            D
          </span>
          <span className="hidden sm:inline">
            Deal<span className="text-primary neon-text-glow">Info</span>
          </span>
        </Link>

        <div className="min-w-56 flex-1 px-0 sm:px-2">
          <Suspense>
            <SearchBox />
          </Suspense>
        </div>

        <nav className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
          <Link href="/leaderboard" className="flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/35 px-3 py-2 hover:border-primary/50 hover:bg-primary/10 hover:text-foreground">
            <Trophy className="h-4 w-4" /> 排行榜
          </Link>
          <Link href="/propose" className="flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/35 px-3 py-2 hover:border-primary/50 hover:bg-primary/10 hover:text-foreground">
            <PlusCircle className="h-4 w-4" /> 提议
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {session?.user ? (
            <>
              <Link
                href="/portfolio"
                className="neon-scan flex items-center gap-1.5 rounded-full border border-yes/35 bg-yes/10 px-3 py-2 text-sm transition-colors hover:border-yes/70"
              >
                <Wallet className="h-4 w-4 text-yes" />
                <span className="num font-semibold">{points !== null ? Math.round(points).toLocaleString() : "—"}</span>
              </Link>
              <UserMenu
                name={session.user.name ?? session.user.email ?? "?"}
                points={points}
                userId={session.user.id}
                email={session.user.email}
              />
            </>
          ) : (
            <>
              <Button render={<Link href="/login">登录</Link>} nativeButton={false} variant="ghost" size="sm" />
              <Button render={<Link href="/register"><Zap className="h-3.5 w-3.5" />注册</Link>} nativeButton={false} size="sm" className="neon-button" />
            </>
          )}
        </div>
      </div>
    </header>
  );
}

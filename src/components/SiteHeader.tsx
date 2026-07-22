import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";

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
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-2 font-heading text-lg font-bold">
          <span className="rounded bg-primary px-1.5 py-0.5 text-primary-foreground">D</span>
          <span>DealInfo</span>
        </Link>
        <nav className="hidden items-center gap-4 text-sm text-muted-foreground sm:flex">
          <Link href="/" className="hover:text-foreground">市场</Link>
          <Link href="/leaderboard" className="hover:text-foreground">排行榜</Link>
          <Link href="/propose" className="hover:text-foreground">提议市场</Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {session?.user ? (
            <>
              <Link
                href="/portfolio"
                className="rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground"
              >
                {points !== null ? Math.round(points).toLocaleString() : "—"} 积分
              </Link>
              <span className="text-sm text-muted-foreground">
                {session.user.name ?? session.user.email}
              </span>
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

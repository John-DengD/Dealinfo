import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const session = await auth();
  const meId = session?.user?.id;

  const users = await db.user.findMany({
    orderBy: { pointsBalance: "desc" },
    take: 50,
    select: { id: true, username: true, pointsBalance: true },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">积分排行榜</h1>
      <p className="mb-6 text-sm text-muted-foreground">按可用积分排名(前 50 名)。</p>

      <Card className="divide-y divide-border p-0">
        {users.map((u, i) => (
          <div
            key={u.id}
            className={`flex items-center justify-between px-4 py-3 ${
              u.id === meId ? "bg-primary/10" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-6 text-center font-mono text-sm ${
                  i < 3 ? "font-bold text-primary" : "text-muted-foreground"
                }`}
              >
                {i + 1}
              </span>
              <span className="text-sm font-medium">
                @{u.username}
                {u.id === meId && <span className="ml-2 text-xs text-primary">(你)</span>}
              </span>
            </div>
            <span className="font-mono text-sm">{Math.round(u.pointsBalance).toLocaleString()}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

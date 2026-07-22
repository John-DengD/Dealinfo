import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { listPendingMarkets, listResolvableMarkets } from "@/server/markets";
import { approveAction, rejectAction, resolveAction } from "./actions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") notFound();

  const [pending, resolvable] = await Promise.all([
    listPendingMarkets(),
    listResolvableMarkets(),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">管理后台</h1>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">
          待审核提议 <span className="text-sm text-muted-foreground">({pending.length})</span>
        </h2>
        <div className="space-y-3">
          {pending.length === 0 && <p className="text-sm text-muted-foreground">暂无待审核提议。</p>}
          {pending.map((m) => (
            <Card key={m.id} className="p-4">
              <div className="mb-1 text-sm text-muted-foreground">
                {m.category} · 由 @{m.creator.username} 提议 · 截止 {m.closesAt.toLocaleString("zh-CN")}
              </div>
              <div className="mb-3 font-medium">{m.title}</div>
              {m.description && <p className="mb-3 text-sm text-muted-foreground">{m.description}</p>}
              <div className="flex flex-wrap items-end gap-2">
                <form action={approveAction} className="flex items-end gap-2">
                  <input type="hidden" name="id" value={m.id} />
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">流动性参数 b</label>
                    <Input name="liquidityB" type="number" defaultValue={100} min={1} className="w-24" />
                  </div>
                  <Button type="submit" size="sm">通过并上线</Button>
                </form>
                <form action={rejectAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <Button type="submit" size="sm" variant="destructive">拒绝</Button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">
          待结算市场 <span className="text-sm text-muted-foreground">({resolvable.length})</span>
        </h2>
        <div className="space-y-3">
          {resolvable.length === 0 && <p className="text-sm text-muted-foreground">暂无可结算市场。</p>}
          {resolvable.map((m) => (
            <Card key={m.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="font-medium">{m.title}</div>
                <div className="text-xs text-muted-foreground">
                  {m.category} · 截止 {m.closesAt.toLocaleString("zh-CN")}
                </div>
              </div>
              <div className="flex gap-2">
                <form action={resolveAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="outcome" value="YES" />
                  <Button type="submit" size="sm" className="bg-yes text-yes-foreground hover:bg-yes/80">
                    判定 Yes
                  </Button>
                </form>
                <form action={resolveAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="outcome" value="NO" />
                  <Button type="submit" size="sm" className="bg-no text-no-foreground hover:bg-no/80">
                    判定 No
                  </Button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { listPendingMarkets, listResolvableMarkets } from "@/server/markets";
import { listPendingEvents, listResolvableEvents } from "@/server/events";
import {
  approveAction,
  approveEventAction,
  cancelMarketAction,
  rejectAction,
  rejectEventAction,
  resolveAction,
  resolveEventAction,
  syncHotMarketsAction,
} from "./actions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") notFound();

  const [pending, resolvable, pendingEvents, resolvableEvents] = await Promise.all([
    listPendingMarkets(),
    listResolvableMarkets(),
    listPendingEvents(),
    listResolvableEvents(),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">管理后台</h1>

      <section className="mb-10">
        <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <h2 className="font-semibold">每日热点市场</h2>
            <p className="text-sm text-muted-foreground">
              抓取 10 个领域热点,直接生成上线的 Yes/No 市场,并自动尝试结算到期热点。
            </p>
          </div>
          <form action={syncHotMarketsAction}>
            <Button type="submit">立即同步热点</Button>
          </form>
        </Card>
      </section>

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
                {m.status === "OPEN" && (
                  <form action={cancelMarketAction}>
                    <input type="hidden" name="id" value={m.id} />
                    <Button type="submit" size="sm" variant="destructive">
                      下线并退款
                    </Button>
                  </form>
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">
          待审核多结果事件 <span className="text-sm text-muted-foreground">({pendingEvents.length})</span>
        </h2>
        <div className="space-y-3">
          {pendingEvents.length === 0 && <p className="text-sm text-muted-foreground">暂无待审核事件。</p>}
          {pendingEvents.map((e) => (
            <Card key={e.id} className="p-4">
              <div className="mb-1 text-sm text-muted-foreground">
                {e.category} · 由 @{e.creator.username} 提议 · 截止 {e.closesAt.toLocaleString("zh-CN")}
              </div>
              <div className="mb-2 font-medium">{e.title}</div>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {e.markets.map((m, i) => (
                  <span key={i} className="rounded-full border border-border/70 bg-secondary/50 px-2 py-0.5 text-xs">
                    {m.outcomeLabel}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <form action={approveEventAction} className="flex items-end gap-2">
                  <input type="hidden" name="id" value={e.id} />
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">流动性参数 b(每个结果)</label>
                    <Input name="liquidityB" type="number" defaultValue={100} min={1} className="w-24" />
                  </div>
                  <Button type="submit" size="sm">通过并上线</Button>
                </form>
                <form action={rejectEventAction}>
                  <input type="hidden" name="id" value={e.id} />
                  <Button type="submit" size="sm" variant="destructive">拒绝</Button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">
          待结算多结果事件 <span className="text-sm text-muted-foreground">({resolvableEvents.length})</span>
        </h2>
        <div className="space-y-3">
          {resolvableEvents.length === 0 && <p className="text-sm text-muted-foreground">暂无可结算事件。</p>}
          {resolvableEvents.map((e) => (
            <Card key={e.id} className="p-4">
              <div className="mb-1 font-medium">{e.title}</div>
              <div className="mb-3 text-xs text-muted-foreground">
                {e.category} · 截止 {e.closesAt.toLocaleString("zh-CN")}
              </div>
              <form action={resolveEventAction} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={e.id} />
                <select
                  name="winnerMarketId"
                  required
                  defaultValue=""
                  className="rounded-lg border border-border/70 bg-background/60 px-3 py-2 text-sm"
                >
                  <option value="" disabled>
                    选择获胜结果…
                  </option>
                  {e.markets.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.outcomeLabel}
                    </option>
                  ))}
                </select>
                <Button type="submit" size="sm">结算(选中结果 Yes,其余 No)</Button>
              </form>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

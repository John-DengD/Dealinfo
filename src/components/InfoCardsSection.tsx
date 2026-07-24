"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ThumbsUp, ThumbsDown, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { addCardAction, voteCardAction } from "@/server/infocard-actions";
import type { Stance } from "@/server/infocards";

export interface CardData {
  id: string;
  stance: Stance;
  headline: string;
  body: string | null;
  sourceUrl: string | null;
  sourceTitle: string | null;
  score: number;
  createdAt: string;
  authorName: string;
  authorAvatar: string | null;
}

const STANCE_META: Record<Stance, { label: string; ring: string; text: string }> = {
  YES: { label: "支持 Yes", ring: "border-yes/40", text: "text-yes" },
  NO: { label: "支持 No", ring: "border-no/40", text: "text-no" },
  NEUTRAL: { label: "中立 / 参考", ring: "border-border", text: "text-muted-foreground" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  return `${Math.floor(h / 24)} 天前`;
}

function InfoCardItem({
  card,
  marketId,
  loggedIn,
}: {
  card: CardData;
  marketId: string;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const meta = STANCE_META[card.stance];
  const [score, setScore] = useState(card.score);
  const [pending, startTransition] = useTransition();

  function vote(value: 1 | -1) {
    if (!loggedIn) {
      router.push("/login");
      return;
    }
    startTransition(async () => {
      const r = await voteCardAction(card.id, value, marketId);
      if ("error" in r) toast.error(r.error);
      else setScore(r.score);
    });
  }

  return (
    <div className={`rounded-2xl border ${meta.ring} bg-background/45 p-3 shadow-[0_0_24px_color-mix(in_oklch,var(--primary),transparent_88%)]`}>
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border/70 bg-secondary/70 text-xs">
          {card.authorAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.authorAvatar} alt="" className="h-6 w-6 rounded-full" />
          ) : (
            card.authorName.slice(0, 1).toUpperCase()
          )}
        </div>
        <span className="text-xs">
          <span className="font-medium">@{card.authorName}</span>
          <span className="text-muted-foreground"> 的个人推荐</span>
        </span>
        <span className="ml-auto text-[11px] text-muted-foreground">{timeAgo(card.createdAt)}</span>
      </div>

      <p className="text-sm font-medium leading-snug">{card.headline}</p>
      {card.body && <p className="mt-1 text-xs text-muted-foreground">{card.body}</p>}

      {card.sourceUrl && (
        <a
          href={card.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          {card.sourceTitle ?? "查看来源"}
        </a>
      )}

      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
        <button onClick={() => vote(1)} disabled={pending} className="flex items-center gap-1 hover:text-yes">
          <ThumbsUp className="h-3.5 w-3.5" />
        </button>
        <span className="font-mono">{score}</span>
        <button onClick={() => vote(-1)} disabled={pending} className="flex items-center gap-1 hover:text-no">
          <ThumbsDown className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function AddCardDialog({ marketId }: { marketId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [stance, setStance] = useState<Stance>("YES");
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (headline.trim().length < 3) {
      toast.error("请填写一句话观点");
      return;
    }
    startTransition(async () => {
      const r = await addCardAction({ marketId, stance, headline, body, sourceUrl });
      if ("error" in r) {
        toast.error(r.error);
      } else {
        toast.success("已发布你的个人推荐");
        setHeadline("");
        setBody("");
        setSourceUrl("");
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="secondary" className="rounded-full border border-primary/35 bg-primary/15">
            + 贡献信息
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>贡献一条信息</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="mb-1 block text-xs">立场</Label>
            <div className="flex gap-2">
              {(["YES", "NO", "NEUTRAL"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStance(s)}
                  className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition-colors ${
                    stance === s ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground"
                  }`}
                >
                  {STANCE_META[s].label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="headline" className="mb-1 block text-xs">
              一句话观点 *
            </Label>
            <Input id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={140} />
          </div>
          <div>
            <Label htmlFor="body" className="mb-1 block text-xs">
              理由 / 正文(选填)
            </Label>
            <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
          </div>
          <div>
            <Label htmlFor="src" className="mb-1 block text-xs">
              来源链接(选填,鼓励)
            </Label>
            <Input id="src" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={pending}>
            {pending ? "发布中…" : "发布个人推荐"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function InfoCardsSection({
  marketId,
  cards,
  loggedIn,
}: {
  marketId: string;
  cards: CardData[];
  loggedIn: boolean;
}) {
  const [sort, setSort] = useState<"top" | "new">("top");

  const sorted = useMemo(() => {
    const arr = [...cards];
    arr.sort((a, b) =>
      sort === "new"
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : b.score - a.score || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return arr;
  }, [cards, sort]);

  const columns: { stance: Stance }[] = [{ stance: "YES" }, { stance: "NO" }, { stance: "NEUTRAL" }];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          社区信息 <span className="text-sm font-normal text-muted-foreground">({cards.length})</span>
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-border/70 bg-background/35 p-0.5 text-xs">
            <button
              onClick={() => setSort("top")}
              className={`rounded-full px-2.5 py-1 ${sort === "top" ? "bg-primary/20 text-foreground" : "text-muted-foreground"}`}
            >
              最有用
            </button>
            <button
              onClick={() => setSort("new")}
              className={`rounded-full px-2.5 py-1 ${sort === "new" ? "bg-primary/20 text-foreground" : "text-muted-foreground"}`}
            >
              最新
            </button>
          </div>
          <AddCardDialog marketId={marketId} />
        </div>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        以下内容均为用户的个人观点与推荐,不代表平台立场。
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {columns.map(({ stance }) => {
          const list = sorted.filter((c) => c.stance === stance);
          const meta = STANCE_META[stance];
          return (
            <div key={stance}>
              <div className={`mb-2 text-sm font-semibold ${meta.text}`}>
                {meta.label} <span className="text-muted-foreground">({list.length})</span>
              </div>
              <div className="space-y-3">
                {list.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                    暂无
                  </p>
                ) : (
                  list.map((c) => (
                    <InfoCardItem key={c.id} card={c} marketId={marketId} loggedIn={loggedIn} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

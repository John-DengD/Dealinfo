"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { proposeAction } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Mode = "single" | "multi";

export default function ProposePage() {
  const [state, formAction, pending] = useActionState(proposeAction, {});
  const [mode, setMode] = useState<Mode>("single");
  const [outcomes, setOutcomes] = useState<string[]>(["", ""]);

  const setOutcome = (i: number, v: string) =>
    setOutcomes((prev) => prev.map((o, idx) => (idx === i ? v : o)));
  const addOutcome = () => setOutcomes((prev) => [...prev, ""]);
  const removeOutcome = (i: number) =>
    setOutcomes((prev) => (prev.length <= 2 ? prev : prev.filter((_, idx) => idx !== i)));

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">提议一个新市场</CardTitle>
          <p className="text-sm text-muted-foreground">提交后由管理员审核并设置流动性,通过后即可交易。</p>
        </CardHeader>
        <CardContent>
          {state.ok ? (
            <div className="space-y-3 text-center">
              <p className="text-yes">✓ 已提交,等待管理员审核。</p>
              <Link href="/" className="inline-block text-primary hover:underline">
                返回首页
              </Link>
            </div>
          ) : (
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="mode" value={mode} />

              {/* 单一 Yes/No 还是 多结果事件 */}
              <div className="flex gap-2 rounded-xl border border-border/70 bg-background/40 p-1">
                {(["single", "multi"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-black transition-colors ${
                      mode === m ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m === "single" ? "单一 Yes/No" : "多结果事件"}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="title">
                  {mode === "single" ? "问题标题(需有明确 Yes/No 结果)" : "事件标题"}
                </Label>
                <Input
                  id="title"
                  name="title"
                  required
                  minLength={5}
                  placeholder={mode === "single" ? "例如:2026 年底前 X 会发生吗?" : "例如:2026 年美联储 9 月利率决议"}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">市场说明 / 结算规则</Label>
                <Textarea id="description" name="description" rows={4} placeholder="说明这个问题如何判定结果。" />
              </div>

              {mode === "multi" && (
                <div className="space-y-2">
                  <Label>结果选项(至少 2 个,每个独立买卖 Yes/No)</Label>
                  {outcomes.map((o, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        name="outcome"
                        value={o}
                        onChange={(e) => setOutcome(i, e.target.value)}
                        placeholder={`结果 ${i + 1},例如:加息 25bps`}
                      />
                      {outcomes.length > 2 && (
                        <Button type="button" variant="destructive" size="sm" onClick={() => removeOutcome(i)}>
                          删除
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addOutcome}>
                    + 添加结果
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="category">分类</Label>
                  <Input id="category" name="category" placeholder="政治 / 加密 / 体育…" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="closesAt">交易截止时间</Label>
                  <Input id="closesAt" name="closesAt" type="datetime-local" required />
                </div>
              </div>

              {state.error && <p className="text-sm text-no">{state.error}</p>}
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "提交中…" : "提交提议"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

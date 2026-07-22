"use client";

import { useActionState } from "react";
import Link from "next/link";
import { proposeAction } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ProposePage() {
  const [state, formAction, pending] = useActionState(proposeAction, {});

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">提议一个新市场</CardTitle>
          <p className="text-sm text-muted-foreground">
            提交后由管理员审核并设置流动性,通过后即可交易。
          </p>
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
              <div className="space-y-1.5">
                <Label htmlFor="title">问题标题(需有明确 Yes/No 结果)</Label>
                <Input id="title" name="title" required minLength={5} placeholder="例如:2026 年底前 X 会发生吗?" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">市场说明 / 结算规则</Label>
                <Textarea id="description" name="description" rows={4} placeholder="说明这个问题如何判定 Yes / No。" />
              </div>
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

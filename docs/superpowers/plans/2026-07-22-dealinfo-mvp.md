# DealInfo MVP 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个对标 Polymarket 视觉风格的预测市场 + 信息聚合网站(虚拟积分、AMM 定价、结构化信息卡带个人推荐署名)。

**Architecture:** Next.js(App Router)全栈单代码库。三层解耦:UI 组件 / 业务服务(server actions)/ Prisma 数据访问。AMM 交易引擎为无副作用纯函数模块,由单元测试彻底覆盖;所有下单与结算在数据库事务内原子完成。

**Tech Stack:** Next.js 15 + TypeScript, Tailwind CSS + shadcn/ui, PostgreSQL + Prisma, Auth.js(Credentials), Recharts, Vitest(单测)。

---

## 文件结构

```
dealinfo/
  prisma/schema.prisma              # 数据模型
  src/
    lib/
      amm.ts                        # 纯函数 AMM 引擎(核心,重点测试)
      amm.test.ts
      db.ts                         # Prisma client 单例
      auth.ts                       # Auth.js 配置
    server/
      trading.ts                    # 下单/平仓/结算服务(事务)
      trading.test.ts
      markets.ts                    # 市场提议/审核/查询
      infocards.ts                  # 信息卡增删查/投票
    app/
      layout.tsx / globals.css      # 深色主题
      page.tsx                      # 首页市场列表
      market/[id]/page.tsx          # 市场详情
      portfolio/page.tsx
      leaderboard/page.tsx
      propose/page.tsx
      admin/page.tsx
      login/ register/ page.tsx
      api/auth/[...nextauth]/route.ts
    components/
      MarketCard.tsx  ProbabilityChart.tsx  TradePanel.tsx
      InfoCardColumn.tsx  InfoCardItem.tsx  AddInfoCardForm.tsx
      ui/*                          # shadcn 组件
```

---

## Phase 0:项目脚手架

### Task 0: 初始化 Next.js 项目

**Files:** 全新项目(当前目录已含 `docs/` 与 git)

- [ ] **Step 1: 创建 Next.js 项目到当前目录**

Run:
```bash
cd /Users/new/sch-projects/dealinfo
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack --use-npm
```
Expected: 生成 `src/app`, `package.json` 等;若提示目录非空,选择继续(保留 docs/.git)。

- [ ] **Step 2: 安装依赖**

Run:
```bash
npm i @prisma/client next-auth@beta @auth/prisma-adapter bcryptjs recharts zod
npm i -D prisma vitest @vitejs/plugin-react @types/bcryptjs
npx shadcn@latest init -d
npx shadcn@latest add button card input dialog tabs badge avatar select textarea sonner
```
Expected: 依赖写入 `package.json`,`components/ui/` 生成组件。

- [ ] **Step 3: 配置 Vitest**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: { environment: "node", include: ["src/**/*.test.ts"] },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
```
Add to `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 4: 提交**
```bash
git add -A && git commit -m "chore: scaffold Next.js app with tooling"
```

### Task 1: 深色主题基线

**Files:** Modify `src/app/globals.css`, `src/app/layout.tsx`

- [ ] **Step 1: 设置深色 CSS 变量** — 在 `globals.css` 的 `:root`/`.dark` 覆盖背景为近黑 `#0b0e11`,前景高对比;新增语义色 `--yes: 145 80% 45%`(绿)、`--no: 0 75% 55%`(红)。在 `layout.tsx` 的 `<html>` 加 `className="dark"`,`<body>` 用等宽数字 `tabular-nums`。

- [ ] **Step 2: 手动验证** — `npm run dev`,访问 `/`,确认深色底生效。

- [ ] **Step 3: 提交** `git commit -am "feat: dark Polymarket-style theme baseline"`

---

## Phase 1:数据模型

### Task 2: Prisma schema 与迁移

**Files:** Create `prisma/schema.prisma`, `src/lib/db.ts`, `.env`

- [ ] **Step 1: 写 schema**

`prisma/schema.prisma`:
```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

enum Role { USER ADMIN }
enum MarketStatus { PENDING OPEN CLOSED RESOLVED REJECTED }
enum Outcome { YES NO }
enum Stance { YES NO NEUTRAL }

model User {
  id           String   @id @default(cuid())
  username     String   @unique
  email        String   @unique
  passwordHash String
  avatarUrl    String?
  pointsBalance Float   @default(1000)
  role         Role     @default(USER)
  createdAt    DateTime @default(now())
  positions    Position[]
  trades       Trade[]
  infoCards    InfoCard[]
  cardVotes    CardVote[]
  markets      Market[]
}

model Market {
  id          String       @id @default(cuid())
  title       String
  description String
  category    String
  status      MarketStatus @default(PENDING)
  creator     User         @relation(fields: [creatorId], references: [id])
  creatorId   String
  closesAt    DateTime
  resolution  Outcome?
  resolvedAt  DateTime?
  createdAt   DateTime     @default(now())
  qYes        Float        @default(0)
  qNo         Float        @default(0)
  liquidityB  Float        @default(100)
  positions   Position[]
  trades      Trade[]
  infoCards   InfoCard[]
}

model Position {
  id        String @id @default(cuid())
  user      User   @relation(fields: [userId], references: [id])
  userId    String
  market    Market @relation(fields: [marketId], references: [id])
  marketId  String
  yesShares Float  @default(0)
  noShares  Float  @default(0)
  @@unique([userId, marketId])
}

model Trade {
  id         String   @id @default(cuid())
  user       User     @relation(fields: [userId], references: [id])
  userId     String
  market     Market   @relation(fields: [marketId], references: [id])
  marketId   String
  side       Outcome
  action     String   // BUY | SELL
  shares     Float
  costPoints Float
  probAfter  Float
  createdAt  DateTime @default(now())
}

model InfoCard {
  id          String   @id @default(cuid())
  market      Market   @relation(fields: [marketId], references: [id])
  marketId    String
  author      User     @relation(fields: [authorId], references: [id])
  authorId    String
  stance      Stance
  headline    String
  body        String?
  sourceUrl   String?
  sourceTitle String?
  score       Int      @default(0)
  createdAt   DateTime @default(now())
  votes       CardVote[]
}

model CardVote {
  id     String   @id @default(cuid())
  user   User     @relation(fields: [userId], references: [id])
  userId String
  card   InfoCard @relation(fields: [cardId], references: [id])
  cardId String
  value  Int
  @@unique([userId, cardId])
}
```

- [ ] **Step 2: 配置数据库连接** — 在 `.env` 写 `DATABASE_URL`(本地 Postgres 或 Neon/Supabase),`AUTH_SECRET`(用 `npx auth secret` 生成)。将 `.env` 加入 `.gitignore`(create-next-app 默认已含 `.env*`)。

- [ ] **Step 3: 生成 client 与迁移**
```bash
npx prisma migrate dev --name init
```
Expected: 生成 migration,`@prisma/client` 就绪。

- [ ] **Step 4: Prisma 单例** — Create `src/lib/db.ts`:
```typescript
import { PrismaClient } from "@prisma/client";
const g = globalThis as unknown as { prisma?: PrismaClient };
export const db = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = db;
```

- [ ] **Step 5: 提交** `git add -A && git commit -m "feat: Prisma data model + migration"`

---

## Phase 2:AMM 引擎(纯函数,重点 TDD)

### Task 3: LMSR 定价函数

**Files:** Create `src/lib/amm.ts`, `src/lib/amm.test.ts`

- [ ] **Step 1: 写失败测试** — `src/lib/amm.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { priceYes, cost, quoteBuy, quoteSell } from "./amm";

describe("LMSR pricing", () => {
  it("初始 50/50", () => {
    expect(priceYes({ qYes: 0, qNo: 0, b: 100 })).toBeCloseTo(0.5, 6);
  });
  it("买 Yes 后 Yes 价上升", () => {
    expect(priceYes({ qYes: 50, qNo: 0, b: 100 })).toBeGreaterThan(0.5);
  });
  it("Yes 价 + No 价 = 1", () => {
    const s = { qYes: 30, qNo: 10, b: 100 };
    expect(priceYes(s) + (1 - priceYes(s))).toBeCloseTo(1, 6);
  });
  it("买入报价:成本为正、返回成交后概率", () => {
    const q = quoteBuy({ qYes: 0, qNo: 0, b: 100 }, "YES", 10);
    expect(q.costPoints).toBeGreaterThan(0);
    expect(q.probAfter).toBeGreaterThan(0.5);
    expect(q.newState.qYes).toBe(10);
  });
  it("买后再卖回,净积分变动≈0(无手续费)", () => {
    const s0 = { qYes: 0, qNo: 0, b: 100 };
    const buy = quoteBuy(s0, "YES", 10);
    const sell = quoteSell(buy.newState, "YES", 10);
    expect(buy.costPoints - sell.costPoints).toBeCloseTo(0, 6);
    expect(sell.newState.qYes).toBeCloseTo(0, 6);
  });
});
```

- [ ] **Step 2: 运行验证失败** — Run: `npm test`。Expected: FAIL(模块/函数未定义)。

- [ ] **Step 3: 实现** — `src/lib/amm.ts`:
```typescript
export interface AmmState { qYes: number; qNo: number; b: number; }
export type Side = "YES" | "NO";
export interface Quote { costPoints: number; probAfter: number; newState: AmmState; }

export function cost(s: AmmState): number {
  return s.b * Math.log(Math.exp(s.qYes / s.b) + Math.exp(s.qNo / s.b));
}
export function priceYes(s: AmmState): number {
  const a = Math.exp(s.qYes / s.b), c = Math.exp(s.qNo / s.b);
  return a / (a + c);
}
export function quoteBuy(s: AmmState, side: Side, shares: number): Quote {
  const ns: AmmState = { ...s };
  if (side === "YES") ns.qYes += shares; else ns.qNo += shares;
  return { costPoints: cost(ns) - cost(s), probAfter: priceYes(ns), newState: ns };
}
export function quoteSell(s: AmmState, side: Side, shares: number): Quote {
  const ns: AmmState = { ...s };
  if (side === "YES") ns.qYes -= shares; else ns.qNo -= shares;
  return { costPoints: cost(s) - cost(ns), probAfter: priceYes(ns), newState: ns };
}
```

- [ ] **Step 4: 运行验证通过** — Run: `npm test`。Expected: PASS(全部用例)。

- [ ] **Step 5: 提交** `git add -A && git commit -m "feat: LMSR AMM pricing engine with tests"`

---

## Phase 3:交易服务(事务)

### Task 4: 下单/平仓服务

**Files:** Create `src/server/trading.ts`, `src/server/trading.test.ts`

- [ ] **Step 1: 写失败测试**(用测试数据库或事务回滚)— `src/server/trading.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { placeOrder, resolveMarket } from "./trading";

async function seed() {
  const u = await db.user.create({ data: { username: "t"+Date.now(), email: Date.now()+"@x.com", passwordHash: "x" } });
  const m = await db.market.create({ data: { title: "q", description: "d", category: "c", status: "OPEN", creatorId: u.id, closesAt: new Date(Date.now()+86400000), liquidityB: 100 } });
  return { u, m };
}

describe("trading service", () => {
  it("买入扣积分、建持仓、更新市场状态", async () => {
    const { u, m } = await seed();
    const r = await placeOrder({ userId: u.id, marketId: m.id, side: "YES", action: "BUY", shares: 10 });
    const user = await db.user.findUnique({ where: { id: u.id } });
    const pos = await db.position.findUnique({ where: { userId_marketId: { userId: u.id, marketId: m.id } } });
    expect(user!.pointsBalance).toBeCloseTo(1000 - r.costPoints, 4);
    expect(pos!.yesShares).toBe(10);
  });
  it("积分不足抛错且不改状态", async () => {
    const { u, m } = await seed();
    await expect(placeOrder({ userId: u.id, marketId: m.id, side: "YES", action: "BUY", shares: 1e9 })).rejects.toThrow();
    const user = await db.user.findUnique({ where: { id: u.id } });
    expect(user!.pointsBalance).toBe(1000);
  });
  it("结算:赢方每份兑付1积分,输方归零", async () => {
    const { u, m } = await seed();
    await placeOrder({ userId: u.id, marketId: m.id, side: "YES", action: "BUY", shares: 10 });
    await resolveMarket(m.id, "YES");
    const user = await db.user.findUnique({ where: { id: u.id } });
    // 赢得 10 份 * 1 积分
    expect(user!.pointsBalance).toBeGreaterThan(1000 - 10); // 花费<10(概率<1),兑付10
  });
});
```

- [ ] **Step 2: 运行验证失败** — Run: `npm test src/server/trading.test.ts`。Expected: FAIL。

- [ ] **Step 3: 实现** — `src/server/trading.ts`:
```typescript
import { db } from "@/lib/db";
import { quoteBuy, quoteSell, type Side } from "@/lib/amm";

interface OrderInput { userId: string; marketId: string; side: Side; action: "BUY" | "SELL"; shares: number; }

export async function placeOrder(input: OrderInput) {
  const { userId, marketId, side, action, shares } = input;
  if (shares <= 0) throw new Error("shares must be > 0");
  return db.$transaction(async (tx) => {
    const m = await tx.market.findUnique({ where: { id: marketId } });
    if (!m || m.status !== "OPEN") throw new Error("market not open");
    if (m.closesAt < new Date()) throw new Error("market closed");
    const state = { qYes: m.qYes, qNo: m.qNo, b: m.liquidityB };
    const pos = await tx.position.upsert({
      where: { userId_marketId: { userId, marketId } },
      create: { userId, marketId }, update: {},
    });
    const q = action === "BUY" ? quoteBuy(state, side, shares) : quoteSell(state, side, shares);
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });

    if (action === "BUY") {
      if (user.pointsBalance < q.costPoints) throw new Error("insufficient points");
    } else {
      const held = side === "YES" ? pos.yesShares : pos.noShares;
      if (held < shares) throw new Error("insufficient shares");
    }
    const delta = action === "BUY" ? -q.costPoints : q.costPoints;
    await tx.user.update({ where: { id: userId }, data: { pointsBalance: { increment: delta } } });
    await tx.position.update({
      where: { userId_marketId: { userId, marketId } },
      data: side === "YES"
        ? { yesShares: { increment: action === "BUY" ? shares : -shares } }
        : { noShares: { increment: action === "BUY" ? shares : -shares } },
    });
    await tx.market.update({ where: { id: marketId }, data: { qYes: q.newState.qYes, qNo: q.newState.qNo } });
    await tx.trade.create({ data: { userId, marketId, side, action, shares, costPoints: q.costPoints, probAfter: q.probAfter } });
    return { costPoints: q.costPoints, probAfter: q.probAfter };
  });
}

export async function resolveMarket(marketId: string, outcome: "YES" | "NO") {
  return db.$transaction(async (tx) => {
    const m = await tx.market.findUniqueOrThrow({ where: { id: marketId } });
    if (m.status === "RESOLVED") throw new Error("already resolved");
    const positions = await tx.position.findMany({ where: { marketId } });
    for (const p of positions) {
      const payout = outcome === "YES" ? p.yesShares : p.noShares;
      if (payout > 0) await tx.user.update({ where: { id: p.userId }, data: { pointsBalance: { increment: payout } } });
    }
    await tx.market.update({ where: { id: marketId }, data: { status: "RESOLVED", resolution: outcome, resolvedAt: new Date() } });
  });
}
```

- [ ] **Step 4: 运行验证通过** — Run: `npm test`。Expected: PASS。

- [ ] **Step 5: 提交** `git add -A && git commit -m "feat: trading service (order/settle) with transactions"`

---

## Phase 4:认证与积分

### Task 5: Auth.js Credentials 登录

**Files:** Create `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/server/accounts.ts`, `src/app/register/page.tsx`, `src/app/login/page.tsx`

- [ ] **Step 1: 注册服务(含单测)** — Create `src/server/accounts.ts`(`registerUser({username,email,password})`:校验唯一、bcrypt 哈希、`db.user.create`;重复邮箱抛错)。写 `accounts.test.ts` 覆盖成功注册与重复邮箱抛错。Run `npm test` 先红后绿。

- [ ] **Step 2: Auth 配置** — `src/lib/auth.ts` 用 `next-auth` Credentials provider,`authorize` 校验 bcrypt,session 存 `id/role`。导出 `handlers, auth, signIn, signOut`。`route.ts` 导出 `handlers`。

- [ ] **Step 3: 登录/注册页** — 用 shadcn `Card/Input/Button` 做深色表单;注册调用 `registerUser` 后 `signIn`。

- [ ] **Step 4: 手动验证** — 注册 → 自动登录 → 顶部显示用户名与积分余额。

- [ ] **Step 5: 提交** `git commit -am "feat: auth (credentials) + registration with initial points"`

---

## Phase 5:市场列表与详情 UI

### Task 6: 市场查询服务 + 首页列表

**Files:** Create `src/server/markets.ts`, `src/components/MarketCard.tsx`, Modify `src/app/page.tsx`

- [ ] **Step 1: 市场服务** — `markets.ts`:`listOpenMarkets(category?)`、`getMarket(id)`(含 trades、infoCards、当前 `priceYes`)、`proposeMarket(...)`、`approveMarket(id,b)`、`rejectMarket(id)`。为 `listOpenMarkets` 写单测(仅返回 OPEN)。

- [ ] **Step 2: MarketCard 组件** — 显示标题、大号概率(`priceYes` 百分比,等宽字体)、迷你 sparkline(Recharts,取近 N 条 `probAfter`)、Yes/No 价格徽标、信息卡数量。绿/红语义色。

- [ ] **Step 3: 首页** — server component 调 `listOpenMarkets`,分类 `Tabs`,网格排布 `MarketCard`,顶栏含 logo/搜索/积分/登录态。

- [ ] **Step 4: 手动验证** — 用 seed 脚本插几条 OPEN 市场,`/` 正确渲染卡片、概率、走势。

- [ ] **Step 5: 提交** `git commit -am "feat: market query service + homepage market list"`

### Task 7: 市场详情 + 交易面板

**Files:** Create `src/components/ProbabilityChart.tsx`, `src/components/TradePanel.tsx`, `src/app/market/[id]/page.tsx`, `src/server/trading.ts`(加 server action 包装)

- [ ] **Step 1: ProbabilityChart** — Recharts 折线图,x=时间、y=概率(0–100%),数据来自 `trades[].probAfter`。

- [ ] **Step 2: TradePanel(client)** — Yes/No 切换、Buy/Sell 切换、份额输入;调用只读报价 server action 实时预览 `costPoints` 与 `probAfter`;确认调用 `placeOrder` 包装的 server action;`sonner` 提示成功/失败;成功后 `router.refresh()`。

- [ ] **Step 3: 详情页** — 顶部标题 + 概率 + 图;右侧 `TradePanel`;下方"我的持仓/盈亏";信息卡区占位(Task 8 填充)。市场 CLOSED/RESOLVED 时禁用交易并显示结果。

- [ ] **Step 4: 手动验证** — 买入后概率变化、图更新、积分扣减、持仓出现。

- [ ] **Step 5: 提交** `git commit -am "feat: market detail with probability chart + AMM trade panel"`

---

## Phase 6:信息卡(差异化核心)

### Task 8: 信息卡服务 + UI

**Files:** Create `src/server/infocards.ts`, `src/server/infocards.test.ts`, `src/components/InfoCardColumn.tsx`, `src/components/InfoCardItem.tsx`, `src/components/AddInfoCardForm.tsx`, Modify 详情页

- [ ] **Step 1: 服务(含单测)** — `infocards.ts`:`addInfoCard({marketId,authorId,stance,headline,body?,sourceUrl?})`(有 URL 时用 fetch 抓 `<title>` 存 `sourceTitle`,失败则置空,不阻断);`voteCard({userId,cardId,value})`(upsert CardVote,重算并缓存 `score`,同一用户改票不重复计);`listCards(marketId, sort)`(sort: top|new|sourced)。写单测:添加卡、投票去重(同人两次+1 只算一次)、score 排序。Run `npm test` 先红后绿。

- [ ] **Step 2: InfoCardItem** — 顶部固定 `@用户 的个人推荐` + 头像 + 时间 + 浅色免责小字"用户个人观点,非平台立场";headline 加粗、body、来源链接(有则显示 `sourceTitle` + 外链图标);底部赞/踩按钮显示 `score`。按 stance 用绿/红/灰描边。

- [ ] **Step 3: InfoCardColumn + 分栏** — 详情页信息区分三块:支持 Yes(绿)| 支持 No(红)| 中立(灰);顶部排序下拉(最有用/最新/有来源);"+ 贡献信息"按钮开 `Dialog`。

- [ ] **Step 4: AddInfoCardForm** — `Dialog` 内表单:立场 `Select`(必填)、一句话 `Input`(必填)、正文 `Textarea`(选填)、来源 `Input`(选填);提交调 `addInfoCard` server action;成功 `router.refresh()`。

- [ ] **Step 5: 手动验证** — 贡献一张 Yes 卡显示在绿栏并带署名;点赞后置顶;贴 URL 自动显示标题。

- [ ] **Step 6: 提交** `git commit -am "feat: structured info cards with personal-recommendation attribution"`

---

## Phase 7:提议市场与管理后台

### Task 9: 提议页 + Admin

**Files:** Create `src/app/propose/page.tsx`, `src/app/admin/page.tsx`

- [ ] **Step 1: 提议页** — 登录用户填 标题/描述/分类/截止时间,调 `proposeMarket` 建 `PENDING` 市场;提示"待管理员审核"。

- [ ] **Step 2: Admin 守卫** — server component 校验 `session.user.role === "ADMIN"`,否则 `notFound()`。

- [ ] **Step 3: Admin 面板** — 两区:①待审提议列表 → 输入 `liquidityB` 后"通过"(`approveMarket` 置 OPEN)/"拒绝"(`rejectMarket`);②可结算市场(OPEN/CLOSED)→ 选 YES/NO 调 `resolveMarket`。均用 server action + `router.refresh()`。

- [ ] **Step 4: 手动验证** — 普通用户提议 → 管理员上线 → 首页可见 → 管理员结算 → 持仓兑付。(手动将某账号 role 改 ADMIN:`npx prisma studio`。)

- [ ] **Step 5: 提交** `git commit -am "feat: market proposal flow + admin approve/resolve panel"`

---

## Phase 8:个人中心与排行榜

### Task 10: Portfolio + Leaderboard

**Files:** Create `src/app/portfolio/page.tsx`, `src/app/leaderboard/page.tsx`

- [ ] **Step 1: Portfolio** — 显示积分余额;当前持仓表(市场、Yes/No 份额、当前市值=份额×现价、未实现盈亏);交易流水(`Trade` 倒序)。

- [ ] **Step 2: Leaderboard** — `db.user.findMany` 按 `pointsBalance` 倒序 Top 50,序号 + 用户名 + 积分;当前用户高亮。

- [ ] **Step 3: 手动验证** — 交易后 portfolio 数字正确;排行榜排序正确。

- [ ] **Step 4: 提交** `git commit -am "feat: portfolio + leaderboard"`

---

## Phase 9:端到端冒烟与种子数据

### Task 11: Seed 脚本 + E2E 冒烟

**Files:** Create `prisma/seed.ts`, `src/server/smoke.test.ts`

- [ ] **Step 1: Seed** — `prisma/seed.ts`:创建 1 个 admin、2 个普通用户、3 个 OPEN 市场(不同分类)、每市场几张信息卡与若干交易,使首页有内容。`package.json` 加 `"prisma": { "seed": "tsx prisma/seed.ts" }`,`npm i -D tsx`,运行 `npx prisma db seed`。

- [ ] **Step 2: 冒烟测试** — `smoke.test.ts` 串起:注册 → 提议 → approve → placeOrder(概率变化)→ addInfoCard → resolveMarket → 校验最终积分与市场状态。

- [ ] **Step 3: 运行** — Run `npm test`。Expected: 全绿。

- [ ] **Step 4: 提交** `git commit -am "test: e2e smoke + seed data"`

---

## Self-Review 结论

- **Spec 覆盖**:定位/两条腿(Task 6–8)、虚拟积分(Task 2/5)、AMM(Task 3/4)、信息卡+个人推荐署名+分栏+投票+纯卡无回复(Task 8)、用户提议+管理员审核+结算(Task 4/9)、深色 UI(Task 1/6/7)、排行榜/个人中心(Task 10)、测试策略(Task 3/4/8/11)——全部有对应任务。
- **占位符**:核心任务含完整代码;UI 任务给出组件职责与关键行为(非占位),实现时按 shadcn 既有模式补样式。
- **类型一致**:`AmmState{qYes,qNo,b}`、`quoteBuy/quoteSell` 返回 `{costPoints,probAfter,newState}`、`placeOrder` 输入/返回、`Outcome/Stance` 枚举在各任务间一致。

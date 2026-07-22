# DealInfo

对标 Polymarket 视觉风格的**预测市场 + 信息聚合**平台。用虚拟积分交易事件概率,
每个市场下聚合来自用户、带「个人推荐」署名的结构化信息卡。

## 技术栈
Next.js 16(App Router)· TypeScript · Tailwind v4 + shadcn/ui · PostgreSQL + Prisma ·
Auth.js(Credentials)· Recharts · Vitest · LMSR 自动做市引擎。

## 本地启动

数据库为远程 PostgreSQL,通过 SSH 隧道访问(详见 `docs/INFRA.md`)。

```bash
npm install
npm run db:tunnel      # 建立到远程数据库的 SSH 隧道(开发/测试前先跑)
npm run dev            # http://localhost:3000
```

首次或想要演示数据:

```bash
npx prisma migrate dev   # 应用数据库迁移
npx prisma db seed       # 灌入演示数据
```

演示账号(seed 后可用):
- 管理员:`admin@dealinfo.dev` / `admin123`(可进 `/admin` 审核提议、结算市场)
- 用户:`alice@dealinfo.dev` / `demo123`,`bob@dealinfo.dev` / `demo123`

## 测试

```bash
npm run db:tunnel   # 依赖数据库的测试需要隧道
npm test            # AMM 引擎 + 交易/注册/信息卡服务 + 端到端冒烟(22 用例)
```

## 文档
- 设计:`docs/superpowers/specs/2026-07-22-dealinfo-prediction-market-design.md`
- 实现计划:`docs/superpowers/plans/2026-07-22-dealinfo-mvp.md`
- 基础设施 / 数据库:`docs/INFRA.md`

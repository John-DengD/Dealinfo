# DealInfo — 预测市场 + 信息聚合平台 设计文档

日期:2026-07-22
状态:已批准(用户授权直接实现)

## 1. 产品定位

一个对标 **Polymarket** 视觉风格的网站,核心为**预测市场 + 信息聚合并重**:

- **预测市场**:用户用**虚拟积分**对有明确结果的事件下注(买卖 Yes/No 份额),价格即概率。
- **信息聚合**:每个市场下挂载用户贡献的**结构化"信息卡"**,每张卡明确标注 **`@用户 的个人推荐`**,强调是个人观点、非平台推送。信息卡按立场(Yes/No/中立)分栏聚合,帮助浏览者快速判断。

两条腿互相导流:看信息的人来下注,下注的人来贡献信息。

### 关键决策(已确认)
- 下注货币:**虚拟积分**(不涉及真钱、支付、区块链、KYC)。
- 交易机制:**AMM(LMSR 对数市场评分规则)**。
- 信息形式:**结构化信息卡**(非评论区),纯卡片、**不支持回复/盖楼**,但可点赞/点踩排序。
- 市场来源:**用户提议 → 管理员审核上线**;结果**由管理员判定**。
- 视觉风格:**Polymarket 深色金融终端风,要"酷"**。

## 2. 技术架构

- **全栈**:Next.js(App Router)+ TypeScript,单代码库。
- **样式**:Tailwind CSS + shadcn/ui,深色主题。
- **数据库**:PostgreSQL + Prisma ORM。
- **认证**:Auth.js(NextAuth),邮箱/用户名 + 密码。
- **图表**:Recharts(概率走势折线图 / 卡片迷你 sparkline)。
- **部署**:Vercel + 托管 Postgres(Neon/Supabase)。

### 分层(职责单一、可独立测试)
1. **UI 层**(React 组件):仅展示与交互,无业务逻辑。
2. **业务服务层**(server actions / API routes):AMM 定价、下单、结算、积分变动、信息卡增删改查、市场审核。与 UI 完全解耦。
3. **数据访问层**(Prisma):仅数据库读写。

**核心原则**:AMM 交易引擎写成**纯函数模块**(输入:市场 AMM 状态 + 交易量;输出:新价格、成交份额、积分变动),不依赖 DB/HTTP,由单元测试彻底覆盖。所有下单/结算在数据库事务内完成,防止并发导致积分为负或状态不一致。

## 3. 数据模型(Prisma)

- **User**:`id`, `username`, `email`, `passwordHash`, `avatarUrl`, `pointsBalance`(注册送 1000), `role`(user/admin), `createdAt`
- **Market**:`id`, `title`, `description`, `category`, `status`(pending/open/closed/resolved/rejected), `creatorId`, `closesAt`, `resolution`(YES/NO/null), `resolvedAt`, `createdAt`, AMM 状态:`qYes`, `qNo`, `liquidityB`
- **Position**:`userId`, `marketId`, `yesShares`, `noShares`(唯一约束:用户×市场)
- **Trade**:`id`, `userId`, `marketId`, `side`(YES/NO), `action`(BUY/SELL), `shares`, `costPoints`, `probAfter`, `createdAt`
- **InfoCard**:`id`, `marketId`, `authorId`, `stance`(YES/NO/NEUTRAL), `headline`(必填), `body`(选填), `sourceUrl`, `sourceTitle`, `score`(缓存净赞), `createdAt`
- **CardVote**:`userId`, `cardId`, `value`(+1/−1)(唯一约束:用户×卡)

说明:
- 概率走势图直接由 `Trade.probAfter` 时间序列绘制,不单建表。
- 市场提议 = `status=pending` 的 Market。
- 积分变动、持仓、Trade、AMM 状态更新在同一事务内原子完成。

## 4. AMM 机制(LMSR)

- 成本函数:`C = b · ln(e^(qYes/b) + e^(qNo/b))`
- Yes 价格(概率):`priceYes = e^(qYes/b) / (e^(qYes/b) + e^(qNo/b))`,`priceNo = 1 − priceYes`
- `liquidityB`:流动性参数,管理员建市场时设定(默认 100);越大越稳。
- **买入**:付出的积分 = 发行份额后 `C` 的增量;买 Yes 使 `qYes`↑,Yes 价↑。
- **卖出/平仓**:反向,按 `C` 减量退还积分,可随时套现。
- **结算**:管理员设 `resolution` 后,遍历持仓,赢方每份额兑付 1 积分、输方归零,批量写入,状态转 `resolved`。
- **边界**:下单校验余额;`closesAt` 到期或管理员关闭后禁止交易;全程事务保护。

## 5. 页面与 UI

深色底(近黑 `#0b0e11` 系)+ 高对比;Yes = 绿、No = 红;大号概率数字、等宽数字体、卡片式布局、走势折线图。整体金融终端质感。

页面:
1. `/`(首页 / 市场列表):分类 tab + 搜索;市场卡片显示标题、**大号概率 %**、迷你走势 sparkline、Yes/No 价格按钮、成交量/信息卡数量。
2. `/market/[id]`(市场详情):
   - 顶部:标题、概率、走势折线图。
   - 交易面板:买/卖、Yes/No、输入积分/份额、实时预览成交价与概率变化。
   - 我的持仓与盈亏。
   - **信息卡区(差异化核心)**:左右分栏(支持 Yes / 支持 No)+ 中立区;每卡顶部 `@用户 的个人推荐` 署名 + 头像 + 时间 + 浅色免责小字;可点赞/点踩;可按 最有用/最新/有来源 排序;「+ 贡献信息」按钮打开轻量表单(立场必填、一句话必填、正文/来源选填)。
3. `/portfolio`(我的):积分余额、当前持仓与盈亏、交易流水。
4. `/leaderboard`(排行榜):按积分排名。
5. `/propose`(提议市场):填标题/描述/分类/截止时间,提交为 pending。
6. `/admin`(管理后台):审核 pending 提议(通过设 `liquidityB` 上线 / 拒绝);对到期市场判定结果并结算。
7. `/login`、`/register`。

## 6. MVP 范围

**包含**:认证 + 初始积分;市场列表/详情;AMM 买卖/平仓;持仓与流水;信息卡(增/查/投票/分栏排序);用户提议市场 + 管理员审核;管理员结算;排行榜;深色 Polymarket 风 UI。

**暂不做(后续)**:真钱/支付/区块链;订单簿撮合;信息卡回复盖楼;通知系统;高级搜索/推荐算法;移动端 App。

## 7. 测试策略

- **AMM 纯函数**:单元测试覆盖定价、买入成本、卖出退款、价格和为 1、边界(超额买入、b 极值)。
- **服务层**:下单事务(余额不足回滚、并发)、结算正确性(赢方兑付、输方归零)、信息卡投票去重。
- **端到端(冒烟)**:注册 → 提议市场 → 管理员上线 → 下单 → 贡献信息卡 → 管理员结算 → 积分正确。

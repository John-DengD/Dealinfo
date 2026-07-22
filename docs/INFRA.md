# DealInfo 基础设施 / 环境说明

## 开发数据库(远程 PostgreSQL)

开发用的 PostgreSQL 跑在远程服务器上(不用本地 Docker/OrbStack)。

| 项目 | 值 |
| --- | --- |
| 服务器 IP | `39.106.87.162`(阿里云 · Ubuntu 24.04) |
| SSH 用户 | `root` |
| PostgreSQL 版本 | 16.14 |
| 数据库名 | `dealinfo` |
| 数据库用户 | `dealinfo`(拥有 `dealinfo` 库,具备 CREATEDB 以支持迁移影子库) |
| 服务器监听 | `0.0.0.0:5432`(仅回环/隧道使用) |

**所有密码/密钥都在项目根目录的 `.env` 里**(已被 `.gitignore` 忽略,不会进 git):
- `DATABASE_URL` — 数据库连接串(指向隧道本地端口)
- `AUTH_SECRET` — Auth.js 会话密钥
- `SERVER_SSH_HOST` / `SERVER_SSH_USER` / `SERVER_SSH_PASSWORD` — 服务器 SSH 凭据(供隧道脚本)
- `DB_TUNNEL_LOCAL_PORT` — 隧道本地端口(默认 `5433`)

> 安全说明:数据库**没有对公网开放**。阿里云安全组默认拦截 5432,我们不改它;而是通过 SSH 隧道(复用已开放的 22 端口)访问。因此本地连接的是 `localhost:5433`,由隧道转发到服务器上的 `localhost:5432`。

## 连接数据库前:先起隧道

每次开发、跑迁移或测试前,先建立隧道(保持后台运行即可):

```bash
bash scripts/db-tunnel.sh
```

隧道就绪后,本地即可通过 `localhost:5433` 访问远程数据库。常用命令:

```bash
npx prisma migrate dev      # 迁移
npx prisma studio           # 可视化查看数据
npm test                    # 运行测试(依赖数据库的部分)
npm run dev                 # 启动应用
```

若隧道断开(如网络切换),重新运行 `bash scripts/db-tunnel.sh` 即可。

## 上线时

生产环境应改用托管数据库(如阿里云 RDS / Neon / Supabase),把 `DATABASE_URL` 换成生产连接串,并关闭本地隧道方案。

#!/usr/bin/env node
/**
 * 每日热门市场——runner 侧搬运脚本(跑在 GitHub Actions 墙外机器上)。
 *
 * 流程:plan → fetch → run
 *   1. GET  {BASE}/api/cron/hot-markets/plan  拿到要抓的 Google News URL 清单
 *   2. 在墙外逐个 fetch 这些 RSS 的原始 XML(单个失败就跳过)
 *   3. POST {BASE}/api/cron/hot-markets/run   把原始 XML 送回服务器解析入库
 *
 * 只用 Node 内置能力(全局 fetch),无需 npm install。
 */

const BASE = process.env.DEALINFO_BASE_URL;
const SECRET = process.env.CRON_SECRET;
const FETCH_TIMEOUT_MS = 20000;

if (!BASE || !SECRET) {
  console.error("缺少环境变量 DEALINFO_BASE_URL 或 CRON_SECRET");
  process.exit(1);
}

const authHeaders = { authorization: `Bearer ${SECRET}` };

async function fetchXml(url) {
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; DealinfoBot/1.0)" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function main() {
  const planRes = await fetch(`${BASE}/api/cron/hot-markets/plan`, {
    headers: authHeaders,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!planRes.ok) {
    console.error(`plan 请求失败: HTTP ${planRes.status}`);
    process.exit(1);
  }
  const plan = await planRes.json();
  const planGenerate = plan.generate ?? [];
  const planResolve = plan.resolve ?? [];

  const generate = [];
  for (const entry of planGenerate) {
    try {
      generate.push({ category: entry.category, xml: await fetchXml(entry.url) });
    } catch (error) {
      console.error(`抓取分类[${entry.category}]失败,跳过: ${error}`);
    }
  }

  const resolve = [];
  for (const entry of planResolve) {
    try {
      resolve.push({ id: entry.id, xml: await fetchXml(entry.url) });
    } catch (error) {
      console.error(`抓取待结算市场[${entry.id}]失败,跳过: ${error}`);
    }
  }

  // 生成分类全部抓失败 = 真失败,标红退出
  if (planGenerate.length > 0 && generate.length === 0) {
    console.error("所有分类的热点抓取都失败了");
    process.exit(1);
  }

  console.log(`抓取完成: 生成 ${generate.length}/${planGenerate.length} 分类, 结算 ${resolve.length}/${planResolve.length} 市场`);

  const runRes = await fetch(`${BASE}/api/cron/hot-markets/run`, {
    method: "POST",
    headers: { ...authHeaders, "content-type": "application/json" },
    body: JSON.stringify({ generate, resolve }),
  });
  const text = await runRes.text();
  if (!runRes.ok) {
    console.error(`run 请求失败: HTTP ${runRes.status} ${text}`);
    process.exit(1);
  }

  console.log(`服务器返回: ${text}`);
  let result;
  try {
    result = JSON.parse(text);
  } catch {
    result = null;
  }
  if (result?.errors?.length) {
    console.error(`服务器处理时报错: ${JSON.stringify(result.errors)}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

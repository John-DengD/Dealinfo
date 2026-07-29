import { describe, expect, it } from "vitest";
import {
  buildCategoryFeedUrl,
  buildGoogleNewsRssUrl,
  buildGoogleNewsTopicUrl,
  buildResolveQuery,
  decideOutcomeFromItems,
  parseGoogleNewsXml,
  type AutoResolvableMarket,
} from "./hot-markets";

// 这些都是纯函数,不碰数据库,可脱离隧道单独跑。

describe("buildGoogleNewsRssUrl", () => {
  it("构造 Google News RSS URL 并追加 when:1d 与中文区域参数", () => {
    const url = buildGoogleNewsRssUrl("科技 AI");
    expect(url).toContain("news.google.com/rss/search");
    // URLSearchParams 用 + 表示空格,decodeURIComponent 不还原 +,需自行替换
    const decoded = decodeURIComponent(url).replace(/\+/g, " ");
    expect(decoded).toContain("科技 AI when:1d");
    expect(url).toContain("hl=zh-CN");
    expect(url).toContain("ceid=CN%3Azh-Hans");
  });
});

describe("buildGoogleNewsTopicUrl / buildCategoryFeedUrl", () => {
  it("主题 URL 指向 headlines/section/topic", () => {
    const url = buildGoogleNewsTopicUrl("TECHNOLOGY");
    expect(url).toContain("news.google.com/rss/headlines/section/topic/TECHNOLOGY");
    expect(url).toContain("ceid=CN%3Azh-Hans");
  });

  it("有 topic 走主题头条,无 topic 走搜索兜底", () => {
    expect(buildCategoryFeedUrl({ category: "科技", topic: "TECHNOLOGY" })).toContain(
      "/topic/TECHNOLOGY",
    );
    const search = buildCategoryFeedUrl({ category: "游戏电竞", query: "游戏" });
    expect(search).toContain("/rss/search");
    expect(decodeURIComponent(search).replace(/\+/g, " ")).toContain("游戏 when:1d");
  });
});

describe("parseGoogleNewsXml", () => {
  it("解析 item、去掉 utm/锚点、过滤过短标题", () => {
    const xml = `<rss><channel>
      <item>
        <title><![CDATA[某公司发布新一代芯片的重大消息]]></title>
        <link>https://news.example.com/a?utm_source=x#frag</link>
        <source url="https://x.com">示例来源</source>
        <pubDate>Mon, 27 Jul 2026 10:00:00 GMT</pubDate>
        <description><![CDATA[<b>摘要</b>正文内容]]></description>
      </item>
      <item><title>太短</title><link>https://news.example.com/b</link></item>
    </channel></rss>`;

    const items = parseGoogleNewsXml(xml);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("某公司发布新一代芯片的重大消息");
    expect(items[0].url).toBe("https://news.example.com/a");
    expect(items[0].sourceName).toBe("示例来源");
    expect(items[0].snippet).toContain("摘要");
  });

  it("空/无 item 的 xml 返回空数组", () => {
    expect(parseGoogleNewsXml("<rss></rss>")).toEqual([]);
  });
});

const yesMarket: AutoResolvableMarket = {
  id: "m1",
  title: "某队夺冠 是否会出现官方确认或重大后续?",
  description: "",
  category: "体育",
  sourceUrl: null,
  sourceName: null,
};

const denialMarket: AutoResolvableMarket = {
  id: "m2",
  title: "某明星恋情 是否会出现官方确认或重大后续?",
  description: "",
  category: "娱乐明星",
  sourceUrl: null,
  sourceName: null,
};

describe("buildResolveQuery", () => {
  it("从市场标题提取核心词并拼出结算搜索词", () => {
    expect(buildResolveQuery(denialMarket)).toBe("某明星恋情 确认 官方 结果 后续");
  });
});

describe("decideOutcomeFromItems", () => {
  it("命中核心词 + 有确认无否认 → YES", () => {
    const outcome = decideOutcomeFromItems(yesMarket, [
      { title: "某队夺冠 官方确认", url: "https://x", sourceName: "s", snippet: "结果已确认" },
    ]);
    expect(outcome).toBe("YES");
  });

  it("命中核心词 + 有否认无确认 → NO", () => {
    const outcome = decideOutcomeFromItems(denialMarket, [
      { title: "某明星恋情 已辟谣", url: "https://x", sourceName: "s", snippet: "经纪人否认" },
    ]);
    expect(outcome).toBe("NO");
  });

  it("无证据 → null", () => {
    expect(decideOutcomeFromItems(denialMarket, [])).toBeNull();
  });
});

import { describe, it, expect } from "vitest";
import { priceYes, cost, quoteBuy, quoteSell } from "./amm";

describe("LMSR pricing", () => {
  it("初始 qYes=qNo 时概率为 50%", () => {
    expect(priceYes({ qYes: 0, qNo: 0, b: 100 })).toBeCloseTo(0.5, 6);
  });

  it("买入 Yes 后 Yes 价格上升到 0.5 以上", () => {
    expect(priceYes({ qYes: 50, qNo: 0, b: 100 })).toBeGreaterThan(0.5);
  });

  it("Yes 价 + No 价 = 1", () => {
    const s = { qYes: 30, qNo: 10, b: 100 };
    const yes = priceYes(s);
    const no = 1 - yes;
    expect(yes + no).toBeCloseTo(1, 6);
  });

  it("买入报价:成本为正、返回成交后概率、更新份额", () => {
    const q = quoteBuy({ qYes: 0, qNo: 0, b: 100 }, "YES", 10);
    expect(q.costPoints).toBeGreaterThan(0);
    expect(q.probAfter).toBeGreaterThan(0.5);
    expect(q.newState.qYes).toBe(10);
    expect(q.newState.qNo).toBe(0);
  });

  it("买入价格介于 0 和 shares 之间(每份成本 < 1 积分)", () => {
    const q = quoteBuy({ qYes: 0, qNo: 0, b: 100 }, "YES", 10);
    expect(q.costPoints).toBeGreaterThan(0);
    expect(q.costPoints).toBeLessThan(10);
  });

  it("买后立即卖回相同份额,净积分变动≈0(无手续费)", () => {
    const s0 = { qYes: 0, qNo: 0, b: 100 };
    const buy = quoteBuy(s0, "YES", 10);
    const sell = quoteSell(buy.newState, "YES", 10);
    expect(buy.costPoints - sell.costPoints).toBeCloseTo(0, 6);
    expect(sell.newState.qYes).toBeCloseTo(0, 6);
  });

  it("流动性参数 b 越大,同样买入对概率的推动越小", () => {
    const small = quoteBuy({ qYes: 0, qNo: 0, b: 50 }, "YES", 20);
    const large = quoteBuy({ qYes: 0, qNo: 0, b: 500 }, "YES", 20);
    expect(small.probAfter).toBeGreaterThan(large.probAfter);
  });

  it("cost 单调:发行更多份额成本更高", () => {
    const c1 = cost({ qYes: 10, qNo: 0, b: 100 });
    const c2 = cost({ qYes: 20, qNo: 0, b: 100 });
    expect(c2).toBeGreaterThan(c1);
  });
});

/**
 * LMSR(对数市场评分规则)自动做市引擎。
 *
 * 纯函数、无副作用:输入市场 AMM 状态与交易量,输出成交价、成交后概率、新状态。
 * 不依赖数据库或 HTTP,便于单元测试彻底覆盖。这是整个系统最需要保证正确的部分。
 */

export interface AmmState {
  /** 已发行的 Yes 份额量 */
  qYes: number;
  /** 已发行的 No 份额量 */
  qNo: number;
  /** 流动性参数:越大价格越稳(需更多积分推动概率),越小越敏感 */
  b: number;
}

export type Side = "YES" | "NO";

export interface Quote {
  /** 本次交易花费(买入)或获得(卖出)的积分,恒为正 */
  costPoints: number;
  /** 成交后 Yes 的概率(0~1) */
  probAfter: number;
  /** 成交后的新 AMM 状态 */
  newState: AmmState;
}

/** LMSR 成本函数:C = b · ln(e^(qYes/b) + e^(qNo/b)) */
export function cost(s: AmmState): number {
  return s.b * Math.log(Math.exp(s.qYes / s.b) + Math.exp(s.qNo / s.b));
}

/** Yes 当前价格(=市场隐含概率) */
export function priceYes(s: AmmState): number {
  const a = Math.exp(s.qYes / s.b);
  const c = Math.exp(s.qNo / s.b);
  return a / (a + c);
}

/** No 当前价格 = 1 − priceYes */
export function priceNo(s: AmmState): number {
  return 1 - priceYes(s);
}

/** 买入某一方 shares 份额的报价 */
export function quoteBuy(s: AmmState, side: Side, shares: number): Quote {
  const newState: AmmState =
    side === "YES"
      ? { ...s, qYes: s.qYes + shares }
      : { ...s, qNo: s.qNo + shares };
  return {
    costPoints: cost(newState) - cost(s),
    probAfter: priceYes(newState),
    newState,
  };
}

/** 卖出某一方 shares 份额的报价(返还的积分) */
export function quoteSell(s: AmmState, side: Side, shares: number): Quote {
  const newState: AmmState =
    side === "YES"
      ? { ...s, qYes: s.qYes - shares }
      : { ...s, qNo: s.qNo - shares };
  return {
    costPoints: cost(s) - cost(newState),
    probAfter: priceYes(newState),
    newState,
  };
}

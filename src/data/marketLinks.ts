/**
 * 行情数据源外链配置（/markets 指数卡、资产行与首页中美瞭望共用）。
 * 规则：A 股指数用东方财富行情页（iFinD 无公开实时行情页）；港股/美股/大宗/汇率/加密用 Yahoo Finance；
 * 未列出的 id 由 marketLink() 统一回退 Yahoo Finance 首页。
 */

export const MARKET_LINKS: Record<string, string> = {
  /* A 股 · 东方财富 */
  'sh-comp': 'https://quote.eastmoney.com/zs000001.html', // 上证指数
  'sz-comp': 'https://quote.eastmoney.com/zs399001.html', // 深证成指
  chinext: 'https://quote.eastmoney.com/zs399006.html', // 创业板指
  star50: 'https://quote.eastmoney.com/zs000688.html', // 科创50

  /* 港股 */
  hsi: 'https://finance.yahoo.com/quote/%5EHSI', // 恒生指数
  hstech: 'https://finance.yahoo.com/quote/3033.HK', // 恒生科技（ETF 代理 3033.HK）

  /* 美股 */
  dow: 'https://finance.yahoo.com/quote/%5EDJI', // 道琼斯
  nasdaq: 'https://finance.yahoo.com/quote/%5EIXIC', // 纳斯达克
  sp500: 'https://finance.yahoo.com/quote/%5EGSPC', // 标普500
  rut2000: 'https://finance.yahoo.com/quote/%5ERUT', // 罗素2000
  sox: 'https://finance.yahoo.com/quote/%5ESOX', // 费城半导体
  vix: 'https://finance.yahoo.com/quote/%5EVIX', // VIX 恐慌指数

  /* 全球其他 */
  nikkei: 'https://finance.yahoo.com/quote/%5EN225', // 日经225
  ftse: 'https://finance.yahoo.com/quote/%5EFTSE', // 英国富时100
  dax: 'https://finance.yahoo.com/quote/%5EGDAXI', // 德国DAX

  /* 大宗 */
  gold: 'https://finance.yahoo.com/quote/GC=F', // COMEX黄金
  silver: 'https://finance.yahoo.com/quote/SI=F', // COMEX白银
  wti: 'https://finance.yahoo.com/quote/CL=F', // WTI原油
  brent: 'https://finance.yahoo.com/quote/BZ=F', // 布伦特原油
  'lme-cu': 'https://www.lme.com/en/Metals/Non-ferrous/LME-Copper', // LME铜（交易所官网）

  /* 汇率 */
  usdcny: 'https://finance.yahoo.com/quote/CNY=X', // 美元/在岸人民币
  usdcnh: 'https://finance.yahoo.com/quote/CNH=X', // 美元/离岸人民币
  dxy: 'https://finance.yahoo.com/quote/DX-Y.NYB', // 美元指数
  eurusd: 'https://finance.yahoo.com/quote/EURUSD=X', // 欧元/美元
  usdjpy: 'https://finance.yahoo.com/quote/JPY=X', // 美元/日元

  /* 加密 */
  btc: 'https://finance.yahoo.com/quote/BTC-USD', // 比特币
  eth: 'https://finance.yahoo.com/quote/ETH-USD', // 以太坊
  sol: 'https://finance.yahoo.com/quote/SOL-USD', // SOL
  mcap: 'https://finance.yahoo.com/', // 加密总市值（Yahoo 无对应行情页，回退首页）
}

/** 未配置的 id 统一回退 Yahoo Finance 首页 */
export function marketLink(id: string): string {
  return MARKET_LINKS[id] ?? 'https://finance.yahoo.com/'
}

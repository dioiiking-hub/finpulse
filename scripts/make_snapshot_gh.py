#!/usr/bin/env python3
"""FinPulse 行情快照生成器（GitHub Actions 版，无 API key）
数据源：yfinance（Yahoo Finance 公开数据）为主；A股指数失败时用 akshare（东方财富）兜底。
关键设计：与仓库中已有快照合并——取数失败的品种保留上一份快照的值，
全部失败则以非零码退出（workflow 跳过提交，不覆盖旧快照）。
用法: python3 scripts/make_snapshot_gh.py public/data/market-snapshot.json
"""
import json, os, sys
from datetime import datetime, timezone, timedelta

# id（与 src/data/markets.ts TICKER_ITEMS 一致）→ (yfinance ticker, akshare 兜底代码)
TICKERS = {
    "sh-comp": ("000001.SS", "sh000001"),
    "sz-comp": ("399001.SZ", "sz399001"),
    "chinext": ("399006.SZ", "sz399006"),
    "hsi": ("^HSI", None),
    "hstech": ("3033.HK", None),   # Yahoo 无恒科指数，ETF 代理
    "dow": ("^DJI", None),
    "nasdaq": ("^IXIC", None),
    "sp500": ("^GSPC", None),
    "vix": ("^VIX", None),
    "gold": ("GC=F", None),
    "wti": ("CL=F", None),
    "usdcnh": ("CNH=X", None),
    "btc": ("BTC-USD", None),
}
PROXY_NOTE = {"hstech": "以恒生科技ETF(3033.HK)行情替代指数"}
CST = timezone(timedelta(hours=8))


def closes_yf(ticker):
    import yfinance as yf
    df = yf.download(ticker, period="3mo", interval="1d",
                     progress=False, auto_adjust=False)
    if df is None or len(df) == 0:
        return [], None
    close = df["Close"]
    if hasattr(close, "columns"):           # MultiIndex 兼容
        close = close.iloc[:, 0]
    closes = [float(v) for v in close.dropna().tolist()]
    last_date = str(close.dropna().index[-1])[:10] if closes else None
    return closes, last_date


def closes_ak(symbol):
    import akshare as ak
    df = ak.stock_zh_index_daily(symbol=symbol)
    if df is None or len(df) == 0:
        return [], None
    df = df.tail(70)
    closes = [float(v) for v in df["close"].tolist()]
    last_date = str(df["date"].iloc[-1])[:10]
    return closes, last_date


def pct(closes):
    if len(closes) < 2:
        return 0.0
    prev = closes[-2]
    return round((closes[-1] - prev) / prev * 100, 4) if prev else 0.0


def main(out_path):
    old = {}
    if os.path.exists(out_path):
        try:
            old = json.load(open(out_path, encoding="utf-8")).get("quotes", {})
        except Exception:
            old = {}

    quotes, errors, sources = {}, {}, set()
    for qid, (yf_t, ak_s) in TICKERS.items():
        closes, last_date, src = [], None, None
        try:
            closes, last_date = closes_yf(yf_t)
            src = "Yahoo Finance" if closes else None
        except Exception as e:
            errors[qid] = f"yf: {str(e)[:120]}"
        if not closes and ak_s:
            try:
                closes, last_date = closes_ak(ak_s)
                src = "AKShare/东方财富" if closes else None
            except Exception as e:
                errors[qid] = errors.get(qid, "") + f" | ak: {str(e)[:120]}"
        if closes:
            quotes[qid] = {"price": round(closes[-1], 4), "changePct": pct(closes),
                           "spark": [round(c, 2) for c in closes[-30:]],
                           "asOf": last_date or "", "source": src,
                           **({"note": PROXY_NOTE[qid]} if qid in PROXY_NOTE else {})}
            sources.add(src)
        elif qid in old:                      # 保留上一份快照
            quotes[qid] = old[qid]
            if old[qid].get("source"):
                sources.add(old[qid]["source"])
            errors.setdefault(qid, "fetch failed, kept previous")

    ok_new = sum(1 for q in quotes.values() if q.get("asOf") and q not in old.values())
    if not quotes or ok_new == 0:
        print("ALL FETCHES FAILED — keep old snapshot, exit 1")
        print(json.dumps(errors, ensure_ascii=False)[:1000])
        sys.exit(1)

    snap = {"asOf": datetime.now(CST).isoformat(timespec="seconds"),
            "sources": sorted(sources), "quotes": quotes, "errors": errors}
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    json.dump(snap, open(out_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"OK {len(quotes)} quotes ({ok_new} fresh), errors: {len(errors)}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "public/data/market-snapshot.json")

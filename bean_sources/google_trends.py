#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Google Trends 抓取（透過 pytrends）。
比較最近 7 天 vs 前 7 天的平均搜尋量，找出「崛起」的咖啡關鍵字。

回傳結構：
{
    "rankings": [
        {"keyword": ..., "recent_avg": float, "previous_avg": float, "growth_pct": float, "score": float},
        ...
    ],
    "errors": [...]   # 抓不到的批次
}
"""

import sys
import time
from typing import Optional

from .keywords import TRENDS_SEED_KEYWORDS

# pytrends 4.9.2 用了 urllib3 已棄用的 method_whitelist 參數
# urllib3 2.x 改名 allowed_methods → 在這裡 monkey-patch 修掉
try:
    import urllib3.util.retry as _retry_module
    _orig_retry_init = _retry_module.Retry.__init__

    def _patched_retry_init(self, *args, **kwargs):
        if "method_whitelist" in kwargs:
            kwargs["allowed_methods"] = kwargs.pop("method_whitelist")
        return _orig_retry_init(self, *args, **kwargs)

    _retry_module.Retry.__init__ = _patched_retry_init
except Exception:
    pass

DELAY_BETWEEN_BATCHES = 30.0  # 每批之間的等待秒數（Google 429 限制很嚴）
DELAY_BETWEEN_API_CALLS = 5.0  # 同批內兩次 API call 之間的緩衝
RETRY_WAIT_ON_FAIL = 60.0      # 批次失敗後重試前等待
MAX_BATCH_RETRIES = 1          # 每批失敗後最多重試幾次


def _fetch_one_batch(pytrends, batch: list[str]) -> list[dict]:
    """跑一批關鍵字、回傳每個關鍵字的 row。失敗會直接 raise。"""
    pytrends.build_payload(
        kw_list=batch,
        cat=0,
        timeframe="now 7-d",   # 最近 7 天小時級資料
        geo="TW",
    )
    df_recent = pytrends.interest_over_time()

    time.sleep(DELAY_BETWEEN_API_CALLS)  # 兩次 API call 之間緩衝，避免 429

    # 為了算成長率，再抓前一週
    pytrends.build_payload(
        kw_list=batch,
        cat=0,
        timeframe="today 1-m",  # 過去 1 個月日級資料，能看出週對比
        geo="TW",
    )
    df_month = pytrends.interest_over_time()

    rows = []
    for kw in batch:
        recent_avg = float(df_recent[kw].mean()) if kw in df_recent.columns and not df_recent.empty else 0.0
        if kw in df_month.columns and not df_month.empty:
            last7 = df_month[kw].tail(7).mean()
            prev7 = df_month[kw].iloc[-14:-7].mean() if len(df_month) >= 14 else df_month[kw].head(7).mean()
            prev_avg = float(prev7) if prev7 else 0.0
        else:
            prev_avg = 0.0

        if prev_avg > 0:
            growth = (recent_avg - prev_avg) / prev_avg * 100
        else:
            growth = 100.0 if recent_avg > 0 else 0.0

        rows.append({
            "keyword": kw,
            "recent_avg": round(recent_avg, 1),
            "previous_avg": round(prev_avg, 1),
            "growth_pct": round(growth, 1),
            "score": round(recent_avg + growth * 0.3, 1),
        })
    return rows


def scrape() -> dict:
    """跑所有種子關鍵字批次，回傳成長率排行榜。
    包含速率限制保護：批次間 30s、API call 間 5s、失敗自動重試 1 次。
    """
    try:
        from pytrends.request import TrendReq
    except ImportError:
        print("  [Trends] 缺少 pytrends，請執行：pip install pytrends")
        return {"rankings": [], "errors": ["pytrends not installed"]}

    pytrends = TrendReq(hl="zh-TW", tz=480, timeout=(10, 25), retries=2, backoff_factor=0.5)

    all_rows: list[dict] = []
    errors: list[str] = []

    total = len(TRENDS_SEED_KEYWORDS)
    estimated_min = total * (DELAY_BETWEEN_BATCHES + DELAY_BETWEEN_API_CALLS) / 60
    print(f"  [Trends] 開始抓 {total} 批關鍵字（預估 ~{estimated_min:.1f} 分鐘，含速率保護間隔）...")

    for i, batch in enumerate(TRENDS_SEED_KEYWORDS, start=1):
        success = False
        for attempt in range(MAX_BATCH_RETRIES + 1):
            try:
                rows = _fetch_one_batch(pytrends, batch)
                all_rows.extend(rows)
                tag = " (重試成功)" if attempt > 0 else ""
                print(f"  [Trends] 第 {i}/{total} 批 OK{tag} ({', '.join(batch)})")
                success = True
                break
            except Exception as e:
                err_short = type(e).__name__
                if attempt < MAX_BATCH_RETRIES:
                    print(f"  [Trends] 第 {i}/{total} 批 {err_short}，等 {RETRY_WAIT_ON_FAIL:.0f}s 後重試...")
                    time.sleep(RETRY_WAIT_ON_FAIL)
                else:
                    msg = f"批次 {i} ({batch}) 最終失敗：{err_short}: {str(e)[:120]}"
                    errors.append(msg)
                    print(f"  [Trends] ✗ {msg}")

        # 批次間等待（除非是最後一批）
        if i < total:
            wait = DELAY_BETWEEN_BATCHES if success else DELAY_BETWEEN_BATCHES * 1.5
            time.sleep(wait)

    rankings = sorted(all_rows, key=lambda x: x["score"], reverse=True)
    print(f"  [Trends] ✓ 共 {len(rankings)} 個關鍵字，錯誤 {len(errors)} 筆")
    return {"rankings": rankings, "errors": errors}


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    r = scrape()
    print(f"\nTop 10 關鍵字（依分數）：")
    for row in r["rankings"][:10]:
        arrow = "↑" if row["growth_pct"] > 0 else "↓"
        print(f"  {row['keyword']:12s} 近期 {row['recent_avg']:5.1f}  vs  前期 {row['previous_avg']:5.1f}  {arrow} {row['growth_pct']:+6.1f}%  分數 {row['score']:5.1f}")

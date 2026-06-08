#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
凱飛鮮烘豆 — 新豆開發系統（Phase 1）
從 PTT coffee 板 + Google Trends 收集咖啡豆聲量，產生週報並寄信。

用法:
    python bean_finder.py                  # 預設：抓 PTT 8 頁、跑 Trends、寄 Email、開啟報表
    python bean_finder.py --no-email       # 不寄信
    python bean_finder.py --no-open        # 不自動開啟報表
    python bean_finder.py --no-trends      # 跳過 Google Trends（pytrends 偶爾被擋時用）
    python bean_finder.py --ptt-pages 12   # 改變 PTT 抓頁數
"""

import argparse
import json
import os
import sys
import webbrowser
from datetime import date
from pathlib import Path

# Windows console 預設 cp950，繁中與 ✓ 符號會炸 → 強制 utf-8
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

from bean_sources import ptt_coffee, google_trends, momo, cross_ref
import bean_notifier

OUTPUT_DIR = Path("bean_results")
HISTORY_PATH = OUTPUT_DIR / "history.json"


def load_history() -> dict:
    """讀取歷史快照，用來判斷哪些關鍵字是『新出現』或『大幅崛起』。"""
    if not HISTORY_PATH.exists():
        return {"snapshots": []}
    try:
        return json.loads(HISTORY_PATH.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"  [warn] 歷史檔讀取失敗，重新開始: {e}")
        return {"snapshots": []}


def save_history(history: dict) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    HISTORY_PATH.write_text(json.dumps(history, ensure_ascii=False, indent=2), encoding="utf-8")


def detect_new_items(ptt_data: dict, trends_data: dict, history: dict) -> list[dict]:
    """偵測本週『首次出現』或『成長 ≥ 50%』的關鍵字。"""
    new_items: list[dict] = []

    prev_ptt_names = set()
    for snap in history.get("snapshots", [])[-3:]:  # 看過去 3 次快照
        for kw in snap.get("ptt_top", []):
            prev_ptt_names.add(kw["name"])

    for kw in ptt_data.get("keyword_stats", [])[:20]:
        if kw["name"] not in prev_ptt_names and kw["score"] >= 10:
            new_items.append({
                "name": kw["name"],
                "reason": f"PTT 首次進榜（{kw['post_count']} 篇 / {kw['push_total']} 推）"
            })

    for row in trends_data.get("rankings", [])[:20]:
        if row["growth_pct"] >= 50 and row["recent_avg"] >= 20:
            new_items.append({
                "name": row["keyword"],
                "reason": f"Google 搜尋週成長 {row['growth_pct']:+.0f}%"
            })

    return new_items


def write_html_snapshot(ptt_data: dict, trends_data: dict, momo_data: dict,
                        cross_items: list[dict], new_items: list[dict], path: Path) -> None:
    """寫一份完整 HTML 快照到 bean_results/<date>.html。"""
    html = bean_notifier.build_html_body(ptt_data, trends_data, momo_data, cross_items, new_items)
    path.write_text(html, encoding="utf-8")
    print(f"  [report] ✓ HTML 報表寫入 {path}")


def main():
    parser = argparse.ArgumentParser(description="凱飛新豆開發週報")
    parser.add_argument("--no-email", action="store_true", help="不寄信")
    parser.add_argument("--no-open", action="store_true", help="不自動開啟報表")
    parser.add_argument("--with-trends", action="store_true",
                        help="嘗試抓 Google Trends（預設關閉，pytrends 太常被 429）")
    parser.add_argument("--no-ptt", action="store_true", help="跳過 PTT")
    parser.add_argument("--ptt-pages", type=int, default=8, help="PTT 抓幾頁（預設 8）")
    parser.add_argument("--no-momo", action="store_true", help="跳過 momo")
    parser.add_argument("--momo-pages", type=int, default=5, help="momo 抓幾頁（預設 5 ≈ 150 商品）")
    args = parser.parse_args()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    today_str = date.today().isoformat()
    print(f"\n=== 凱飛新豆開發系統 — {today_str} ===\n")

    # 1) PTT
    if args.no_ptt:
        ptt_data = {"posts": [], "keyword_stats": []}
        print("  [PTT] 已跳過")
    else:
        ptt_data = ptt_coffee.scrape(num_pages=args.ptt_pages)

    # 2) Google Trends（預設關閉，pytrends 在 2026 年常被 429 擋）
    if args.with_trends:
        trends_data = google_trends.scrape()
    else:
        trends_data = {"rankings": [], "errors": ["skipped (default)"]}
        print("  [Trends] 已跳過（預設不跑，加 --with-trends 才會嘗試）")

    # 3) momo 電商熱銷
    if args.no_momo:
        momo_data = {"products": [], "keyword_stats": []}
        print("  [momo] 已跳過")
    else:
        momo_data = momo.scrape(num_pages=args.momo_pages)

    # 4) PTT × momo 交叉表
    cross_items = cross_ref.build(ptt_data, momo_data)
    quadrants = cross_ref.summarize_by_quadrant(cross_items)
    print(f"  [cross] 🟨 採購機會 {len(quadrants['opportunity'])} 個 ｜ "
          f"🟦 紅海 {len(quadrants['red_sea'])} ｜ "
          f"🟩 沉默長銷 {len(quadrants['silent_seller'])} ｜ "
          f"⬜ 未開發 {len(quadrants['undeveloped'])}")

    # 5) 比對歷史，找出新出現的關鍵字
    history = load_history()
    new_items = detect_new_items(ptt_data, trends_data, history)
    print(f"\n  [analysis] 偵測到 {len(new_items)} 個新崛起項目")

    # 6) 寫快照
    snapshot_path = OUTPUT_DIR / f"{today_str}.html"
    write_html_snapshot(ptt_data, trends_data, momo_data, cross_items, new_items, snapshot_path)

    # 7) 更新歷史
    history.setdefault("snapshots", []).append({
        "date": today_str,
        "ptt_top": [
            {"name": k["name"], "score": k["score"]}
            for k in ptt_data.get("keyword_stats", [])[:20]
        ],
        "trends_top": [
            {"keyword": r["keyword"], "score": r["score"]}
            for r in trends_data.get("rankings", [])[:20]
        ],
        "momo_top": [
            {"name": k["name"], "product_count": k["product_count"],
             "per100g_avg": k.get("per100g_avg")}
            for k in momo_data.get("keyword_stats", [])[:20]
        ],
    })
    # 只保留最近 12 筆
    history["snapshots"] = history["snapshots"][-12:]
    save_history(history)

    # 8) 寄信
    if not args.no_email:
        bean_notifier.send_email(ptt_data, trends_data, momo_data, cross_items, new_items)

    # 9) 開啟
    if not args.no_open:
        try:
            webbrowser.open(snapshot_path.resolve().as_uri())
        except Exception as e:
            print(f"  [warn] 無法自動開啟: {e}")

    print(f"\n=== 完成 ===\n")


if __name__ == "__main__":
    main()

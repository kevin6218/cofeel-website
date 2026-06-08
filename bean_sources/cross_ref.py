#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PTT × momo 交叉表：合併兩來源關鍵字、分四象限。

⚠ 重要：PTT「聲量」目前主要來自業者 [廣宣] 推銷文，不是真實消費者討論
（真實討論文標題很少寫具體豆款名 → 抓不到）。所以這個矩陣現在的解讀是：

  🟨 採購機會：業者主推 + momo 鋪貨少（同行看好但還沒鋪滿 → 可搶先機）
  🟦 紅海    ：業者主推 + momo 鋪貨多（已被別人佔據 → 難進場）
  🟩 沉默長銷：業者沒推 + momo 鋪貨多（穩定剛需 → 跟著做穩贏）
  ⬜ 未開發  ：兩邊都少（時機未到 / 冷門）

門檻可調，目前：
  PTT 高 = score >= 30 或 post_count >= 2
  momo 高 = product_count >= 3
"""

from typing import Any


PTT_SCORE_HIGH = 30
PTT_POST_HIGH = 2
MOMO_PRODUCT_HIGH = 3

QUADRANTS = {
    "opportunity":   {"emoji": "🟨", "label": "業者搶推 + 鋪貨少", "short": "採購機會",
                      "priority": 1, "color": "#d97706"},
    "red_sea":       {"emoji": "🟦", "label": "業者搶推 + 已鋪滿", "short": "紅海",
                      "priority": 2, "color": "#2563eb"},
    "silent_seller": {"emoji": "🟩", "label": "業者沒推 + 賣得好", "short": "沉默長銷",
                      "priority": 3, "color": "#16a34a"},
    "undeveloped":   {"emoji": "⬜", "label": "兩邊都少",        "short": "未開發",
                      "priority": 4, "color": "#94a3b8"},
}


def classify(ptt_score: int, ptt_posts: int, momo_products: int) -> str:
    ptt_high = ptt_score >= PTT_SCORE_HIGH or ptt_posts >= PTT_POST_HIGH
    momo_high = momo_products >= MOMO_PRODUCT_HIGH
    if ptt_high and not momo_high:
        return "opportunity"
    if ptt_high and momo_high:
        return "red_sea"
    if not ptt_high and momo_high:
        return "silent_seller"
    return "undeveloped"


def build(ptt_data: dict, momo_data: dict) -> list[dict]:
    """合併、分類、排序。回傳列表，每筆是一個關鍵字的交叉資料。"""
    items: dict[str, dict] = {}

    for kw in ptt_data.get("keyword_stats", []):
        items[kw["name"]] = {
            "name": kw["name"],
            "category": kw["category"],
            "ptt_score": kw["score"],
            "ptt_posts": kw["post_count"],
            "ptt_pushes": kw["push_total"],
            "ptt_examples": kw.get("examples", []),
            "momo_products": 0,
            "momo_per100g_avg": None,
            "momo_per100g_min": None,
            "momo_per100g_max": None,
            "momo_per_half_lb_avg": None,
            "momo_best_rank": None,
            "momo_total_reviews": 0,
            "momo_examples": [],
        }

    for kw in momo_data.get("keyword_stats", []):
        item = items.setdefault(kw["name"], {
            "name": kw["name"],
            "category": kw["category"],
            "ptt_score": 0,
            "ptt_posts": 0,
            "ptt_pushes": 0,
            "ptt_examples": [],
        })
        item["momo_products"] = kw["product_count"]
        item["momo_per100g_avg"] = kw.get("per100g_avg")
        item["momo_per100g_min"] = kw.get("per100g_min")
        item["momo_per100g_max"] = kw.get("per100g_max")
        item["momo_per_half_lb_avg"] = kw.get("per_half_lb_avg")
        item["momo_best_rank"] = kw["best_rank"]
        item["momo_total_reviews"] = kw["total_reviews"]
        item["momo_examples"] = kw.get("examples", [])

    # 分象限
    for it in items.values():
        it["quadrant"] = classify(
            it.get("ptt_score", 0),
            it.get("ptt_posts", 0),
            it.get("momo_products", 0),
        )

    # 排序：優先級（採購機會優先）、再依綜合熱度
    def sort_key(it: dict) -> tuple:
        q = QUADRANTS[it["quadrant"]]["priority"]
        heat = it.get("ptt_score", 0) + it.get("momo_products", 0) * 5
        return (q, -heat)

    return sorted(items.values(), key=sort_key)


def summarize_by_quadrant(items: list[dict]) -> dict[str, list[dict]]:
    """依象限分組，方便報表分塊呈現。"""
    groups: dict[str, list[dict]] = {q: [] for q in QUADRANTS}
    for it in items:
        groups[it["quadrant"]].append(it)
    return groups


if __name__ == "__main__":
    # 快速 sanity check：手造資料
    fake_ptt = {"keyword_stats": [
        {"name": "藝伎", "category": "variety", "score": 295, "post_count": 3, "push_total": 280, "examples": []},
        {"name": "葉門", "category": "origin", "score": 105, "post_count": 1, "push_total": 100, "examples": []},
        {"name": "西達摩", "category": "region", "score": 94, "post_count": 1, "push_total": 89, "examples": []},
    ]}
    fake_momo = {"keyword_stats": [
        {"name": "藝伎", "category": "variety", "product_count": 2,
         "per100g_min": 145, "per100g_max": 290, "per100g_avg": 218, "per_half_lb_avg": 495,
         "best_rank": 4, "total_reviews": 166, "examples": []},
        {"name": "耶加雪菲", "category": "region", "product_count": 5,
         "per100g_min": 65, "per100g_max": 180, "per100g_avg": 110, "per_half_lb_avg": 250,
         "best_rank": 5, "total_reviews": 1684, "examples": []},
    ]}
    items = build(fake_ptt, fake_momo)
    for it in items:
        q = QUADRANTS[it["quadrant"]]
        price = f"${it['momo_per100g_avg']}/100g" if it.get('momo_per100g_avg') else "—"
        print(f"  {q['emoji']} {q['label']:6s}  {it['name']:8s}  "
              f"PTT score={it['ptt_score']:4d}/posts={it.get('ptt_posts',0)}  "
              f"momo product={it['momo_products']}  avg={price}")

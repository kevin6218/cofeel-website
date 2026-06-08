#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
momo 購物網「咖啡豆」搜尋結果爬蟲。
解 JSON-LD ItemList（Schema.org 結構化資料），每頁 30 個商品。

回傳結構：
{
    "products": [
        {"name": ..., "price": int, "rating": float, "review_count": int,
         "rank": int, "url": ..., "keywords": [...]},
        ...
    ],
    "keyword_stats": [
        {"name": "藝伎", "category": "variety",
         "product_count": 3, "min_price": 350, "max_price": 1280, "avg_price": 720,
         "best_rank": 5, "total_reviews": 412,
         "examples": [{"name": ..., "price": ..., "url": ...}, ...]},
        ...
    ]
}
"""

import json
import re
import sys
import time
import requests
from typing import Optional

from .keywords import match_keywords

BASE_URL = "https://www.momoshop.com.tw"
SEARCH_URL = BASE_URL + "/search/searchShop.jsp"
KEYWORD = "咖啡豆"
SORT_HOT = "6"   # momo: 6=綜合熱門排序

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-TW,zh;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Referer": "https://www.momoshop.com.tw/",
}

DELAY_SECS = 1.5
MAX_RETRIES = 3
JSONLD_RE = re.compile(
    r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
    re.DOTALL,
)


# ── 重量抽取 ───────────────────────────────────────────────────────────────────
# 從商品名抓出總克數，用來算「每 100g 單價」做標準化比較
_CHINESE_NUM = {"半": 0.5, "一": 1, "二": 2, "兩": 2, "三": 3, "四": 4, "五": 5, "六": 6}

# 順序重要：先抓「組合 / 倍數」模式，再抓單純重量
# 模式 1: "200g x 5罐" / "454g x 4袋" / "100g*3包"
_COMBO_GxN_RE = re.compile(r"(\d+(?:\.\d+)?)\s*(?:g|G|公克|克)\s*[*xX×]\s*(\d+)\s*[包袋罐瓶入組盒]")
# 模式 2: "5罐 200g" / "3包(每包 100g)" / "x3包-半磅227g"
_COMBO_NxG_RE = re.compile(r"[*xX×]?\s*(\d+)\s*[包袋罐瓶入組盒][^)）]*?(\d+(?:\.\d+)?)\s*(?:g|G|公克|克)")
# 模式 3: "(半磅 227g x 3包)" 或 "227g/包 x 3"
_COMBO_LBxN_RE = re.compile(r"[半一二兩三四五]?\s*磅[^)）]{0,15}?[*xX×]\s*(\d+)\s*[包袋罐瓶入組盒]")

_GRAMS_RE = re.compile(r"(\d+(?:\.\d+)?)\s*(?:g|G|公克|克)(?![a-zA-Z])")
_KG_RE    = re.compile(r"(\d+(?:\.\d+)?)\s*(?:kg|KG|公斤|千克)")
_LB_RE    = re.compile(r"(\d+(?:\.\d+)?)\s*(?:lb|LB|pound|Pound|磅)")
_FRAC_LB_RE = re.compile(r"1/([24])\s*磅")
_CN_LB_RE = re.compile(r"([半一二兩三四五])\s*磅")


def extract_weight_grams(name: str) -> Optional[int]:
    """從商品名稱抽出總重量（克）。
    支援：250g / 1kg / 半磅 / 1磅 / 1/2磅 / 250g x 5罐 / 咖啡豆x3包-半磅227g 等格式。
    抓不到回傳 None（這筆就不參與「每 100g 均價」計算）。
    """
    if not name:
        return None

    # === 組合包優先（會乘以包數） ===
    # 1a) Ag x N包
    m = _COMBO_GxN_RE.search(name)
    if m:
        return int(float(m.group(1)) * int(m.group(2)))
    # 1b) N包 ... Ag （像「x3包-半磅227g」）
    m = _COMBO_NxG_RE.search(name)
    if m:
        count = int(m.group(1))
        per = float(m.group(2))
        if 1 <= count <= 30 and 30 <= per <= 5000:  # sanity
            return int(per * count)
    # 1c) 半磅 x N包 / 1磅 x 3袋
    m = _COMBO_LBxN_RE.search(name)
    if m:
        # 從整段抓出磅的份量
        lb_text = name[max(0, m.start()-3):m.end()]
        per = 454  # 預設 1 磅
        if "半" in lb_text or "1/2" in lb_text:
            per = 227
        elif "1/4" in lb_text:
            per = 113
        elif "兩" in lb_text or "二" in lb_text:
            per = 908
        return per * int(m.group(1))

    # === 單一包裝 ===
    kg = _KG_RE.search(name)
    if kg:
        return int(float(kg.group(1)) * 1000)
    frac = _FRAC_LB_RE.search(name)
    if frac:
        return int(454 / int(frac.group(1)))
    cn_lb = _CN_LB_RE.search(name)
    if cn_lb:
        n = _CHINESE_NUM.get(cn_lb.group(1), 1)
        return int(454 * n)
    lb = _LB_RE.search(name)
    if lb:
        return int(float(lb.group(1)) * 454)
    g = _GRAMS_RE.search(name)
    if g:
        val = float(g.group(1))
        if 30 <= val <= 10000:
            return int(val)
    return None


# ── 非新鮮豆排除（濾掛/即溶/膠囊/液態） ─────────────────────────────────────
_NON_BEAN_RE = re.compile(
    r"(?:濾掛|掛耳|耳掛|drip\s*bag|"
    r"即溶|三合一|二合一|3in1|2in1|"
    r"膠囊|capsule|nespresso|多趣酷思|dolce\s*gusto|"
    r"咖啡液|濃縮液|冷萃液|萃取液|即飲|罐裝|瓶裝|"
    r"杯裝咖啡|沖泡包)",
    re.IGNORECASE,
)


def is_non_bean_product(name: str) -> bool:
    """偵測是否為非新鮮豆商品（濾掛/即溶/膠囊...），這類不該跟豆比每 g 單價。"""
    return bool(_NON_BEAN_RE.search(name or ""))


# ── 任選 / 混豆組合偵測 ────────────────────────────────────────────────────────
# 明確的混豆指標字：出現即視為任選
_MULTI_HINT_RE = re.compile(r"(?:任選|綜合|混搭|混合|多重|多款|多選|口味任選|多口味|多種)")
# 「斜線分隔 + 系列/特調/配方」這種隱性任選（像「經典藍山/義式特調咖啡豆」）
_SERIES_RE = re.compile(r"(?:系列|配方|特調|風味|口味|綜合配方)")


def is_multi_origin_product(name: str, keyword_hits: list[dict]) -> bool:
    """判斷是否為任選/混豆組合：
    - 名稱含「任選/綜合/混搭」等字
    - 或有 / 分隔且含「系列/特調/配方/風味」這類混豆描述
    - 或同一商品命中 ≥3 個產區/品種關鍵字
    這類商品不該被當成單一產區的代表（會嚴重污染均價）
    """
    if not name:
        return False
    if _MULTI_HINT_RE.search(name):
        return True
    # 「/」分隔 + 混豆描述字 → 是「品項A/品項B」任選結構
    if "/" in name and _SERIES_RE.search(name):
        return True
    # 命中 3 個以上產地或品種 → 通常是混合包
    countable = [k for k in keyword_hits if k.get("category") in ("origin", "region", "variety")]
    return len(countable) >= 3


def fetch_page(url: str, session: requests.Session) -> Optional[str]:
    last_err = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = session.get(url, timeout=20)
            resp.raise_for_status()
            return resp.text
        except Exception as e:
            last_err = e
            if attempt < MAX_RETRIES:
                wait = 2 ** attempt
                print(f"  [momo] 第 {attempt} 次失敗 ({type(e).__name__})，{wait}s 後重試...")
                time.sleep(wait)
    print(f"  [momo] 取頁最終失敗 {url}: {last_err}")
    return None


def parse_products(html: str, page_offset: int = 0) -> list[dict]:
    """從一頁 HTML 解出商品清單。page_offset 用來連續編 rank。"""
    products = []
    for block in JSONLD_RE.findall(html):
        try:
            data = json.loads(block.strip())
        except json.JSONDecodeError:
            continue

        graph = data.get("@graph") if isinstance(data, dict) else None
        if not graph:
            continue

        for entry in graph:
            if not isinstance(entry, dict) or entry.get("@type") != "ItemList":
                continue
            for item in entry.get("itemListElement", []):
                if not isinstance(item, dict) or item.get("@type") != "Product":
                    continue
                name = item.get("name", "").strip()
                if not name:
                    continue
                offers = item.get("offers") or {}
                rating_obj = item.get("aggregateRating") or {}

                try:
                    price = int(offers.get("price")) if offers.get("price") else None
                except (TypeError, ValueError):
                    price = None
                try:
                    rating = float(rating_obj.get("ratingValue")) if rating_obj.get("ratingValue") else None
                except (TypeError, ValueError):
                    rating = None
                try:
                    review_count = int(rating_obj.get("reviewCount")) if rating_obj.get("reviewCount") else 0
                except (TypeError, ValueError):
                    review_count = 0

                weight_g = extract_weight_grams(name)
                price_per_100g = (
                    round(price / weight_g * 100) if (price and weight_g) else None
                )

                products.append({
                    "name": name,
                    "price": price,
                    "weight_g": weight_g,
                    "price_per_100g": price_per_100g,
                    "rating": rating,
                    "review_count": review_count,
                    "rank": page_offset + int(item.get("position", len(products) + 1)),
                    "url": item.get("url", ""),
                    "description": (item.get("description") or "").strip(),
                })
    return products


def scrape(num_pages: int = 5, keyword: str = KEYWORD) -> dict:
    """抓 momo 搜尋結果 num_pages 頁（每頁 30 個），預設關鍵字「咖啡豆」。
    num_pages=5 ≈ 150 個商品 ≈ 涵蓋大部分熱門 SKU。
    """
    session = requests.Session()
    session.headers.update(HEADERS)

    all_products: list[dict] = []
    print(f"  [momo] 開始抓「{keyword}」熱銷榜 {num_pages} 頁...")

    for page in range(1, num_pages + 1):
        url = f"{SEARCH_URL}?keyword={keyword}&sortType={SORT_HOT}&curPage={page}"
        html = fetch_page(url, session)
        if html is None:
            break
        products = parse_products(html, page_offset=(page - 1) * 30)
        if not products:
            print(f"  [momo] 第 {page} 頁解不到商品，停止")
            break
        all_products.extend(products)
        print(f"  [momo] 第 {page} 頁 → {len(products)} 個商品")
        time.sleep(DELAY_SECS)

    # 去重（同一 goodsCode 可能出現多次）
    seen = set()
    unique = []
    for p in all_products:
        m = re.search(r"i_code=(\d+)", p["url"])
        key = m.group(1) if m else p["name"][:50]
        if key in seen:
            continue
        seen.add(key)
        unique.append(p)

    # 比對關鍵字
    for p in unique:
        p["keywords"] = [
            {"name": kw["name"], "category": kw["category"]}
            for kw in match_keywords(p["name"] + " " + p.get("description", ""))
        ]

    # 過濾：排除非新鮮豆商品（濾掛/即溶/膠囊/液態），這類不該跟新鮮豆比 $/g
    pre_filter_count = len(unique)
    unique = [p for p in unique if not is_non_bean_product(p["name"])]
    excluded = pre_filter_count - len(unique)
    if excluded:
        print(f"  [momo] 已排除 {excluded} 個非新鮮豆商品（濾掛/即溶/膠囊...）")

    # 標記任選 / 混豆組合：不該被當作單一品項代表，會污染均價
    for p in unique:
        p["is_multi_origin"] = is_multi_origin_product(p["name"], p["keywords"])
    multi_count = sum(1 for p in unique if p["is_multi_origin"])
    if multi_count:
        print(f"  [momo] 標記 {multi_count} 個任選/混豆組合（價格不會混入單品均價）")

    # 聚合關鍵字統計
    stats: dict[str, dict] = {}
    for p in unique:
        is_multi = p.get("is_multi_origin", False)
        for kw in p["keywords"]:
            key = kw["name"]
            if key not in stats:
                stats[key] = {
                    "name": kw["name"],
                    "category": kw["category"],
                    "product_count": 0,
                    "single_origin_count": 0,
                    "multi_origin_count": 0,
                    "raw_prices": [],
                    "per100g_prices": [],
                    "weighted_skus": 0,
                    "ranks": [],
                    "total_reviews": 0,
                    "examples": [],
                }
            stats[key]["product_count"] += 1
            if is_multi:
                stats[key]["multi_origin_count"] += 1
            else:
                stats[key]["single_origin_count"] += 1
            if p["price"]:
                stats[key]["raw_prices"].append(p["price"])
            # 只有單一品項才計入「均價」(任選包價格不能歸屬給單一關鍵字)
            if p.get("price_per_100g") and not is_multi:
                stats[key]["per100g_prices"].append(p["price_per_100g"])
                stats[key]["weighted_skus"] += 1
            stats[key]["ranks"].append(p["rank"])
            stats[key]["total_reviews"] += p["review_count"]
            # 例文優先放單品，任選包標記出來
            if len(stats[key]["examples"]) < 3:
                stats[key]["examples"].append({
                    "name": p["name"][:80],
                    "price": p["price"],
                    "weight_g": p.get("weight_g"),
                    "price_per_100g": p.get("price_per_100g"),
                    "rating": p["rating"],
                    "url": p["url"],
                    "is_multi_origin": is_multi,
                })

    # 算 min/max/avg 並排序（價格用「每 100g 標準化」、不混合包裝大小）
    for s in stats.values():
        raw = s.pop("raw_prices")
        per100 = s.pop("per100g_prices")
        ranks = s.pop("ranks")
        s["raw_min"] = min(raw) if raw else None
        s["raw_max"] = max(raw) if raw else None
        s["per100g_min"] = min(per100) if per100 else None
        s["per100g_max"] = max(per100) if per100 else None
        s["per100g_avg"] = round(sum(per100) / len(per100)) if per100 else None
        # 同時提供半磅換算（227g），給烘豆品牌做生意比較方便
        s["per_half_lb_avg"] = round(s["per100g_avg"] * 2.27) if s["per100g_avg"] else None
        s["best_rank"] = min(ranks) if ranks else None
        # score 不變
        top10_bonus = sum(1 for r in ranks if r <= 10) * 5
        s["score"] = s["product_count"] * 10 + top10_bonus + min(s["total_reviews"] // 100, 30)

    keyword_stats = sorted(stats.values(), key=lambda x: x["score"], reverse=True)

    print(f"  [momo] ✓ 共 {len(unique)} 個唯一商品，命中 {len(keyword_stats)} 個關鍵字")
    return {"products": unique, "keyword_stats": keyword_stats}


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    result = scrape(num_pages=3)
    print(f"\nTop 10 關鍵字（每 100g 標準化價格）：")
    for kw in result["keyword_stats"][:10]:
        if kw["per100g_avg"]:
            p100 = f"${kw['per100g_avg']}/100g"
            rng = f"(${kw['per100g_min']}-${kw['per100g_max']})"
            half = f"≈半磅 ${kw['per_half_lb_avg']}"
        else:
            p100 = "(無重量資料)"
            rng = ""
            half = ""
        single = kw.get("single_origin_count", 0)
        multi = kw.get("multi_origin_count", 0)
        composition = f"{single} 單品 + {multi} 任選包"
        print(f"  {kw['name']:10s} ({kw['category']:10s}) "
              f"{p100:>14s} {rng:18s} {half:14s}  "
              f"{composition:18s}  排名 #{kw['best_rank']:3d}  分數 {kw['score']:3d}")

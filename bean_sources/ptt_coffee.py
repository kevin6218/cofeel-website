#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PTT coffee 板爬蟲。
抓最近 N 頁文章，解析推文數，並用 keywords.py 比對關鍵字命中。

回傳結構：
{
    "posts": [
        {"title": ..., "url": ..., "author": ..., "date": ..., "push": int, "keywords": [...]},
        ...
    ],
    "keyword_stats": [
        {"name": "耶加雪菲", "category": "region", "post_count": 5, "push_total": 47, "score": 52, "examples": [post_url, ...]},
        ...
    ]
}
"""

import re
import sys
import time
import requests
from bs4 import BeautifulSoup
from typing import Optional

from .keywords import match_keywords

BASE_URL = "https://www.ptt.cc"
BOARD_URL = f"{BASE_URL}/bbs/coffee/index.html"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}

DELAY_SECS = 1.2   # 每次請求間隔，避免被擋
MAX_RETRIES = 3


def parse_push(nrec_text: str) -> int:
    """解析 PTT 推文數字串為整數。
    '爆' = 100, 'XX' = -50, 'X1'~'X9' = -1~-9 (近似), 數字 = 正推文數
    """
    s = (nrec_text or "").strip()
    if not s:
        return 0
    if s == "爆":
        return 100
    if s.startswith("X"):
        # XX = -10 ~ -99, 取保守值
        if s == "XX":
            return -50
        rest = s[1:]
        if rest.isdigit():
            return -int(rest)
        return -10
    if s.isdigit():
        return int(s)
    return 0


def fetch_page(url: str, session: requests.Session) -> Optional[BeautifulSoup]:
    last_err = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = session.get(url, timeout=20)
            resp.raise_for_status()
            return BeautifulSoup(resp.text, "html.parser")
        except Exception as e:
            last_err = e
            if attempt < MAX_RETRIES:
                wait = 2 ** attempt
                print(f"  [PTT] 第 {attempt} 次失敗 ({type(e).__name__})，{wait}s 後重試...")
                time.sleep(wait)
    print(f"  [PTT] 取頁最終失敗 {url}: {last_err}")
    return None


def parse_index_page(soup: BeautifulSoup) -> tuple[list[dict], Optional[str]]:
    """解析一頁的文章清單；回傳 (posts, prev_page_url)"""
    posts = []
    for ent in soup.select("div.r-list-container div.r-ent"):
        title_a = ent.select_one("div.title a")
        if not title_a:
            # 文章已被刪除
            continue
        title = title_a.get_text(strip=True)
        href = title_a.get("href", "")
        url = BASE_URL + href if href.startswith("/") else href

        nrec = ent.select_one("div.nrec span")
        push = parse_push(nrec.get_text(strip=True)) if nrec else 0

        author_el = ent.select_one("div.meta div.author")
        date_el = ent.select_one("div.meta div.date")
        author = author_el.get_text(strip=True) if author_el else ""
        date = date_el.get_text(strip=True) if date_el else ""

        posts.append({
            "title": title,
            "url": url,
            "author": author,
            "date": date,
            "push": push,
        })

    # 上一頁連結
    prev_url = None
    for a in soup.select("div.btn-group-paging a.btn.wide"):
        if "上頁" in a.get_text():
            href = a.get("href")
            if href:
                prev_url = BASE_URL + href
            break

    return posts, prev_url


def scrape(num_pages: int = 8) -> dict:
    """抓 coffee 板最近 num_pages 頁的文章。約 1 頁 20 篇，預設 8 頁 ≈ 160 篇 ≈ 1 週量。"""
    session = requests.Session()
    session.headers.update(HEADERS)

    all_posts = []
    next_url = BOARD_URL

    print(f"  [PTT] 開始抓 coffee 板 {num_pages} 頁...")
    for i in range(num_pages):
        if not next_url:
            break
        soup = fetch_page(next_url, session)
        if soup is None:
            break
        posts, prev_url = parse_index_page(soup)
        all_posts.extend(posts)
        print(f"  [PTT] 第 {i+1} 頁 → {len(posts)} 篇")
        next_url = prev_url
        time.sleep(DELAY_SECS)

    # 過濾掉「公告」「板規」之類
    filtered = [
        p for p in all_posts
        if not any(tag in p["title"] for tag in ["[公告]", "Re: [公告]", "[板規]", "[置底]"])
    ]

    # 比對關鍵字
    for p in filtered:
        p["keywords"] = [
            {"name": kw["name"], "category": kw["category"]}
            for kw in match_keywords(p["title"])
        ]

    # 聚合關鍵字統計
    stats: dict[str, dict] = {}
    for p in filtered:
        for kw in p["keywords"]:
            key = kw["name"]
            if key not in stats:
                stats[key] = {
                    "name": kw["name"],
                    "category": kw["category"],
                    "post_count": 0,
                    "push_total": 0,
                    "examples": [],
                }
            stats[key]["post_count"] += 1
            stats[key]["push_total"] += max(p["push"], 0)
            if len(stats[key]["examples"]) < 3:
                stats[key]["examples"].append({"title": p["title"], "url": p["url"]})

    # score = post_count * 5 + push_total（讓有討論的文章不要被超高推文蓋過）
    for s in stats.values():
        s["score"] = s["post_count"] * 5 + s["push_total"]

    keyword_stats = sorted(stats.values(), key=lambda x: x["score"], reverse=True)

    print(f"  [PTT] ✓ 共 {len(filtered)} 篇有效文章，命中 {len(keyword_stats)} 個關鍵字")
    return {"posts": filtered, "keyword_stats": keyword_stats}


if __name__ == "__main__":
    # 直接執行此檔可做測試
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    result = scrape(num_pages=3)
    print(f"\nTop 10 關鍵字：")
    for kw in result["keyword_stats"][:10]:
        print(f"  {kw['name']:12s} ({kw['category']:10s}) 文章 {kw['post_count']:3d} 推文 {kw['push_total']:4d} 分數 {kw['score']:4d}")

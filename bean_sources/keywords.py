#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
咖啡豆關鍵字字典：產地、處理法、品種、知名產區/莊園。
用來從 PTT 標題、Google Trends 等資料中辨識「在討論哪支豆」。

每個關鍵字是一個 dict，包含：
- name: 標準名稱（報表顯示用）
- aliases: 別名清單（爬蟲比對用，含繁簡、慣用寫法）
- category: 分類（origin / processing / variety / region）
"""

# ── 產區 / 國家 ────────────────────────────────────────────────────────────────
ORIGINS = [
    {"name": "衣索比亞", "aliases": ["衣索比亞", "伊索比亞", "衣索匹亞", "Ethiopia", "ethiopia"]},
    {"name": "肯亞",     "aliases": ["肯亞", "肯尼亞", "Kenya", "kenya"]},
    {"name": "瓜地馬拉", "aliases": ["瓜地馬拉", "瓜地", "危地馬拉", "Guatemala", "guatemala"]},
    {"name": "巴拿馬",   "aliases": ["巴拿馬", "Panama", "panama"]},
    {"name": "葉門",     "aliases": ["葉門", "也門", "Yemen", "yemen"]},
    {"name": "哥倫比亞", "aliases": ["哥倫比亞", "Colombia", "colombia"]},
    {"name": "哥斯大黎加", "aliases": ["哥斯大黎加", "哥斯達黎加", "Costa Rica", "costa rica"]},
    {"name": "巴西",     "aliases": ["巴西", "Brazil", "brazil", "brasil"]},
    {"name": "印尼",     "aliases": ["印尼", "Indonesia", "indonesia"]},
    {"name": "蘇門答臘", "aliases": ["蘇門答臘", "蘇門", "Sumatra", "sumatra"]},
    {"name": "曼特寧",   "aliases": ["曼特寧", "Mandheling", "mandheling"]},
    {"name": "牙買加",   "aliases": ["牙買加", "Jamaica", "jamaica"]},
    {"name": "夏威夷",   "aliases": ["夏威夷", "Hawaii", "hawaii", "Kona", "kona", "可娜"]},
    {"name": "玻利維亞", "aliases": ["玻利維亞", "Bolivia", "bolivia"]},
    {"name": "宏都拉斯", "aliases": ["宏都拉斯", "Honduras", "honduras"]},
    {"name": "薩爾瓦多", "aliases": ["薩爾瓦多", "薩爾瓦多爾", "El Salvador", "salvador"]},
    {"name": "尼加拉瓜", "aliases": ["尼加拉瓜", "Nicaragua", "nicaragua"]},
    {"name": "厄瓜多",   "aliases": ["厄瓜多", "Ecuador", "ecuador"]},
    {"name": "秘魯",     "aliases": ["秘魯", "祕魯", "Peru", "peru"]},
    {"name": "盧安達",   "aliases": ["盧安達", "Rwanda", "rwanda"]},
    {"name": "蒲隆地",   "aliases": ["蒲隆地", "Burundi", "burundi"]},
    {"name": "坦尚尼亞", "aliases": ["坦尚尼亞", "坦桑尼亞", "Tanzania", "tanzania"]},
    {"name": "烏干達",   "aliases": ["烏干達", "Uganda", "uganda"]},
    {"name": "墨西哥",   "aliases": ["墨西哥", "Mexico", "mexico"]},
    {"name": "東帝汶",   "aliases": ["東帝汶", "Timor", "timor"]},
    {"name": "越南",     "aliases": ["越南", "Vietnam", "vietnam"]},
]

for o in ORIGINS:
    o["category"] = "origin"


# ── 處理法 ────────────────────────────────────────────────────────────────────
PROCESSING = [
    {"name": "水洗",       "aliases": ["水洗", "washed", "Washed"]},
    {"name": "日曬",       "aliases": ["日曬", "日晒", "natural", "Natural"]},
    {"name": "蜜處理",     "aliases": ["蜜處理", "honey", "Honey"]},
    {"name": "厭氧發酵",   "aliases": ["厭氧", "厭氧發酵", "anaerobic", "Anaerobic"]},
    {"name": "二次發酵",   "aliases": ["二次發酵", "雙重發酵", "double fermentation"]},
    {"name": "酒香處理",   "aliases": ["酒香", "酒桶", "wine", "Wine"]},
    {"name": "紅蜜",       "aliases": ["紅蜜", "red honey"]},
    {"name": "黃蜜",       "aliases": ["黃蜜", "yellow honey"]},
    {"name": "黑蜜",       "aliases": ["黑蜜", "black honey"]},
    {"name": "白蜜",       "aliases": ["白蜜", "white honey"]},
    {"name": "半水洗",     "aliases": ["半水洗", "semi-washed"]},
    {"name": "濕剝法",     "aliases": ["濕剝", "wet hulled", "wet-hulled"]},
    {"name": "葡萄乾蜜",   "aliases": ["葡萄乾蜜", "raisin honey"]},
]

for p in PROCESSING:
    p["category"] = "processing"


# ── 品種 ──────────────────────────────────────────────────────────────────────
VARIETY = [
    {"name": "藝伎",     "aliases": ["藝伎", "瑰夏", "Geisha", "geisha", "Gesha"]},
    {"name": "波旁",     "aliases": ["波旁", "Bourbon", "bourbon"]},
    {"name": "SL28",     "aliases": ["SL28", "sl28"]},
    {"name": "SL34",     "aliases": ["SL34", "sl34"]},
    {"name": "卡杜拉",   "aliases": ["卡杜拉", "Caturra", "caturra"]},
    {"name": "卡杜艾",   "aliases": ["卡杜艾", "Catuai", "catuai"]},
    {"name": "鐵比卡",   "aliases": ["鐵比卡", "鐵皮卡", "Typica", "typica"]},
    {"name": "帕卡瑪拉", "aliases": ["帕卡瑪拉", "Pacamara", "pacamara"]},
    {"name": "帕卡斯",   "aliases": ["帕卡斯", "Pacas", "pacas"]},
    {"name": "馬拉戈日佩", "aliases": ["馬拉戈日佩", "Maragogype", "maragogype"]},
    {"name": "薇拉莎奇", "aliases": ["薇拉莎奇", "Villa Sarchi", "villa sarchi"]},
    {"name": "黃波旁",   "aliases": ["黃波旁", "Yellow Bourbon", "yellow bourbon"]},
    {"name": "粉紅波旁", "aliases": ["粉紅波旁", "Pink Bourbon", "pink bourbon"]},
    {"name": "羅布斯塔", "aliases": ["羅布斯塔", "Robusta", "robusta"]},
    {"name": "賴比瑞亞", "aliases": ["賴比瑞亞", "Liberica", "liberica"]},
]

for v in VARIETY:
    v["category"] = "variety"


# ── 知名產區 / 莊園 ───────────────────────────────────────────────────────────
REGION = [
    {"name": "耶加雪菲", "aliases": ["耶加雪菲", "耶加", "Yirgacheffe", "yirgacheffe"]},
    {"name": "西達摩",   "aliases": ["西達摩", "西達莫", "Sidamo", "sidamo", "Sidama", "sidama"]},
    {"name": "古吉",     "aliases": ["古吉", "古杰", "Guji", "guji"]},
    {"name": "罕貝拉",   "aliases": ["罕貝拉", "Hambela", "hambela"]},
    {"name": "孔加",     "aliases": ["孔加", "Konga", "konga"]},
    {"name": "翡翠莊園", "aliases": ["翡翠莊園", "翡翠", "Hacienda Esmeralda", "esmeralda"]},
    {"name": "瑰夏村",   "aliases": ["瑰夏村", "Gesha Village", "gesha village"]},
    {"name": "花神",     "aliases": ["花神", "Flora"]},
    {"name": "黃曼",     "aliases": ["黃曼", "Gold Mandheling", "黃金曼特寧"]},
    {"name": "麝香貓",   "aliases": ["麝香貓", "Kopi Luwak", "kopi luwak"]},
    {"name": "古坑",     "aliases": ["古坑", "台灣咖啡"]},
    {"name": "阿里山",   "aliases": ["阿里山", "Alishan", "alishan"]},
    {"name": "藍山",     "aliases": ["藍山", "Blue Mountain", "blue mountain"]},
    {"name": "薇薇特南果", "aliases": ["薇薇特南果", "Huehuetenango", "huehuetenango"]},
    {"name": "安提瓜",   "aliases": ["安提瓜", "Antigua", "antigua"]},
    {"name": "塔拉珠",   "aliases": ["塔拉珠", "Tarrazu", "tarrazu"]},
    {"name": "娜玲瓏",   "aliases": ["娜玲瓏", "Nariño", "narino"]},
    {"name": "薇拉",     "aliases": ["薇拉", "Huila", "huila"]},
    {"name": "波奎特",   "aliases": ["波奎特", "Boquete", "boquete"]},
    {"name": "穆塔加",   "aliases": ["穆塔加", "Muntaga"]},
    {"name": "尼耶里",   "aliases": ["尼耶里", "Nyeri", "nyeri"]},
    {"name": "錫達摩",   "aliases": ["錫達摩"]},
]

for r in REGION:
    r["category"] = "region"


ALL_KEYWORDS = ORIGINS + PROCESSING + VARIETY + REGION


def match_keywords(text: str) -> list[dict]:
    """從一段文字（如 PTT 標題）中找出所有命中的關鍵字，去重後回傳。"""
    if not text:
        return []
    hits = []
    seen = set()
    lower = text.lower()
    for kw in ALL_KEYWORDS:
        for alias in kw["aliases"]:
            if alias.lower() in lower:
                if kw["name"] not in seen:
                    hits.append(kw)
                    seen.add(kw["name"])
                break
    return hits


# Google Trends 種子關鍵字（每批最多 5 個，pytrends 限制）
TRENDS_SEED_KEYWORDS = [
    # 第一批：經典產區
    ["藝伎咖啡", "耶加雪菲", "瓜地馬拉", "肯亞咖啡", "曼特寧"],
    # 第二批：處理法 / 風潮
    ["厭氧發酵", "日曬咖啡", "蜜處理", "冰滴咖啡", "手沖咖啡"],
    # 第三批：精品咖啡相關
    ["精品咖啡", "單品咖啡", "淺烘焙", "深烘焙", "義式咖啡"],
    # 第四批：莊園 / 高端
    ["翡翠莊園", "瑰夏", "藍山咖啡", "夏威夷可娜", "牙買加咖啡"],
    # 第五批：通路 / 沖煮
    ["咖啡豆推薦", "咖啡豆", "掛耳咖啡", "濃縮咖啡", "拿鐵"],
]

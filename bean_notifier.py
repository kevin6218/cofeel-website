#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
新豆開發週報：把 PTT 討論 + Google Trends 結果寄到指定信箱。
沿用既有 email_config.json（與 notifier.py 共用設定）。
"""

import json
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
from pathlib import Path
from datetime import date

from bean_sources import cross_ref

CONFIG_PATH = Path(__file__).parent / "email_config.json"

CATEGORY_LABELS = {
    "origin":     "產地",
    "region":     "產區/莊園",
    "variety":    "品種",
    "processing": "處理法",
}

CATEGORY_COLORS = {
    "origin":     "#8B4513",
    "region":     "#A0522D",
    "variety":    "#6B8E23",
    "processing": "#4682B4",
}


def load_config():
    if not CONFIG_PATH.exists():
        return None
    try:
        return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"  [email] 讀取設定失敗: {e}")
        return None


def _ptt_section(ptt_data: dict, top_n: int = 15) -> str:
    rows = ""
    for kw in ptt_data.get("keyword_stats", [])[:top_n]:
        label = CATEGORY_LABELS.get(kw["category"], kw["category"])
        color = CATEGORY_COLORS.get(kw["category"], "#666")
        examples_html = ""
        for ex in kw.get("examples", [])[:2]:
            tag = ('<span style="background:#fef3c7;color:#92400e;padding:0 4px;border-radius:3px;font-size:.7em;margin-right:4px">廣宣</span>'
                   if ex.get("is_commercial") else "")
            examples_html += (
                f'<a href="{ex["url"]}" style="color:#666;text-decoration:none;font-size:.78em;display:block;margin-top:2px">'
                f'  · {tag}{ex["title"][:55]}</a>'
            )

        com_c = kw.get("commercial_count", 0)
        dis_c = kw.get("discussion_count", 0)
        com_p = kw.get("commercial_pushes", 0)
        dis_p = kw.get("discussion_pushes", 0)

        posts_breakdown = (
            f'<div style="color:#4a5568">{kw["post_count"]} 篇</div>'
            f'<div style="font-size:.7em;color:#999">'
            f'業者 {com_c} ｜ 討論 {dis_c}</div>'
        )
        pushes_breakdown = (
            f'<div style="color:#c05621;font-weight:600">+{kw["push_total"]}</div>'
            f'<div style="font-size:.7em;color:#999">'
            f'業者 +{com_p} ｜ 討論 +{dis_p}</div>'
        )

        rows += (
            f'<tr>'
            f'<td style="padding:10px 8px;border-bottom:1px solid #e2e8f0">'
            f'<div style="font-weight:600;color:#2d3748">{kw["name"]}</div>'
            f'{examples_html}'
            f'</td>'
            f'<td style="padding:10px 8px;border-bottom:1px solid #e2e8f0">'
            f'<span style="background:{color};color:white;padding:2px 8px;border-radius:10px;font-size:.75em">{label}</span>'
            f'</td>'
            f'<td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right">{posts_breakdown}</td>'
            f'<td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right">{pushes_breakdown}</td>'
            f'<td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;color:#2b6cb0;font-weight:700">'
            f'{kw["score"]}'
            f'</td>'
            f'</tr>'
        )
    if not rows:
        rows = '<tr><td colspan="5" style="padding:20px;text-align:center;color:#999">(本週 PTT 沒有命中任何關鍵字)</td></tr>'

    return f"""
    <h2 style="margin:30px 0 8px;font-size:1.05rem;color:#2d3748">☕ PTT coffee 板 — 本週聲量</h2>
    <p style="margin:0 0 10px;color:#666;font-size:.78em">
      ⚠ 目前 PTT 聲量以「業者 [廣宣] 推銷文」為主（真實討論文標題很少寫具體豆款）。「業者」= 業者推銷、「討論」= 真實使用者文。
    </p>
    <table style="width:100%;border-collapse:collapse;background:#fafafa;border-radius:8px;overflow:hidden">
      <thead>
        <tr style="background:#2d3748;color:white">
          <th style="padding:10px 8px;text-align:left;font-size:.8em">關鍵字 / 代表文章</th>
          <th style="padding:10px 8px;text-align:left;font-size:.8em">分類</th>
          <th style="padding:10px 8px;text-align:right;font-size:.8em">文章數<br><span style="font-weight:400;font-size:.75em;opacity:.7">業者/討論</span></th>
          <th style="padding:10px 8px;text-align:right;font-size:.8em">推文<br><span style="font-weight:400;font-size:.75em;opacity:.7">業者/討論</span></th>
          <th style="padding:10px 8px;text-align:right;font-size:.8em">總分</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
    """


def _trends_section(trends_data: dict, top_n: int = 15) -> str:
    # 沒資料時整個區塊不渲染，避免報表出現空表格
    if not trends_data.get("rankings"):
        return ""

    rows = ""
    for row in trends_data.get("rankings", [])[:top_n]:
        growth = row["growth_pct"]
        if growth > 30:
            arrow_color = "#38a169"
            arrow = "↑↑"
        elif growth > 0:
            arrow_color = "#48bb78"
            arrow = "↑"
        elif growth < -30:
            arrow_color = "#e53e3e"
            arrow = "↓↓"
        elif growth < 0:
            arrow_color = "#f56565"
            arrow = "↓"
        else:
            arrow_color = "#a0aec0"
            arrow = "—"

        rows += (
            f'<tr>'
            f'<td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#2d3748">{row["keyword"]}</td>'
            f'<td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;color:#4a5568">{row["recent_avg"]:.1f}</td>'
            f'<td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;color:#a0aec0">{row["previous_avg"]:.1f}</td>'
            f'<td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;color:{arrow_color};font-weight:600">{arrow} {row["growth_pct"]:+.1f}%</td>'
            f'<td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;color:#2b6cb0;font-weight:700">{row["score"]}</td>'
            f'</tr>'
        )
    if not rows:
        rows = '<tr><td colspan="5" style="padding:20px;text-align:center;color:#999">(無 Trends 資料，可能被 Google 速率限制)</td></tr>'

    return f"""
    <h2 style="margin:30px 0 12px;font-size:1.05rem;color:#2d3748">📈 Google Trends — 台灣搜尋趨勢</h2>
    <table style="width:100%;border-collapse:collapse;background:#fafafa;border-radius:8px;overflow:hidden">
      <thead>
        <tr style="background:#2d3748;color:white">
          <th style="padding:10px 8px;text-align:left;font-size:.8em">關鍵字</th>
          <th style="padding:10px 8px;text-align:right;font-size:.8em">近 7 天</th>
          <th style="padding:10px 8px;text-align:right;font-size:.8em">前 7 天</th>
          <th style="padding:10px 8px;text-align:right;font-size:.8em">週成長</th>
          <th style="padding:10px 8px;text-align:right;font-size:.8em">分數</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
    <p style="margin:8px 4px 0;font-size:.75em;color:#999">分數 = 近期熱度 + 成長率 × 0.3，避免冷門詞漲一倍就霸榜</p>
    """


def _momo_section(momo_data: dict, top_n: int = 15) -> str:
    if not momo_data.get("keyword_stats"):
        return ""
    rows = ""
    for kw in momo_data["keyword_stats"][:top_n]:
        label = CATEGORY_LABELS.get(kw["category"], kw["category"])
        color = CATEGORY_COLORS.get(kw["category"], "#666")

        # 標準化價格（每 100g）— 才是真正可比較的數字
        if kw.get("per100g_avg"):
            avg_html = f'${kw["per100g_avg"]}<span style="font-size:.7em;color:#999">/100g</span>'
            half_html = f'≈半磅 ${kw["per_half_lb_avg"]}'
            range_html = f'${kw["per100g_min"]}–${kw["per100g_max"]}/100g'
        else:
            avg_html = '<span style="color:#bbb">無重量資料</span>'
            half_html = ""
            range_html = ""

        # 抓得到重量的 SKU 比例（資料品質指標）
        wq = f'{kw.get("weighted_skus", 0)}/{kw["product_count"]}'

        examples_html = ""
        for ex in kw.get("examples", [])[:2]:
            ex_price = f"${ex['price']}" if ex.get('price') else ""
            ex_weight = f"({ex['weight_g']}g)" if ex.get('weight_g') else "(?g)"
            ex_p100 = f"${ex['price_per_100g']}/100g" if ex.get('price_per_100g') else ""
            ex_rating = f"⭐{ex['rating']}" if ex.get('rating') else ""
            examples_html += (
                f'<a href="{ex["url"]}" style="color:#666;text-decoration:none;font-size:.78em;display:block;margin-top:2px">'
                f'  · {ex["name"][:55]} <span style="color:#999">{ex_weight}</span> '
                f'<span style="color:#c05621">{ex_price}</span> '
                f'<span style="color:#2b6cb0;font-weight:600">{ex_p100}</span> '
                f'<span style="color:#999">{ex_rating}</span></a>'
            )
        rows += (
            f'<tr>'
            f'<td style="padding:10px 8px;border-bottom:1px solid #e2e8f0">'
            f'<div style="font-weight:600;color:#2d3748">{kw["name"]}</div>'
            f'{examples_html}'
            f'</td>'
            f'<td style="padding:10px 8px;border-bottom:1px solid #e2e8f0">'
            f'<span style="background:{color};color:white;padding:2px 8px;border-radius:10px;font-size:.75em">{label}</span>'
            f'</td>'
            f'<td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;color:#4a5568">{kw["product_count"]} 件<br><span style="font-size:.7em;color:#bbb">({wq} 有重量)</span></td>'
            f'<td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;color:#c05621;font-weight:600;white-space:nowrap">{avg_html}<br><span style="font-size:.75em;color:#999">{half_html}</span></td>'
            f'<td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;color:#999;font-size:.8em;white-space:nowrap">{range_html}</td>'
            f'<td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;color:#666">#{kw["best_rank"]}</td>'
            f'<td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;color:#2b6cb0;font-weight:700">{kw["score"]}</td>'
            f'</tr>'
        )
    return f"""
    <h2 style="margin:30px 0 12px;font-size:1.05rem;color:#2d3748">🛒 momo 購物網 — 咖啡豆熱銷</h2>
    <p style="margin:0 0 8px;color:#666;font-size:.78em">
      均價單位：每 100g 標準化（已排除無重量資料的 SKU）｜ 半磅 ≈ 227g
    </p>
    <table style="width:100%;border-collapse:collapse;background:#fafafa;border-radius:8px;overflow:hidden">
      <thead>
        <tr style="background:#2d3748;color:white">
          <th style="padding:10px 8px;text-align:left;font-size:.8em">關鍵字 / 代表商品</th>
          <th style="padding:10px 8px;text-align:left;font-size:.8em">分類</th>
          <th style="padding:10px 8px;text-align:right;font-size:.8em">商品數</th>
          <th style="padding:10px 8px;text-align:right;font-size:.8em">均價(每100g)<br><span style="font-weight:400;font-size:.75em;opacity:.7">/半磅換算</span></th>
          <th style="padding:10px 8px;text-align:right;font-size:.8em">每100g 區間</th>
          <th style="padding:10px 8px;text-align:right;font-size:.8em">最佳排名</th>
          <th style="padding:10px 8px;text-align:right;font-size:.8em">熱銷分</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
    """


def _cross_ref_section(cross_items: list[dict]) -> str:
    if not cross_items:
        return ""
    groups = cross_ref.summarize_by_quadrant(cross_items)

    def render_group(items: list[dict], q_key: str) -> str:
        if not items:
            return ""
        q = cross_ref.QUADRANTS[q_key]
        cells = ""
        for it in items[:10]:
            if it.get('momo_per100g_avg'):
                price = f"${it['momo_per100g_avg']}/100g（半磅 ${it['momo_per_half_lb_avg']}）"
            elif it.get('momo_products'):
                price = "價格無法標準化"
            else:
                price = "—"
            cells += (
                f'<tr>'
                f'<td style="padding:6px 10px;border-bottom:1px solid #eee;font-weight:600">{it["name"]}</td>'
                f'<td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;color:#666;font-size:.85em">PTT {it.get("ptt_posts",0)} 篇/{it.get("ptt_score",0)} 分</td>'
                f'<td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;color:#666;font-size:.85em">momo {it.get("momo_products",0)} 件 ｜ {price}</td>'
                f'</tr>'
            )
        return f"""
        <div style="margin:14px 0;border-left:5px solid {q['color']};padding-left:14px">
          <h3 style="margin:0 0 6px;color:{q['color']};font-size:1rem">{q['emoji']} {q['short']} — {q['label']} ({len(items)})</h3>
          <table style="width:100%;border-collapse:collapse">{cells}</table>
        </div>
        """

    return f"""
    <h2 style="margin:30px 0 8px;font-size:1.05rem;color:#2d3748">🎯 採購決策矩陣 — PTT 業者聲量 × momo 鋪貨</h2>
    <p style="margin:0 0 14px;color:#666;font-size:.85em">
      <strong>解讀：</strong>「業者搶推」= PTT [廣宣] 文有提到（代表同行看好這支豆）。「鋪貨」= momo 商品數。<br>
      🟨 <strong>採購機會</strong>：業者搶推但 momo 還沒鋪滿 ← 先機<br>
      🟦 <strong>紅海</strong>：業者搶推 + momo 已鋪滿 ← 難進場<br>
      🟩 <strong>沉默長銷</strong>：業者沒推但 momo 賣得好 ← 穩定剛需<br>
      ⬜ <strong>未開發</strong>：兩邊都少
    </p>
    {render_group(groups.get('opportunity', []), 'opportunity')}
    {render_group(groups.get('red_sea', []), 'red_sea')}
    {render_group(groups.get('silent_seller', []), 'silent_seller')}
    {render_group(groups.get('undeveloped', []), 'undeveloped')}
    """


def build_html_body(ptt_data: dict, trends_data: dict, momo_data: dict,
                    cross_items: list[dict], new_items: list[dict]) -> str:
    today_str = date.today().isoformat()

    new_items_html = ""
    if new_items:
        for it in new_items[:10]:
            new_items_html += (
                f'<li style="margin:6px 0;color:#2d3748">'
                f'<strong style="color:#c05621">{it["name"]}</strong> '
                f'<span style="color:#999;font-size:.85em">— {it["reason"]}</span>'
                f'</li>'
            )
        new_items_block = f"""
        <div style="background:linear-gradient(135deg,#fff5e6,#ffe8cc);padding:16px 20px;border-radius:8px;margin:20px 0">
          <h3 style="margin:0 0 10px;color:#9c4221;font-size:1rem">🆕 本週首次出現 / 大幅崛起</h3>
          <ul style="margin:0;padding-left:20px">{new_items_html}</ul>
        </div>
        """
    else:
        new_items_block = ""

    return f"""<!DOCTYPE html>
<html><body style="font-family:-apple-system,'Microsoft JhengHei',sans-serif;background:#f7fafc;margin:0;padding:20px">
<div style="max-width:820px;margin:0 auto;background:white;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#3d2817,#6f4e37);color:white;padding:24px 28px">
    <h1 style="margin:0;font-size:1.4rem">☕ 凱飛新豆開發週報</h1>
    <p style="margin:6px 0 0;opacity:.85;font-size:.85rem">
      {today_str} ｜ 來源：PTT coffee 板 + Google Trends 台灣
    </p>
  </div>
  <div style="padding:24px 28px">
    {new_items_block}
    {_cross_ref_section(cross_items)}
    {_ptt_section(ptt_data)}
    {_momo_section(momo_data)}
    {_trends_section(trends_data)}
  </div>
  <div style="padding:14px 28px;color:#a0aec0;font-size:.75em;text-align:center;border-top:1px solid #e2e8f0">
    完整快照：<code>bean_results\\{today_str}.html</code>
    &nbsp;｜&nbsp; 由 bean_finder.py 自動產生
  </div>
</div>
</body></html>"""


def send_email(ptt_data: dict, trends_data: dict, momo_data: dict,
               cross_items: list[dict], new_items: list[dict]) -> bool:
    config = load_config()
    if not config:
        print("  [email] 找不到 email_config.json，跳過寄信")
        print("         請複製 email_config.example.json 為 email_config.json 並填好")
        return False

    smtp_host = config.get("smtp_host", "smtp.gmail.com")
    smtp_port = int(config.get("smtp_port", 587))
    username  = config["username"]
    password  = config["password"]

    # 偵測尚未填入的範本值，靜默跳過（避免 SMTP 驗證失敗的嚇人錯誤）
    if "請填" in username or "請填" in password or "your_gmail" in username.lower():
        print("  [email] email_config.json 尚未填入真實帳號密碼，跳過寄信")
        print("         請參考『Email設定步驟_回來看這個.txt』")
        return False
    sender    = config.get("from", username)
    recipient = config.get("to", username)
    sender_name = "凱飛新豆開發週報"

    # 主旨優先顯示「採購機會」象限第一名
    opportunities = [it for it in (cross_items or []) if it.get("quadrant") == "opportunity"]
    subject = f"☕ 新豆週報 {date.today().isoformat()}"
    if opportunities:
        subject += f" — 🟨 業者搶推中：{opportunities[0]['name']}"
    elif ptt_data.get("keyword_stats"):
        subject += f" — 業者主推：{ptt_data['keyword_stats'][0]['name']}"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = formataddr((sender_name, sender))
    msg["To"]      = recipient

    html_body = build_html_body(ptt_data, trends_data, momo_data, cross_items, new_items)
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        ctx = ssl.create_default_context()
        with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as server:
            server.starttls(context=ctx)
            server.login(username, password)
            server.sendmail(sender, [recipient], msg.as_string())
        print(f"  [email] ✓ 已寄出到 {recipient}")
        return True
    except smtplib.SMTPAuthenticationError as e:
        print(f"  [email] 驗證失敗：{e}")
        print(f"         Gmail 須用『應用程式密碼』，不是登入密碼")
        return False
    except Exception as e:
        print(f"  [email] 寄信失敗: {type(e).__name__}: {e}")
        return False

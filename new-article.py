"""
CoFeel 新文章發布工具
用法：python new-article.py <檔名> "<文章標題>"
範例：python new-article.py yirgacheffe-guide "耶加雪菲完整介紹"
"""

import sys
import os
import subprocess
from datetime import date
from xml.etree import ElementTree as ET

SITE_URL = "https://www.cofeel.com.tw"
SITEMAP_PATH = os.path.join(os.path.dirname(__file__), "sitemap.xml")
BLOG_DIR = os.path.join(os.path.dirname(__file__), "blog")

def update_sitemap(filename):
    """在 sitemap.xml 加入新文章"""
    tree = ET.parse(SITEMAP_PATH)
    root = tree.getroot()
    ns = "http://www.sitemaps.org/schemas/sitemap/0.9"

    new_url = f"{SITE_URL}/blog/{filename}"

    # 檢查是否已存在
    for url in root.findall(f"{{{ns}}}url"):
        loc = url.find(f"{{{ns}}}loc")
        if loc is not None and loc.text == new_url:
            print(f"ℹ️  Sitemap 已有此網址，略過：{new_url}")
            return False

    # 加入新項目
    url_elem = ET.SubElement(root, "url")
    ET.SubElement(url_elem, "loc").text = new_url
    ET.SubElement(url_elem, "changefreq").text = "monthly"
    ET.SubElement(url_elem, "priority").text = "0.7"

    # 格式化後寫回
    ET.indent(tree, space="  ")
    tree.write(SITEMAP_PATH, encoding="unicode", xml_declaration=True)
    print(f"✅ Sitemap 已更新：{new_url}")
    return True

def git_push(filename, title):
    """git add → commit → push"""
    try:
        subprocess.run(["git", "add", f"blog/{filename}", "sitemap.xml"], check=True)
        msg = f"Add article: {title} ({filename})"
        subprocess.run(["git", "commit", "-m", msg], check=True)
        subprocess.run(["git", "push", "origin", "main"], check=True)
        print("✅ 已推上 GitHub，Vercel 開始自動部署")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Git 操作失敗：{e}")
        return False

def print_gsc_reminder(filename):
    """提示去 Search Console 要求索引"""
    url = f"{SITE_URL}/blog/{filename}"
    print()
    print("=" * 55)
    print("📋 最後一步：去 Google Search Console 要求建立索引")
    print("=" * 55)
    print(f"1. 開啟：https://search.google.com/search-console")
    print(f"2. 上方搜尋框貼入：")
    print(f"   {url}")
    print(f"3. 按「要求建立索引」")
    print("=" * 55)

def main():
    if len(sys.argv) < 3:
        print("用法：python new-article.py <檔名> \"<文章標題>\"")
        print("範例：python new-article.py yirgacheffe-guide.html \"耶加雪菲完整介紹\"")
        sys.exit(1)

    filename = sys.argv[1]
    title = sys.argv[2]

    # 確認副檔名
    if not filename.endswith(".html"):
        filename += ".html"

    # 確認檔案存在
    filepath = os.path.join(BLOG_DIR, filename)
    if not os.path.exists(filepath):
        print(f"❌ 找不到檔案：{filepath}")
        print("請先確認文章 HTML 已放到 blog/ 資料夾")
        sys.exit(1)

    print(f"\n🚀 CoFeel 發布新文章：{title}")
    print(f"   檔案：blog/{filename}\n")

    # Step 1: 更新 Sitemap
    update_sitemap(filename)

    # Step 2: Git Push
    if git_push(filename, title):
        # Step 3: 提醒 GSC
        print_gsc_reminder(filename)
        print()
        print(f"🎉 完成！文章發布流程結束")
        print(f"   Vercel 約 1 分鐘後部署完成")
        print(f"   Google 收到索引請求後約 1~3 天收錄")
    else:
        print("請手動執行 git add / commit / push")

if __name__ == "__main__":
    main()

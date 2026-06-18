#!/usr/bin/env python3
"""一次性构建交通标志图库静态数据。"""
import json
import os
import re
import subprocess
from html.parser import HTMLParser
from urllib.parse import urlparse

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(BASE_DIR, "frontend", "public", "images", "traffic-signs")
DATA_DIR = os.path.join(BASE_DIR, "frontend", "public", "data")
LIST_URL = "https://szjj.sz.gov.cn/postmeta/i/49085.json"

os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)


def safe_filename(name: str, ext: str) -> str:
    """把标题转成安全的本地文件名（保留中文）。"""
    base = re.sub(r'[\\/:*?"<>|\s]+', "_", name).strip("_")
    if not base:
        base = "untitled"
    return f"{base}{ext}"


def infer_category(title: str) -> str:
    """根据标题推断标志分类。"""
    t = title
    if any(k in t for k in ("线", "车道线", "停止线", "导流线", "网状线", "标线")):
        return "标线"
    if any(k in t for k in ("警告", "注意", "慢行", "易滑", "事故", "危险")):
        return "警告"
    if any(k in t for k in ("禁止", "解除", "限制", "限", "停", "让", "禁")):
        return "禁令"
    if any(k in t for k in ("指示", "直行", "转弯", "靠", "环岛", "单行", "会车", "先行")):
        return "指示"
    if any(k in t for k in ("指路", "出口", "入口", "方向", "地点", "编号", "预告", "距离", "收费站", "停车场", "服务区")):
        return "指路"
    return "其他"


class DetailParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_content = False
        self.depth = 0
        self.image = None
        self.texts = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "div" and attrs.get("class") == "content":
            self.in_content = True
            self.depth = 1
        elif self.in_content:
            self.depth += 1
            if tag == "img" and attrs.get("class") == "nfw-cms-img":
                self.image = attrs.get("src")

    def handle_endtag(self, tag):
        if self.in_content:
            self.depth -= 1
            if self.depth == 0:
                self.in_content = False

    def handle_data(self, data):
        if self.in_content:
            d = data.strip()
            if d:
                self.texts.append(d)


def curl(url: str, timeout: int = 30) -> bytes:
    """用 curl 下载，绕过该站点的 TLS 兼容问题。"""
    result = subprocess.run(
        ["curl", "-sL", "--max-time", str(timeout), url],
        capture_output=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"下载失败 {url}: {result.stderr.decode()}")
    return result.stdout


def fetch_article_list() -> list:
    data = json.loads(curl(LIST_URL).decode("utf-8"))
    return data.get("articles", [])


def parse_detail(html: bytes) -> dict:
    parser = DetailParser()
    parser.feed(html.decode("utf-8", errors="ignore"))
    full_text = " ".join(parser.texts)
    # 去掉标题重复部分，取后面的说明文字
    lines = [l.strip() for l in full_text.split("标志") if l.strip()]
    description = ""
    if lines:
        description = lines[-1]
    if not description:
        description = full_text[:200]
    return {"image": parser.image, "description": description}


def ext_from_url(url: str) -> str:
    path = urlparse(url).path
    ext = os.path.splitext(path)[1].lower()
    return ext if ext in (".gif", ".png", ".jpg", ".jpeg") else ".gif"


def build_shenzhen():
    articles = fetch_article_list()
    results = []
    seen_names = set()
    for art in articles:
        raw_title = art.get("title", "").replace("标志图解", "").strip()
        if not raw_title:
            continue
        detail_url = art.get("url", "")
        if not detail_url:
            continue
        try:
            html = curl(detail_url)
            detail = parse_detail(html)
        except Exception as e:
            print(f"跳过 {raw_title}: {e}")
            continue
        image_url = detail.get("image") or art.get("cover")
        if not image_url:
            print(f"跳过 {raw_title}: 无图片")
            continue
        ext = ext_from_url(image_url)
        filename = safe_filename(raw_title, ext)
        # 处理重名
        if filename in seen_names:
            base, e = os.path.splitext(filename)
            filename = f"{base}_{len(seen_names)}{e}"
        seen_names.add(filename)
        local_path = os.path.join(OUT_DIR, filename)
        if not os.path.exists(local_path):
            try:
                with open(local_path, "wb") as f:
                    f.write(curl(image_url))
            except Exception as e:
                print(f"下载图片失败 {image_url}: {e}")
                continue
        results.append({
            "id": f"shenzhen-{art.get('id', art.get('url').split('/')[-1].replace('.html', ''))}",
            "title": raw_title,
            "category": infer_category(raw_title),
            "source": "shenzhen",
            "image": f"/images/traffic-signs/{filename}",
            "description": detail.get("description", ""),
        })
    return results


PDF_PATH = "/Users/box/Downloads/69da61319333ade9e9774f63e21b5dab.pdf"


def build_gb5768():
    results = []
    # 获取总页数
    info = subprocess.run(
        ["pdfinfo", PDF_PATH], capture_output=True, text=True, check=True
    ).stdout
    pages_match = re.search(r"Pages:\s+(\d+)", info)
    if not pages_match:
        raise RuntimeError("无法获取 PDF 页数")
    total_pages = int(pages_match.group(1))
    for page in range(1, total_pages + 1):
        img_name = f"gb5768-page-{page:02d}.jpg"
        img_path = os.path.join(OUT_DIR, img_name)
        if not os.path.exists(img_path):
            subprocess.run(
                ["pdftoppm", "-png", "-r", "200", "-f", str(page), "-l", str(page), PDF_PATH, "/tmp/gb-page"],
                check=True,
            )
            # 转换为 jpg 并压缩尺寸
            subprocess.run(
                ["sips", "-Z", "1200", "-s", "format", "jpeg", f"/tmp/gb-page-{page:02d}.png", "--out", img_path],
                check=True,
            )
        # 提取该页文字
        text = subprocess.run(
            ["pdftotext", "-layout", "-f", str(page), "-l", str(page), PDF_PATH, "-"],
            capture_output=True, text=True, check=True,
        ).stdout
        text = re.sub(r"\s+", " ", text).strip()[:300]
        results.append({
            "id": f"gb5768-page-{page:02d}",
            "title": f"GB 5768 第{page}页",
            "category": "GB 5768 图集",
            "source": "gb5768",
            "image": f"/images/traffic-signs/{img_name}",
            "description": text,
            "page": page,
        })
    return results


if __name__ == "__main__":
    shenzhen_signs = build_shenzhen()
    gb_signs = build_gb5768()
    output = {"signs": shenzhen_signs + gb_signs}
    with open(os.path.join(DATA_DIR, "traffic-signs.json"), "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"深圳交警：{len(shenzhen_signs)} 条，GB 5768：{len(gb_signs)} 页")

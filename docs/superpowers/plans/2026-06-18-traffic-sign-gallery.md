# 交通标志图库 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把深圳交警官网 213 篇标志图解和 GB 5768 PDF 整理成本地静态资源，新增 `/tools/traffic-signs` 图库页面，支持分类筛选、搜索和详情弹窗，同时保留现有学习进度页不变。

**Architecture:** 使用一个 Python 构建脚本一次性爬取/处理两个数据源，生成 `frontend/public/data/traffic-signs.json` 和 `frontend/public/images/traffic-signs/` 下的本地图片；前端用 Vue 3 Composition API 读取 JSON 并渲染图库，筛选和搜索纯前端完成。

**Tech Stack:** Python 3（标准库 + `curl` 下载）、Vue 3 + Vue Router、`@vueuse/core` 可选、现有项目样式变量。

---

## File Structure

| 文件 | 说明 |
|------|------|
| `scripts/build-traffic-signs.py` | 一次性构建脚本：爬深圳交警、渲染 PDF、生成本地 JSON/图片 |
| `frontend/public/data/traffic-signs.json` | 图库数据源（深圳 + GB 5768 合并） |
| `frontend/public/images/traffic-signs/*` | 本地图片 |
| `frontend/src/views/tools/TrafficSignGallery.vue` | 图库页面 |
| `frontend/src/router/index.js` | 注册 `/tools/traffic-signs` 路由 |
| `frontend/src/components/Sidebar.vue` | 新增侧边栏入口 |
| `frontend/src/views/tools/DrivingLicenseStudy.vue` | 新增「查看全部标志图库」链接 |
| `frontend/src/views/Home.vue` | 可选：首页工具卡片 |

---

## Data Schema

```json
{
  "signs": [
    {
      "id": "shenzhen-4470729",
      "title": "注意行人",
      "category": "警告",
      "source": "shenzhen",
      "image": "/images/traffic-signs/注意行人.gif",
      "description": "用以警告车辆驾驶人减速慢行，注意行人。"
    },
    {
      "id": "gb5768-page-08",
      "title": "GB 5768 第8页：出口预告等指路标志",
      "category": "GB 5768 图集",
      "source": "gb5768",
      "image": "/images/traffic-signs/gb5768-page-08.jpg",
      "description": "本页包含下一出口、出口编号预告、出口预告、地点方向等标志。",
      "page": 8
    }
  ]
}
```

---

## Task 1: 创建并运行深圳交警数据爬取脚本

**Files:**
- Create: `scripts/build-traffic-signs.py`
- Create: `frontend/public/data/traffic-signs.json`（由脚本生成）
- Create: `frontend/public/images/traffic-signs/*.gif/png`（由脚本生成）

- [ ] **Step 1: 编写脚本主体**

```python
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


if __name__ == "__main__":
    shenzhen_signs = build_shenzhen()
    output = {"signs": shenzhen_signs}
    with open(os.path.join(DATA_DIR, "traffic-signs.json"), "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"深圳交警：生成 {len(shenzhen_signs)} 条记录")
```

- [ ] **Step 2: 运行脚本**

```bash
cd /Users/box/new/Mac/web-Project
python3 scripts/build-traffic-signs.py
```

Expected output:
```
深圳交警：生成 213 条记录（或略少，取决于解析成功数）
```

- [ ] **Step 3: 验证生成的文件**

```bash
ls frontend/public/images/traffic-signs | wc -l
python3 -m json.tool frontend/public/data/traffic-signs.json > /dev/null && echo "JSON valid"
```

- [ ] **Step 4: Commit**

```bash
git add scripts/build-traffic-signs.py frontend/public/data/traffic-signs.json frontend/public/images/traffic-signs/
git commit -m "feat(gallery): 爬取深圳交警标志图解并生成本地数据"
```

---

## Task 2: 在脚本中加入 GB 5768 PDF 处理

**Files:**
- Modify: `scripts/build-traffic-signs.py`
- Create: `frontend/public/images/traffic-signs/gb5768-page-*.jpg`

- [ ] **Step 1: 在脚本末尾新增 PDF 处理函数并写入合并结果**

在 `scripts/build-traffic-signs.py` 中追加以下函数，并替换最后的 `if __name__ == "__main__"` 块：

```python
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
```

- [ ] **Step 2: 重新运行脚本**

```bash
python3 scripts/build-traffic-signs.py
```

Expected output:
```
深圳交警：213 条，GB 5768：23 页
```

- [ ] **Step 3: 验证 JSON 和 PDF 图片**

```bash
ls frontend/public/images/traffic-signs/gb5768-page-* | wc -l
python3 -m json.tool frontend/public/data/traffic-signs.json > /dev/null && echo "JSON valid"
```

- [ ] **Step 4: Commit**

```bash
git add scripts/build-traffic-signs.py frontend/public/data/traffic-signs.json frontend/public/images/traffic-signs/
git commit -m "feat(gallery): 将 GB 5768 PDF 逐页渲染为图集图片"
```

---

## Task 3: 注册路由并添加入口

**Files:**
- Modify: `frontend/src/router/index.js`
- Modify: `frontend/src/components/Sidebar.vue`
- Modify: `frontend/src/views/tools/DrivingLicenseStudy.vue`
- Modify: `frontend/src/views/Home.vue`（可选）

- [ ] **Step 1: 在 `frontend/src/router/index.js` 中注册路由**

在 `driving-license-study` 路由后面插入：

```javascript
    {
      path: '/tools/traffic-signs',
      name: 'traffic-signs',
      component: () => import('../views/tools/TrafficSignGallery.vue'),
      meta: {
        title: '交通标志图库 - 驾考理论知识',
        description: '深圳交警与 GB 5768 道路交通标志图库，支持分类筛选、搜索和查看详情。'
      }
    },
```

- [ ] **Step 2: 在 `frontend/src/components/Sidebar.vue` 中新增入口**

在 `{ path: '/tools/driving-license-study', name: '科目一学习', icon: '📚' },` 后面插入：

```javascript
  { path: '/tools/traffic-signs', name: '交通标志图库', icon: '🚦' },
```

- [ ] **Step 3: 在学习页加跳转链接**

在 `frontend/src/views/tools/DrivingLicenseStudy.vue` 的概览页学习进度卡片中，在「开始学习/继续学习」按钮下方新增：

```html
        <button
          class="btn btn-secondary"
          style="margin-top:12px;width:100%"
          @click="router.push('/tools/traffic-signs')"
        >
          查看全部标志图库
        </button>
```

- [ ] **Step 4: 可选：在首页添加卡片**

在 `frontend/src/views/Home.vue` 的 `tools` 数组末尾添加：

```javascript
  { path: '/tools/driving-license-study', name: '科目一学习', icon: '📚', desc: '系统学习 C1/C2 科目一理论知识', category: '驾考' },
  { path: '/tools/driving-license-quiz', name: '驾考刷题', icon: '🚗', desc: '科目一顺序/随机/模拟考试练习', category: '驾考' },
  { path: '/tools/traffic-signs', name: '交通标志图库', icon: '🚦', desc: '分类浏览交通标志与说明', category: '驾考' },
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/router/index.js frontend/src/components/Sidebar.vue frontend/src/views/tools/DrivingLicenseStudy.vue frontend/src/views/Home.vue
git commit -m "feat(gallery): 注册交通标志图库路由与入口"
```

---

## Task 4: 实现图库页面

**Files:**
- Create: `frontend/src/views/tools/TrafficSignGallery.vue`

- [ ] **Step 1: 创建页面组件**

```vue
<script setup>
import { ref, computed, onMounted } from 'vue'

const signs = ref([])
const loading = ref(true)
const error = ref('')
const search = ref('')
const activeCategory = ref('全部')
const selectedSign = ref(null)

const categories = computed(() => {
  const set = new Set(signs.value.map(s => s.category).filter(Boolean))
  return ['全部', 'GB 5768 图集', '警告', '禁令', '指示', '指路', '标线', '其他'].filter(
    c => c === '全部' || set.has(c)
  )
})

const filteredSigns = computed(() => {
  let list = signs.value
  if (activeCategory.value !== '全部') {
    list = list.filter(s => s.category === activeCategory.value)
  }
  const kw = search.value.trim().toLowerCase()
  if (kw) {
    list = list.filter(s => s.title.toLowerCase().includes(kw))
  }
  return list
})

async function loadData() {
  try {
    const res = await fetch('/data/traffic-signs.json')
    if (!res.ok) throw new Error('加载失败')
    const data = await res.json()
    signs.value = data.signs || []
  } catch (e) {
    error.value = e.message || '数据加载出错'
  } finally {
    loading.value = false
  }
}

function openDetail(sign) {
  selectedSign.value = sign
}

function closeDetail() {
  selectedSign.value = null
}

onMounted(loadData)
</script>

<template>
  <div class="tool-page traffic-sign-gallery">
    <h1>🚦 交通标志图库</h1>

    <div class="card controls" style="padding:16px;margin-bottom:16px">
      <input
        v-model="search"
        class="search-input"
        placeholder="搜索标志名称，如：注意行人"
      >
      <div class="category-tabs">
        <button
          v-for="cat in categories"
          :key="cat"
          class="tab-btn"
          :class="{ active: activeCategory === cat }"
          @click="activeCategory = cat"
        >
          {{ cat }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="card" style="text-align:center;padding:40px">
      正在加载图库...
    </div>
    <div v-else-if="error" class="card error-msg" style="padding:20px">
      {{ error }}
      <button class="btn btn-sm" style="margin-top:12px" @click="loadData">重试</button>
    </div>
    <div v-else-if="filteredSigns.length === 0" class="card" style="text-align:center;padding:40px">
      没有找到匹配的标志
    </div>
    <div v-else class="sign-grid">
      <div
        v-for="sign in filteredSigns"
        :key="sign.id"
        class="card sign-card"
        @click="openDetail(sign)"
      >
        <div class="sign-image-wrap">
          <img
            :src="sign.image"
            :alt="sign.title"
            loading="lazy"
            @error="$event.target.style.display = 'none'"
          >
        </div>
        <div class="sign-title">{{ sign.title }}</div>
        <span class="sign-category">{{ sign.category }}</span>
      </div>
    </div>

    <div v-if="selectedSign" class="modal-overlay" @click.self="closeDetail">
      <div class="modal-card card">
        <button class="modal-close" @click="closeDetail">✕</button>
        <h2>{{ selectedSign.title }}</h2>
        <div class="modal-image">
          <img :src="selectedSign.image" :alt="selectedSign.title" @error="$event.target.style.display = 'none'">
        </div>
        <p class="modal-desc">{{ selectedSign.description || '暂无说明' }}</p>
        <span class="sign-category">{{ selectedSign.category }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.traffic-sign-gallery {
  max-width: 1200px;
}
.controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.search-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
}
.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tab-btn {
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}
.tab-btn:hover, .tab-btn.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}
.sign-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}
.sign-card {
  padding: 12px;
  cursor: pointer;
  transition: transform 0.2s, border-color 0.2s;
  text-align: center;
}
.sign-card:hover {
  transform: translateY(-2px);
  border-color: var(--accent);
}
.sign-image-wrap {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  background: var(--bg-tertiary);
  border-radius: var(--radius);
  overflow: hidden;
}
.sign-image-wrap img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.sign-title {
  font-size: 14px;
  color: var(--text-primary);
  margin-bottom: 6px;
  line-height: 1.4;
}
.sign-category {
  font-size: 11px;
  color: var(--accent);
  background: var(--bg-tertiary);
  padding: 2px 8px;
  border-radius: 12px;
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}
.modal-card {
  position: relative;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
  text-align: center;
}
.modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--text-secondary);
}
.modal-image {
  margin: 16px 0;
}
.modal-image img {
  max-width: 100%;
  max-height: 50vh;
  border-radius: var(--radius);
  border: 1px solid var(--border);
}
.modal-desc {
  font-size: 15px;
  line-height: 1.7;
  color: var(--text-primary);
  margin-bottom: 12px;
}

@media (max-width: 600px) {
  .sign-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 10px;
  }
  .sign-image-wrap {
    height: 90px;
  }
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/views/tools/TrafficSignGallery.vue
git commit -m "feat(gallery): 实现交通标志图库页面"
```

---

## Task 5: 验证页面

**Files:**
- Test: `frontend` dev server

- [ ] **Step 1: 启动开发服务器**

```bash
cd /Users/box/new/Mac/web-Project/frontend
npm run dev
```

- [ ] **Step 2: 检查 URL 与功能**

Open `http://localhost:5174/tools/traffic-signs` and verify:

- 页面标题显示「交通标志图库」。
- 分类标签可点击切换，筛选后网格正确更新。
- 搜索框输入「行人」只显示相关标志。
- 点击卡片弹出详情，显示大图和说明。
- 侧边栏「交通标志图库」入口可点击进入。
- 学习页「查看全部标志图库」按钮可跳转。

- [ ] **Step 3: 检查响应式**

缩小浏览器窗口，确认网格自动适配移动端。

- [ ] **Step 4: Commit final or report**

If all checks pass, no additional commit is needed beyond prior tasks. Report success.

---

## Self-Review

1. **Spec coverage:**
   - 深圳交警爬取与本地保存 → Task 1
   - PDF 渲染与本地保存 → Task 2
   - 独立页面与入口 → Task 3
   - 分类/搜索/详情 → Task 4
   - 现有学习页不变 → 明确排除在改动范围外
2. **Placeholder scan:** 无 TBD/TODO，所有代码片段完整。
3. **Type consistency:** JSON schema 与 Vue 模板字段一致（`sign.id`, `sign.title`, `sign.category`, `sign.image`, `sign.description`）。

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-18-traffic-sign-gallery.md`.

Because you said "直接一口气全部写完即可", I will use **Inline Execution** via `superpowers:executing-plans` to implement all tasks in this session.

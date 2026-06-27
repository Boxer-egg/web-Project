# SVG 编辑器 / Cron 表达式 / CSS 压缩 工具设计文档

**日期**：2026-06-27  
**范围**：在线工具箱新增 3 款纯前端工具  
**目标**：延续现有 47 个工具"简单直接、命令行可调用"的风格，补齐需求文档中标记为远期/后续的功能。

---

## 1. 总体设计原则

- **纯前端优先**：核心逻辑在浏览器本地运行，服务端 API 仅做无状态转发/封装。
- **命令行可调用**：每个工具都通过 `AiHelpPanel` 暴露 URL 参数，支持 `curl` / `wget` 调用。
- **复用现有模式**：UI 复用 `useTool` 组合式、工具页布局、操作按钮组；服务端复用 `functions/_shared/handler.js`。
- **YAGNI**：只实现最小可用功能集，不引入重型依赖。

---

## 2. SVG 编辑器（`/tools/svg-editor`）

### 2.1 功能范围

A+B 模式：**代码编辑为主，基础图形快速插入**。

- 左侧 `textarea` 编辑 SVG 源码，右侧实时渲染预览。
- 工具栏提供基础图形按钮：矩形 `<rect>`、圆 `<circle>`、直线 `<line>`、文本 `<text>`、路径 `<path>`（简化模板）。
- 点击按钮时，在光标位置插入对应模板代码；若无焦点，则追加到末尾。
- 支持操作：
  - **格式化**：pretty-print SVG（缩进 2 空格）。
  - **压缩**：删除注释、多余空白、换行。
  - **下载**：将当前 SVG 保存为 `.svg` 文件。
  - **清空 / 加载示例**。
- 语法错误时，预览区显示错误提示，不崩溃。
- 可选属性速览：在代码区选中某个元素标签时，下方小面板显示该元素的 `id`、`x`、`y`、`width`、`height`、`fill`、`stroke` 等属性（只读）。

### 2.2 路由与 API

- **页面路由**：`/tools/svg-editor`
- **服务端路由**：`/api/svg-editor`（独立文件 `frontend/functions/api/svg-editor.js`）

### 2.3 AI 调用参数

| 参数 | 类型 | 必需 | 说明 |
|---|---|---|---|
| `svg` | string | 是 | SVG 源码 |
| `action` | string | 否 | `preview`（默认）、`format`、`minify` |
| `auto` | string | 否 | 填 `1` 时页面自动执行 |

### 2.4 返回示例

```json
{
  "ok": true,
  "action": "format",
  "svg": "<svg>...</svg>",
  "result": "<svg>\n  <rect.../>\n</svg>"
}
```

### 2.5 UI 结构

```
┌─────────────────────────────────────────────────┐
│ 🎨 SVG 编辑器                        [AI 调用]  │
├──────────────────┬──────────────────────────────┤
│ [rect][circle]   │  预览区                        │
│ [line][text]     │  (v-html svg)                  │
│                  │                              │
│ 代码编辑区       │                              │
│ (textarea)       │                              │
│                  │                              │
│ 属性速览面板     │                              │
├──────────────────┴──────────────────────────────┤
│ 格式化 | 压缩 | 下载 | 清空 | 加载示例            │
└─────────────────────────────────────────────────┘
```

### 2.6 依赖

- 格式化：手写递归遍历 DOM（`DOMParser` + `XMLSerializer`），不引入新依赖。
- 压缩：正则删除注释和多余空白。

---

## 3. Cron 表达式工具（`/tools/cron`）

### 3.1 功能范围

**解析 + 生成 + 验证 + 方言切换**。

- **解析模式**（默认）：
  - 输入 Cron 表达式，输出人类可读描述。
  - 输出最近 5 次执行时间（基于当前时间）。
  - 支持方言切换：`unix`（5 字段）、`quartz`（6 字段，含秒）、`spring`（带别名如 `@yearly`）。
  - 非法表达式实时标红并给出错误位置。
- **生成模式**：
  - 通过表单选择频率：每 N 秒/分/小时、每天某时、每周某天、每月某日等。
  - 实时生成对应 Cron 表达式。
  - 支持反向：输入表达式后切换到生成模式，表单应尽可能回显当前设置（可部分不支持）。

### 3.2 路由与 API

- **页面路由**：`/tools/cron`
- **服务端路由**：复用 `/api/tool`，`tool=cron`

### 3.3 AI 调用参数

| 参数 | 类型 | 必需 | 说明 |
|---|---|---|---|
| `mode` | string | 否 | `parse`（默认）或 `generate` |
| `expr` | string | parse 时必需 | Cron 表达式 |
| `dialect` | string | 否 | `unix` / `quartz` / `spring`，默认 `unix` |
| `freq` | string | generate 时必需 | `second`、`minute`、`hour`、`day`、`week`、`month` |
| `interval` | number | generate 时可选 | 间隔值，默认 1 |
| `at` | string | generate 时可选 | 具体时间点，如 `08:30` |
| `auto` | string | 否 | 填 `1` 时页面自动执行 |

### 3.4 返回示例

```json
// parse
{
  "ok": true,
  "tool": "cron",
  "mode": "parse",
  "description": "每天上午 8 点 30 分",
  "next": ["2026-06-28 08:30:00", "2026-06-29 08:30:00", "..."]
}

// generate
{
  "ok": true,
  "tool": "cron",
  "mode": "generate",
  "expr": "0 30 8 * * ?",
  "description": "每天上午 8 点 30 分"
}
```

### 3.5 UI 结构

```
┌──────────────────────────────────────────────┐
│ ⏰ Cron 表达式解析                   [AI 调用]│
├──────────────────────────────────────────────┤
│ [解析模式] [生成模式]                        │
│                                              │
│ 解析模式：                                   │
│ 表达式：[________________] dialect [unix ▼] │
│ 描述：每天上午 8 点 30 分                    │
│ 最近执行：                                   │
│   2026-06-28 08:30:00                        │
│   2026-06-29 08:30:00                        │
│   ...                                        │
│                                              │
│ 生成模式：                                   │
│ 频率 [每天 ▼] 间隔 [1] 时间 [08:30]          │
│ 生成结果：0 30 8 * * ?                       │
├──────────────────────────────────────────────┤
│ 清空 | 加载示例                               │
└──────────────────────────────────────────────┘
```

### 3.6 依赖

- 解析：手写解析器，支持 5/6 字段和 Spring 别名。
- 下次执行时间：基于当前时间迭代计算，不引入 `cron-parser` 等外部库（YAGNI）。

---

## 4. CSS 压缩工具（`/tools/css-minifier`）

### 4.1 功能范围

**安全基础压缩 + 可选智能优化项**。

- 输入 CSS，输出压缩后的 CSS。
- 默认始终执行的安全压缩：
  - 删除注释 `/* ... */`
  - 删除多余空白、换行、制表符
  - 删除规则末尾多余的分号
  - 保留 `@media`、`@keyframes` 等结构的语义
- 可选优化项（通过复选框控制，默认不勾选）：
  - [ ] `minify_color`：简化颜色值（`#ffffff` → `#fff`，`rgb(255,255,255)` → `#fff` 可选）
  - [ ] `minify_zero`：简化零值单位（`0px` → `0`）
  - [ ] `merge_duplicates`：合并同一个选择器下的重复声明（取后者）
  - [ ] `remove_empty`：移除空规则
  - [ ] `remove_quotes`：删除 `url("...")` 和属性选择器中不必要的引号

### 4.2 路由与 API

- **页面路由**：`/tools/css-minifier`
- **服务端路由**：复用 `/api/tool`，`tool=css_minifier`

### 4.3 AI 调用参数

| 参数 | 类型 | 必需 | 说明 |
|---|---|---|---|
| `css` | string | 是 | 原始 CSS |
| `minify_color` | bool-ish | 否 | 简化颜色 |
| `minify_zero` | bool-ish | 否 | 简化零值 |
| `merge_duplicates` | bool-ish | 否 | 合并重复声明 |
| `remove_empty` | bool-ish | 否 | 移除空规则 |
| `remove_quotes` | bool-ish | 否 | 删除不必要引号 |
| `auto` | string | 否 | 填 `1` 时页面自动执行 |

### 4.4 返回示例

```json
{
  "ok": true,
  "tool": "css_minifier",
  "originalLength": 1024,
  "minifiedLength": 612,
  "savedPercent": "40.2%",
  "output": "body{margin:0;color:#333}"
}
```

### 4.5 UI 结构

```
┌──────────────────────────────────────────────┐
│ 🗜️ CSS 压缩                          [AI 调用]│
├──────────────────┬───────────────────────────┤
│ 输入 CSS         │  输出 CSS                  │
│ (textarea)       │  (textarea readonly)       │
│                  │  原始：1024B → 612B (-40%) │
├──────────────────┴───────────────────────────┤
│ 选项：                                        │
│ [ ] 简化颜色  [ ] 简化零值  [ ] 合并重复声明  │
│ [ ] 移除空规则  [ ] 删除不必要引号            │
├──────────────────────────────────────────────┤
│ 压缩 | 清空 | 加载示例 | 复制结果             │
└──────────────────────────────────────────────┘
```

### 4.6 依赖

- 手写基于正则 + 简单状态机的 CSS 压缩器，不引入 `clean-css` 等外部库，保持纯前端轻量。

---

## 5. 通用实现约定

### 5.1 页面组件

- 统一使用 `tool-page` 容器。
- 顶部 `tool-header` 放标题 + `AiHelpPanel`。
- 输入/输出区域使用 `tool-section` + `tool-panel` 双栏布局（SVG 编辑器可扩展为三栏或上下分栏）。
- 操作按钮使用 `tool-actions` 容器。

### 5.2 状态持久化

- 使用 `useStorage` 保存用户输入和选项状态。
- SVG 编辑器保存 `svg-editor-input`。
- Cron 工具保存 `cron-input`、`cron-mode`、`cron-dialect`。
- CSS 压缩保存 `css-minifier-input` 和各选项开关。

### 5.3 URL 参数自动执行

- 每个工具都支持 URL 参数触发自动执行（`auto=1`），便于命令行调用和 AI 自动化。
- 通过 `useTool` 的 `paramMapping` 或手动在 `onMounted` 中读取 `getUrlParams` 实现。

### 5.4 错误处理

- 输入不合法时，输出区显示友好错误信息，不抛未处理异常。
- API 返回 `{ ok: false, error: "..." }` 结构。

---

## 6. 测试要求

- **单元测试**：在 `frontend/src/logic/` 或新建目录中为三个工具的核心函数编写测试。
  - SVG：`formatSvg`、`minifySvg`、模板插入。
  - Cron：`parseCron`、`generateCron`、`getNextExecutions`、方言切换。
  - CSS：`minifyCss` 及各可选优化项。
- **E2E 测试**：在已有 E2E 脚本中为三个新工具添加断言，验证页面渲染和 AI 调用示例可用。
- **API 测试**：使用 `curl` 验证三个 API 端点返回正确。

---

## 7. 文件清单

| 文件路径 | 说明 |
|---|---|
| `frontend/src/views/tools/SvgEditor.vue` | SVG 编辑器页面 |
| `frontend/src/views/tools/CronTool.vue` | Cron 表达式工具页面 |
| `frontend/src/views/tools/CssMinifier.vue` | CSS 压缩工具页面 |
| `frontend/src/logic/svg.js` | SVG 格式化/压缩/模板逻辑 |
| `frontend/src/logic/cron.js` | Cron 解析/生成/验证逻辑 |
| `frontend/src/logic/cssMinifier.js` | CSS 压缩逻辑 |
| `frontend/functions/api/svg-editor.js` | SVG 编辑器独立 API |
| `frontend/functions/api/tool.js` | 新增 `cron`、`css_minifier` handler |
| `frontend/src/router/index.js` | 新增三条路由 |
| `docs/superpowers/specs/2026-06-27-svg-cron-css-tools-design.md` | 本文档 |

---

## 8. 回滚计划

- 新工具为纯增量功能，不影响现有 47 个工具。
- 回滚时删除上述新增文件并移除路由即可恢复。
- 建议在独立分支开发，合并前跑通 E2E 测试。

---

## 9. 结论

本设计在保持项目现有风格的前提下，实现 SVG 编辑器、Cron 表达式解析和 CSS 压缩三款工具。三个工具均支持命令行调用，UI 复用现有组件，核心逻辑纯前端实现，服务端仅做无状态封装。

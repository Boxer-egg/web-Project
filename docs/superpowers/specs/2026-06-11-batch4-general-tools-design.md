# 第四批工具设计：通用/生活效率工具（6个）

## 背景

当前网站已有 20 个面向开发者的纯前端在线工具。为了扩大受众面、覆盖更多搜索关键词，本批次增加 6 个非开发者通用工具，面向学生、办公人群、健康关注者和中文用户。

## 设计原则

- **纯前端**：所有计算在浏览器本地完成，无需后端
- **AI 友好模式**：每个工具支持通过 URL 参数触发自动执行
- **遵循现有模式**：Vue 3 SFC + useStorage + getUrlParams + AiHelpPanel
- **YAGNI**：不做过度设计，只做当前明确需要的功能

---

## 工具规格

### 1. 字数统计 (WordCounter)

**功能：** 统计文本的中文字数、英文单词数、总字符数（含/不含空格）、段落数、行数、阅读时间估算。

**输入：** 多行文本输入框

**输出：** 统计结果卡片列表展示

**URL 参数：**
- `text` - 要统计的文本
- `auto=1` - 自动执行

**实现要点：**
- 中文字符匹配 `/[一-龥]/g`
- 英文单词匹配 `/\b\w+\b/g`
- 阅读时间按中文 300 字/分钟、英文 200 词/分钟估算

---

### 2. 单位换算 (UnitConverter)

**功能：** 长度、重量、面积、体积、温度、数据存储等单位互转。

**输入：** 数值输入框 + 源单位选择 + 目标单位选择

**输出：** 换算结果，同时展示常用单位的全部换算表

**URL 参数：**
- `value` - 数值
- `from` - 源单位
- `to` - 目标单位
- `category` - 类别（length/weight/area/volume/temperature/data）
- `auto=1` - 自动执行

**实现要点：**
- 温度单独处理（非线性）
- 其他类别使用基准单位乘法换算
- 展示该类别下所有单位的换算表

---

### 3. BMI 计算器 (BmiCalculator)

**功能：** 输入身高（cm）和体重（kg），计算 BMI 指数并给出中国标准体重状态分类。

**输入：** 身高输入框（cm）、体重输入框（kg）

**输出：** BMI 数值 + 分类（偏瘦/正常/偏胖/肥胖/重度肥胖）+ 健康建议 + 理想体重范围

**URL 参数：**
- `height` - 身高（cm）
- `weight` - 体重（kg）
- `auto=1` - 自动执行

**实现要点：**
- 公式：BMI = 体重(kg) / (身高(m))^2
- 中国成人标准：偏瘦<18.5、正常18.5-23.9、偏胖24-27.9、肥胖28-31.9、重度肥胖>=32
- 理想体重范围基于正常 BMI 反推

---

### 4. 简繁体转换 (ChineseConverter)

**功能：** 简体中文和繁体中文互转。

**输入：** 多行文本输入框

**输出：** 转换后的文本

**URL 参数：**
- `text` - 要转换的文本
- `direction` - 方向（s2t=简体转繁体，t2s=繁体转简体）
- `auto=1` - 自动执行

**实现要点：**
- 使用开源简体/繁体映射表（约 3000+ 常用汉字）
- 存储为纯 JS 对象，避免引入重型库
- 支持一键复制结果

---

### 5. 日期计算器 (DateCalculator)

**功能：** 计算两个日期之间的间隔天数；计算某日期加减 N 天后的结果。

**输入：** 两个日期选择器（模式1）或 一个日期选择器 + 天数输入（模式2）

**输出：** 间隔天数 / 目标日期，同时展示工作日天数（周一至周五）

**URL 参数：**
- `mode` - 模式（diff 或 add）
- `date1` / `date2` - 日期（YYYY-MM-DD）
- `days` - 天数（模式2用）
- `auto=1` - 自动执行

**实现要点：**
- 使用原生 Date 对象计算
- 工作日计算需排除周末
- 展示结果的同时展示"距今"或"还有多久"的相对时间

---

### 6. 番茄钟 (Pomodoro)

**功能：** 25 分钟专注 + 5 分钟休息的循环计时器，带进度环和提示音。

**输入：** 专注时长设置、休息时长设置、循环次数设置

**输出：** 圆形进度倒计时、当前状态（专注/休息）、已完成番茄数

**URL 参数：**
- `focus` - 专注时长（分钟，默认25）
- `break` - 休息时长（分钟，默认5）
- `auto=1` - 自动开始

**实现要点：**
- 使用 SVG 圆形进度条
- 使用 Web Audio API 播放提示音（无需外部资源）
- 页面不可见时使用 Page Visibility API 保持计时
- 支持暂停/继续/重置

---

## 路由配置

| 路径 | 组件 | 标题 |
|------|------|------|
| /tools/word-counter | WordCounter.vue | 字数统计 |
| /tools/unit-converter | UnitConverter.vue | 单位换算 |
| /tools/bmi | BmiCalculator.vue | BMI 计算器 |
| /tools/chinese-converter | ChineseConverter.vue | 简繁体转换 |
| /tools/date-calculator | DateCalculator.vue | 日期计算 |
| /tools/pomodoro | Pomodoro.vue | 番茄钟 |

## 文件变更清单

1. `frontend/src/views/tools/WordCounter.vue` - 新建
2. `frontend/src/views/tools/UnitConverter.vue` - 新建
3. `frontend/src/views/tools/BmiCalculator.vue` - 新建
4. `frontend/src/views/tools/ChineseConverter.vue` - 新建
5. `frontend/src/views/tools/DateCalculator.vue` - 新建
6. `frontend/src/views/tools/Pomodoro.vue` - 新建
7. `frontend/src/router/index.js` - 添加6条路由
8. `frontend/src/components/Sidebar.vue` - 添加6个导航项
9. `frontend/src/views/Home.vue` - 添加6个工具卡片
10. `frontend/public/sitemap.xml` - 添加6个URL

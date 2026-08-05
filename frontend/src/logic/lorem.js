/**
 * Lorem Ipsum generation logic.
 */

const WORDS = ["lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore", "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud", "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo", "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate", "velit", "esse", "cillum", "eu", "fugiat", "nulla", "pariatur", "excepteur", "sint", "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id", "est", "laborum", "natus", "error", "sit", "voluptatem", "accusantium", "doloremque", "laudantium", "totam", "rem", "aperiam", "eaque", "ipsa", "quae", "ab", "illo", "inventore", "veritatis", "et", "quasi", "architecto", "beatae", "vitae", "dicta", "sunt", "explicabo", "nemo", "enim", "ipsam", "voluptatem", "quia", "voluptas", "aspernatur", "aut", "odit", "aut", "fugit"]

const CN_WORDS = ["我们", "需要", "为了", "能够", "应该", "可能", "必须", "这个", "那个", "什么", "如何", "为什么", "是否", "可以", "已经", "正在", "将要", "这些", "那些", "一个", "因为", "所以", "但是", "如果", "虽然", "而且", "于是", "然而", "最终", "首先", "其次", "最后", "同时", "另外", "此外", "然后", "接着", "关于", "对于", "根据", "通过", "使用", "利用", "实现", "完成", "解决", "处理", "提供", "支持", "允许", "确保", "维护", "优化", "提升", "降低", "增加", "减少", "调整", "修改", "更新", "创建", "删除", "保存", "加载", "运行", "测试", "验证", "确认", "检查", "分析", "计算", "设计", "开发", "测试", "部署", "发布", "维护", "文档", "代码", "数据", "用户", "系统", "功能", "模块", "接口", "组件", "页面", "信息", "内容", "方法", "方案", "目标", "需求", "问题", "结果", "过程", "阶段", "步骤", "方案", "产品", "服务", "团队", "项目", "管理", "计划", "进度", "质量", "效率", "效果", "性能", "安全", "稳定", "可靠", "简单", "方便", "快速", "灵活", "清晰", "完整", "正确", "重要", "必要", "常见", "具体", "详细", "充分", "合理", "有效", "成功", "顺利", "及时", "定期", "持续", "逐步", "相应", "相关", "相互", "实际", "真实", "正常", "普通", "特别", "非常", "十分", "相当", "比较", "稍微", "几乎", "似乎", "总是", "经常", "偶尔", "从未", "再次", "已经", "还在", "继续", "坚持", "努力", "认真", "仔细", "详细", "全面", "深入", "广泛", "大量", "许多", "少量", "个别", "整体", "部分", "全部", "每次", "每天", "每周", "每月", "每年", "如今", "当前", "目前", "现在", "将来", "未来", "过去", "以前", "昨天", "今天", "明天", "上午", "下午", "晚上", "白天", "夜晚", "春天", "夏天", "秋天", "冬天", "数字", "文字", "图片", "视频", "音频", "动画", "图表", "表格", "列表", "文件", "目录", "路径", "地址", "链接", "端口", "网络", "连接", "请求", "响应", "状态", "错误", "成功", "失败", "警告", "提示", "通知", "消息", "内容", "标题", "正文", "摘要", "简介", "前言", "结论", "建议", "意见", "反馈", "评价", "评分", "排行", "趋势", "数据", "指标", "标准", "规范", "规则", "原则", "制度", "流程", "方法", "技巧", "经验", "教训", "案例", "示例", "模板", "格式", "结构", "内容", "层次", "顺序", "逻辑", "思路", "想法", "观点", "立场", "角度", "方面", "层面", "维度", "范围", "程度", "力度", "速度", "频率", "比例", "数量", "质量", "价值", "意义", "作用", "影响", "效果", "结果", "原因", "理由", "依据", "根据", "前提", "条件", "基础", "核心", "关键", "重点", "难点", "弱点", "优势", "劣势", "特点", "特征", "特性", "性质", "本质", "实质", "内容"]

const CN_PARAGRAPH_STARTERS = ["在当今社会", "随着科技的发展", "在日常生活中", "从某种角度来看", "在实践过程中", "值得注意的是", "换句话说", "总而言之", "在此基础上", "与此同时"]

/**
 * Generate Lorem Ipsum placeholder text.
 * @param {number} paragraphs Number of paragraphs (1~50).
 * @param {number} sentencesPerParagraph Sentences per paragraph (1~20).
 * @param {object} options { lang: 'latin'|'chinese', format: 'text'|'html'|'single', standardStart: boolean }
 * @returns {string} Generated placeholder text.
 */
export function generate(paragraphs = 5, sentencesPerParagraph = 3, options = {}) {
  const lang = options.lang || 'latin'
  const format = options.format || 'text'
  const standardStart = lang === 'latin' && !!options.standardStart

  const maxP = Math.min(Math.max(paragraphs, 1), 50)
  const maxS = Math.min(Math.max(sentencesPerParagraph, 1), 20)

  let result = []
  for (let p = 0; p < maxP; p++) {
    let paragraph = []
    for (let s = 0; s < maxS; s++) {
      if (standardStart && p === 0 && s === 0) {
        paragraph.push('Lorem ipsum dolor sit amet, consectetur adipiscing elit.')
        continue
      }
      paragraph.push(lang === 'chinese' ? makeCnSentence() : makeSentence())
    }
    result.push(paragraph.join(' '))
  }

  if (format === 'html') {
    return result.map(p => `<p>${p}</p>`).join('\n')
  }
  if (format === 'single') {
    return result.join(' ')
  }
  return result.join('\n\n')
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function makeSentence() {
  const len = Math.floor(Math.random() * 6) + 6
  const words = []
  for (let w = 0; w < len; w++) {
    words.push(pick(WORDS))
  }
  const sentence = words.join(' ')
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.'
}

function makeCnSentence() {
  // Short sentences are dominant, occasionally a longer one
  const len = Math.random() < 0.6 ? 2 + Math.floor(Math.random() * 6) : 8 + Math.floor(Math.random() * 10)
  const words = []
  for (let w = 0; w < len; w++) {
    words.push(pick(CN_WORDS))
  }
  const sentence = words.join('')
  return (Math.random() < 0.3 ? pick(CN_PARAGRAPH_STARTERS) : '') + sentence + '。'
}

/** Count paragraphs, sentences and characters in generated output. */
export function stats(text) {
  const paragraphs = text.trim() ? text.trim().split(/\n+/).filter(Boolean).length : 0
  const sentences = (text.match(/[。.!?]/g) || []).length
  const chars = text.replace(/\s/g, '').length
  return { paragraphs, sentences, chars }
}

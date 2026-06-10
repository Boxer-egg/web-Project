<script setup>
import { ref, onMounted } from 'vue'
import { useStorage } from '@vueuse/core'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const paragraphs = useStorage('lorem-paragraphs', 3)
const sentences = useStorage('lorem-sentences', 5)
const format = useStorage('lorem-format', 'text')
const language = useStorage('lorem-lang', 'latin')
const output = ref('')

const latinWords = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'ut', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate', 'velit',
  'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat',
  'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt',
  'mollit', 'anim', 'id', 'est', 'laborum'
]

const chineseWords = [
  '的', '一', '是', '在', '不', '了', '有', '和', '人', '这', '中', '大', '为',
  '上', '个', '国', '我', '以', '要', '他', '时', '来', '用', '们', '生', '到',
  '作', '地', '于', '出', '就', '分', '对', '成', '会', '可', '主', '发', '年',
  '动', '同', '工', '也', '能', '下', '过', '子', '说', '产', '种', '面', '而',
  '方', '后', '多', '定', '行', '学', '法', '所', '民', '得', '经', '十', '三',
  '之', '进', '着', '等', '部', '度', '家', '电', '力', '里', '如', '水', '化',
  '高', '自', '二', '理', '起', '小', '物', '现', '实', '加', '量', '都', '两',
  '体', '制', '机', '当', '使', '点', '从', '业', '本', '去', '把', '性', '好',
  '应', '开', '它', '合', '还', '因', '由', '其', '些', '然', '前', '外', '天',
  '政', '四', '日', '那', '社', '义', '事', '平', '形', '相', '全', '表', '间',
  '样', '与', '关', '各', '重', '新', '线', '内', '数', '正', '心', '反', '你',
  '明', '看', '原', '又', '么', '利', '比', '或', '但', '质', '气', '第', '向',
  '道', '命', '此', '变', '条', '只', '没', '结', '解', '问', '意', '建', '月',
  '公', '无', '系', '军', '很', '情', '最', '者', '现', '代', '做', '样', '文'
]

function getUrlParams() {
  const hash = window.location.hash
  const query = hash.split('?')[1] || ''
  return new URLSearchParams(query)
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateLatinSentence() {
  const len = randomInt(5, 15)
  const words = []
  for (let i = 0; i < len; i++) {
    words.push(latinWords[randomInt(0, latinWords.length - 1)])
  }
  return words.join(' ') + '.'
}

function generateChineseSentence() {
  const len = randomInt(8, 20)
  const words = []
  for (let i = 0; i < len; i++) {
    words.push(chineseWords[randomInt(0, chineseWords.length - 1)])
  }
  return words.join('') + '。'
}

function generate() {
  const paras = []
  const paraCount = Math.max(1, Math.min(50, paragraphs.value))
  const sentCount = Math.max(1, Math.min(20, sentences.value))

  for (let p = 0; p < paraCount; p++) {
    const sents = []
    for (let s = 0; s < sentCount; s++) {
      if (language.value === 'latin') {
        sents.push(generateLatinSentence())
      } else {
        sents.push(generateChineseSentence())
      }
    }
    paras.push(sents.join(language.value === 'latin' ? ' ' : ''))
  }

  if (format.value === 'html') {
    output.value = paras.map(p => `<p>${p}</p>`).join('\n')
  } else if (format.value === 'oneline') {
    output.value = paras.join(language.value === 'latin' ? ' ' : '')
  } else {
    output.value = paras.join('\n\n')
  }
}

async function copy() {
  try { await navigator.clipboard.writeText(output.value) } catch {}
}

function exportTxt() {
  if (!output.value) return
  const blob = new Blob([output.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'lorem-ipsum.txt'
  a.click()
  URL.revokeObjectURL(url)
}

function clearAll() {
  output.value = ''
}

onMounted(() => {
  const params = getUrlParams()
  if (params.get('auto') === '1') {
    if (params.get('paragraphs')) paragraphs.value = parseInt(params.get('paragraphs'))
    if (params.get('sentences')) sentences.value = parseInt(params.get('sentences'))
    if (params.get('format')) format.value = params.get('format')
    if (params.get('lang')) language.value = params.get('lang')
    generate()
  } else if (!output.value) {
    generate()
  }
})
</script>

<template>
  <div class="tool-page">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h1>📝 Lorem Ipsum 生成器</h1>
      <AiHelpPanel
        title="Lorem Ipsum 生成器"
        desc="生成用于占位和排版测试的假文，支持拉丁语和中文"
        :params="[
          { name: 'paragraphs', desc: '段落数 (1-50)', required: false, example: '3' },
          { name: 'sentences', desc: '每段句数 (1-20)', required: false, example: '5' },
          { name: 'format', desc: '格式：text/html/oneline', required: false, example: 'text' },
          { name: 'lang', desc: '语言：latin/chinese', required: false, example: 'latin' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>
    <div class="tool-section">
      <div class="tool-panel card">
        <h3>配置</h3>
        <div style="margin-bottom:12px">
          <label style="font-size:13px;color:var(--text-secondary)">段落: {{ paragraphs }}</label>
          <input type="range" v-model.number="paragraphs" min="1" max="50" style="width:100%">
        </div>
        <div style="margin-bottom:12px">
          <label style="font-size:13px;color:var(--text-secondary)">每段句数: {{ sentences }}</label>
          <input type="range" v-model.number="sentences" min="1" max="20" style="width:100%">
        </div>
        <div style="margin-bottom:12px">
          <label style="font-size:13px;color:var(--text-secondary);display:block;margin-bottom:4px">格式</label>
          <div style="display:flex;gap:6px">
            <button class="btn btn-sm" :class="{ 'btn-secondary': format !== 'text' }" @click="format='text'">纯文本</button>
            <button class="btn btn-sm" :class="{ 'btn-secondary': format !== 'html' }" @click="format='html'">HTML</button>
            <button class="btn btn-sm" :class="{ 'btn-secondary': format !== 'oneline' }" @click="format='oneline'">单行</button>
          </div>
        </div>
        <div style="margin-bottom:12px">
          <label style="font-size:13px;color:var(--text-secondary);display:block;margin-bottom:4px">语言</label>
          <div style="display:flex;gap:6px">
            <button class="btn btn-sm" :class="{ 'btn-secondary': language !== 'latin' }" @click="language='latin'">拉丁语</button>
            <button class="btn btn-sm" :class="{ 'btn-secondary': language !== 'chinese' }" @click="language='chinese'">中文</button>
          </div>
        </div>
        <div class="tool-actions" style="margin-top:16px">
          <button class="btn" @click="generate">生成</button>
          <button class="btn btn-secondary" @click="clearAll">清空</button>
        </div>
      </div>
      <div class="tool-panel">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3>结果</h3>
          <div style="display:flex;gap:8px">
            <button class="btn btn-sm btn-secondary" @click="copy">复制</button>
            <button class="btn btn-sm btn-secondary" @click="exportTxt">导出 TXT</button>
          </div>
        </div>
        <textarea v-model="output" class="textarea" placeholder="生成的假文..." rows="20" readonly></textarea>
        <div style="margin-top:8px;font-size:12px;color:var(--text-muted)">
          字符: {{ output.length }}
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useStorage } from '@vueuse/core'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

function getUrlParams() {
  return new URLSearchParams(window.location.search)
}

const pattern = useStorage('regex-pattern', '\\d{3}-\\d{4}')
const flags = useStorage('regex-flags', { g: false, i: false, m: false })
const testText = useStorage('regex-text', '联系电话：123-4567，传真：890-1234')
const replaceText = ref('')

const error = ref('')
const matchCount = ref(0)

const regex = computed(() => {
  try {
    const f = Object.entries(flags.value).filter(([, v]) => v).map(([k]) => k).join('')
    return new RegExp(pattern.value, f)
  } catch {
    return null
  }
})

const highlightedText = computed(() => {
  error.value = ''
  if (!regex.value || !testText.value) return testText.value
  try {
    const matches = []
    let m
    const re = new RegExp(regex.value.source, regex.value.flags.includes('g') ? regex.value.flags : regex.value.flags + 'g')
    while ((m = re.exec(testText.value)) !== null) {
      matches.push({ start: m.index, end: m.index + m[0].length, text: m[0], groups: m.slice(1) })
      if (!re.global) break
      if (m[0].length === 0) re.lastIndex++
    }
    matchCount.value = matches.length
    if (!matches.length) return testText.value
    let result = ''
    let last = 0
    matches.forEach((match, i) => {
      result += escapeHtml(testText.value.slice(last, match.start))
      result += `<mark style="background:#fbbf24;color:#000">${escapeHtml(match.text)}</mark>`
      last = match.end
    })
    result += escapeHtml(testText.value.slice(last))
    return result
  } catch (e) {
    error.value = e.message
    return testText.value
  }
})

const groups = computed(() => {
  if (!regex.value || !testText.value || !matchCount.value) return []
  const re = new RegExp(regex.value.source, regex.value.flags.includes('g') ? regex.value.flags : regex.value.flags + 'g')
  const results = []
  let m
  while ((m = re.exec(testText.value)) !== null) {
    results.push(m.slice(1))
    if (!re.global) break
  }
  return results
})

const replacedText = computed(() => {
  if (!regex.value || !testText.value) return ''
  try {
    return testText.value.replace(regex.value, replaceText.value)
  } catch {
    return ''
  }
})

function escapeHtml(t) {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function clearAll() {
  pattern.value = ''
  testText.value = ''
  replaceText.value = ''
  error.value = ''
}

function loadExample() {
  pattern.value = '\\d{3}-\\d{4}'
  flags.value = { g: true, i: false, m: false }
  testText.value = '联系电话：123-4567，传真：890-1234'
}

const presets = [
  { name: '手机号', pattern: '1[3-9]\\d{9}' },
  { name: '邮箱', pattern: '[\\w.-]+@[\\w.-]+\\.\\w+' },
  { name: 'IP 地址', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b' },
  { name: 'URL', pattern: 'https?://[^\\s]+' },
  { name: '身份证号', pattern: '\\d{17}[\\dXx]' },
  { name: '日期', pattern: '\\d{4}-\\d{2}-\\d{2}' },
]

function loadPreset(p) {
  pattern.value = p.pattern
}

onMounted(() => {
  const params = getUrlParams()
  if (params.get('pattern')) {
    pattern.value = params.get('pattern')
    const f = params.get('flags') || ''
    flags.value = { g: f.includes('g'), i: f.includes('i'), m: f.includes('m') }
  }
  if (params.get('text')) testText.value = params.get('text')
})
</script>

<template>
  <div class="tool-page">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h1>🔍 正则表达式测试</h1>
      <AiHelpPanel
        title="正则表达式测试"
        desc="实时正则匹配、替换、分组提取"
        :params="[
          { name: 'pattern', desc: '正则表达式', required: true, example: '\\d{3}-\\d{4}' },
          { name: 'text', desc: '测试文本', required: true, example: '电话：123-4567' },
          { name: 'flags', desc: '标志：g/i/m 组合', required: false, example: 'gi' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;align-items:center">
      <span>正则：</span>
      <input v-model="pattern" class="input" placeholder="输入正则表达式" style="flex:1;min-width:200px">
      <label><input type="checkbox" v-model="flags.g"> g</label>
      <label><input type="checkbox" v-model="flags.i"> i</label>
      <label><input type="checkbox" v-model="flags.m"> m</label>
      <select class="input" style="width:auto" @change="e => loadPreset(presets[e.target.value])">
        <option value="">常用正则</option>
        <option v-for="(p, i) in presets" :key="i" :value="i">{{ p.name }}</option>
      </select>
      <button class="btn btn-secondary btn-sm" @click="clearAll">清空</button>
      <button class="btn btn-secondary btn-sm" @click="loadExample">示例</button>
    </div>

    <div class="tool-section">
      <div class="tool-panel">
        <h3>测试文本</h3>
        <textarea v-model="testText" class="textarea" placeholder="输入测试文本..." rows="10"></textarea>
        <h3 style="margin-top:10px">替换文本</h3>
        <input v-model="replaceText" class="input" placeholder="输入替换内容（可选）">
      </div>
      <div class="tool-panel">
        <h3>匹配结果 <span v-if="matchCount" style="color:var(--success)">({{ matchCount }} 个匹配)</span></h3>
        <div class="textarea" style="min-height:120px;overflow:auto" v-html="highlightedText"></div>
        <h3 v-if="replaceText" style="margin-top:10px">替换结果</h3>
        <textarea v-if="replaceText" v-model="replacedText" class="textarea" rows="6" readonly></textarea>
      </div>
    </div>

    <div v-if="groups.length" class="card" style="margin-top:16px">
      <h3 style="margin-bottom:10px;font-size:14px">捕获组</h3>
      <table style="width:100%;font-size:13px;border-collapse:collapse">
        <tbody>
          <tr v-for="(g, i) in groups" :key="i" style="border-bottom:1px solid var(--border)">
            <td style="padding:6px;color:var(--text-muted);white-space:nowrap">匹配 {{ i + 1 }}</td>
            <td style="padding:6px">{{ g.join(' | ') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="error" class="error-msg">❌ {{ error }}</div>
  </div>
</template>

<style scoped>
.error-msg {
  color: var(--error);
  background: rgba(239, 68, 68, 0.1);
  padding: 10px 16px;
  border-radius: var(--radius);
  margin-top: 10px;
  font-size: 14px;
}
label {
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
}
</style>

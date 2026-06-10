<script setup>
import { ref, onMounted } from 'vue'
import { useStorage } from '@vueuse/core'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const input = useStorage('html-entity-input', '')
const output = ref('')
const mode = useStorage('html-entity-mode', 'encode_named')
const encodeAll = useStorage('html-entity-all', false)
const copyText = ref('复制结果')

const namedEntities = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;',
  '/': '&#x2F;', '`': '&#x60;', '=': '&#x3D;'
}

const reverseEntities = {}
for (const [k, v] of Object.entries(namedEntities)) {
  reverseEntities[v] = k
}

function getUrlParams() {
  const hash = window.location.hash
  const query = hash.split('?')[1] || ''
  return new URLSearchParams(query)
}

function encodeNamed() {
  if (!input.value) return
  let text = input.value
  // 先避免双重编码
  text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  for (const [char, entity] of Object.entries(namedEntities)) {
    text = text.split(char).join(entity)
  }
  output.value = text
}

function encodeNumeric() {
  if (!input.value) return
  let text = input.value
  text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  let result = ''
  for (const char of text) {
    const code = char.charCodeAt(0)
    if (encodeAll.value || code > 127 || namedEntities[char]) {
      result += `&#${code};`
    } else {
      result += char
    }
  }
  output.value = result
}

function encodeHex() {
  if (!input.value) return
  let text = input.value
  text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  let result = ''
  for (const char of text) {
    const code = char.charCodeAt(0)
    if (encodeAll.value || code > 127 || namedEntities[char]) {
      result += `&#x${code.toString(16).toUpperCase()};`
    } else {
      result += char
    }
  }
  output.value = result
}

function decode() {
  if (!input.value) return
  let text = input.value
  // Hex entities
  text = text.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
  // Decimal entities
  text = text.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
  // Named entities
  for (const [entity, char] of Object.entries(reverseEntities)) {
    text = text.split(entity).join(char)
  }
  output.value = text
}

function process() {
  switch (mode.value) {
    case 'encode_named': encodeNamed(); break
    case 'encode_numeric': encodeNumeric(); break
    case 'encode_hex': encodeHex(); break
    case 'decode': decode(); break
  }
}

async function copy() {
  if (!output.value) return
  try {
    await navigator.clipboard.writeText(output.value)
    copyText.value = '已复制'
    setTimeout(() => copyText.value = '复制结果', 2000)
  } catch {
    copyText.value = '复制失败'
  }
}

function clearAll() {
  input.value = ''
  output.value = ''
}

function loadExample() {
  input.value = '<div class="container">Hello "世界" & 你好 \'test\'</div>'
  mode.value = 'encode_named'
  process()
}

const quickRef = [
  { char: '<', named: '&lt;', numeric: '&#60;', hex: '&#x3C;' },
  { char: '>', named: '&gt;', numeric: '&#62;', hex: '&#x3E;' },
  { char: '&', named: '&amp;', numeric: '&#38;', hex: '&#x26;' },
  { char: '"', named: '&quot;', numeric: '&#34;', hex: '&#x22;' },
  { char: "'", named: '&#x27;', numeric: '&#39;', hex: '&#x27;' },
  { char: ' ', named: '&nbsp;', numeric: '&#160;', hex: '&#xA0;' },
]

onMounted(() => {
  const params = getUrlParams()
  if (params.get('text')) {
    input.value = params.get('text')
    if (params.get('action')) mode.value = params.get('action')
    process()
  } else if (!input.value) {
    loadExample()
  }
})
</script>

<template>
  <div class="tool-page">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h1>🔤 HTML 实体编解码</h1>
      <AiHelpPanel
        title="HTML 实体编解码"
        desc="HTML 特殊字符与实体编码互相转换，支持 Named、Numeric、Hex 三种格式"
        :params="[
          { name: 'text', desc: '要处理的文本', required: true, example: '&lt;div&gt;test&lt;/div&gt;' },
          { name: 'action', desc: '操作：encode_named/encode_numeric/encode_hex/decode', required: false, example: 'encode_named' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>
    <div class="tool-actions">
      <button class="btn" :class="{ 'btn-secondary': mode !== 'encode_named' }" @click="mode = 'encode_named'; process()">编码 → Named</button>
      <button class="btn btn-secondary" :class="{ 'btn-secondary': mode !== 'encode_numeric' }" @click="mode = 'encode_numeric'; process()">编码 → Numeric</button>
      <button class="btn btn-secondary" :class="{ 'btn-secondary': mode !== 'encode_hex' }" @click="mode = 'encode_hex'; process()">编码 → Hex</button>
      <button class="btn btn-secondary" :class="{ 'btn-secondary': mode !== 'decode' }" @click="mode = 'decode'; process()">解码</button>
      <label style="display:flex;align-items:center;gap:4px;font-size:13px;color:var(--text-secondary);cursor:pointer">
        <input type="checkbox" v-model="encodeAll" @change="process()"> 编码所有非 ASCII
      </label>
      <button class="btn btn-secondary" @click="clearAll">清空</button>
      <button class="btn btn-secondary" @click="loadExample">示例</button>
    </div>
    <div class="tool-section">
      <div class="tool-panel">
        <h3>输入</h3>
        <textarea v-model="input" class="textarea" placeholder="输入 HTML 或实体编码..." rows="14"></textarea>
      </div>
      <div class="tool-panel">
        <h3>输出</h3>
        <textarea v-model="output" class="textarea" placeholder="处理结果..." rows="14" readonly></textarea>
        <button class="btn btn-sm" @click="copy" style="align-self:flex-start">{{ copyText }}</button>
      </div>
    </div>
    <div class="card" style="margin-top:16px;overflow:auto">
      <h3 style="font-size:14px;margin-bottom:10px">常用实体速查表</h3>
      <table style="width:100%;font-size:13px;border-collapse:collapse;min-width:500px">
        <thead>
          <tr style="border-bottom:1px solid var(--border)">
            <th style="text-align:left;padding:6px">字符</th>
            <th style="text-align:left;padding:6px">Named</th>
            <th style="text-align:left;padding:6px">Numeric</th>
            <th style="text-align:left;padding:6px">Hex</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in quickRef" :key="row.char" style="border-bottom:1px solid var(--border)">
            <td style="padding:6px;font-family:monospace">{{ row.char }}</td>
            <td style="padding:6px;font-family:monospace;color:var(--accent)">{{ row.named }}</td>
            <td style="padding:6px;font-family:monospace">{{ row.numeric }}</td>
            <td style="padding:6px;font-family:monospace">{{ row.hex }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

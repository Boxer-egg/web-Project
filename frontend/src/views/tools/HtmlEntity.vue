<script setup>
import { watch, ref } from 'vue'
import { useStorage } from '@vueuse/core'
import { useTool } from '../../composables/useTool'
import * as htmlLogic from '../../logic/html-entity'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const mode = useStorage('html-entity-mode', 'encode_named')
const encodeAll = useStorage('html-entity-all', false)

const {
  input,
  output,
  autoMode,
  copyText,
  clearAll,
  loadExample,
  process,
  copy
} = useTool({
  storageKey: 'html-entity',
  processor: (val) => {
    const opts = { onlyNonAscii: encodeAll.value }
    switch (mode.value) {
      case 'encode_named': return htmlLogic.encodeNamed(val, opts)
      case 'encode_numeric': return htmlLogic.encodeNumeric(val, opts)
      case 'encode_hex': return htmlLogic.encodeHex(val, opts)
      case 'decode': return htmlLogic.decode(val)
      default: return val
    }
  },
  paramMapping: {
    text: { ref: ref('') },
    action: { ref: mode }
  },
  example: '<div class="container">Hello "世界" & 你好 \'test\'</div>'
})

watch([mode, encodeAll], () => {
  if (autoMode.value) process()
})

const quickRef = [
  { char: '<', named: '&lt;', numeric: '&#60;', hex: '&#x3C;' },
  { char: '>', named: '&gt;', numeric: '&#62;', hex: '&#x3E;' },
  { char: '&', named: '&amp;', numeric: '&#38;', hex: '&#x26;' },
  { char: '"', named: '&quot;', numeric: '&#34;', hex: '&#x22;' },
  { char: "'", named: '&#x27;', numeric: '&#39;', hex: '&#x27;' },
  { char: ' ', named: '&nbsp;', numeric: '&#160;', hex: '&#xA0;' },
]
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
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
      <button class="btn" :class="{ 'btn-secondary': mode !== 'encode_numeric' }" @click="mode = 'encode_numeric'; process()">编码 → Numeric</button>
      <button class="btn" :class="{ 'btn-secondary': mode !== 'encode_hex' }" @click="mode = 'encode_hex'; process()">编码 → Hex</button>
      <button class="btn" :class="{ 'btn-secondary': mode !== 'decode' }" @click="mode = 'decode'; process()">解码</button>
      <button class="btn btn-secondary" @click="clearAll">清空</button>
      <button class="btn btn-secondary" @click="loadExample">示例</button>
    </div>
    <div class="tool-actions">
      <button class="btn btn-sm" :class="autoMode ? '' : 'btn-secondary'" @click="autoMode = !autoMode" style="font-size:11px">
        自动 {{ autoMode ? 'ON' : 'OFF' }}
      </button>
      <label style="font-size:12px;color:var(--text-secondary);display:flex;align-items:center;gap:4px;cursor:pointer">
        <input type="checkbox" v-model="encodeAll"> 仅编码非 ASCII 字符（已编码的保持原样）
      </label>
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
      <table class="table">
        <thead>
          <tr>
            <th>字符</th>
            <th>Named</th>
            <th>Numeric</th>
            <th>Hex</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in quickRef" :key="row.char">
            <td class="mono">{{ row.char }}</td>
            <td class="mono accent">{{ row.named }}</td>
            <td class="mono">{{ row.numeric }}</td>
            <td class="mono">{{ row.hex }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.table {
  width: 100%;
  font-size: 13px;
  border-collapse: collapse;
  min-width: 500px;
}
.table th, .table td {
  text-align: left;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
}
.mono {
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
}
.accent {
  color: var(--accent);
}
</style>

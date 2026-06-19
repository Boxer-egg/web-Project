<script setup>
import { computed, ref } from 'vue'
import { useTool } from '../../composables/useTool'
import * as urlLogic from '../../logic/url'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const {
  input,
  output,
  autoMode,
  copyText,
  clearAll,
  loadExample,
  process: encode,
  copy
} = useTool({
  storageKey: 'url',
  processor: (val) => {
    // If input looks like encoded URL, try to decode
    if (val.includes('%')) {
      try {
        const decoded = urlLogic.decode(val)
        if (decoded !== val) return decoded
      } catch { /* ignore */ }
    }
    return urlLogic.encode(val)
  },
  paramMapping: { text: { ref: ref('') } },
  example: 'https://example.com/search?q=你好世界&page=1'
})

function decode() {
  try {
    output.value = urlLogic.decode(input.value)
  } catch (e) {
    output.value = '解码失败: ' + e.message
  }
}

const parsedParams = computed(() => {
  return urlLogic.parseParams(input.value) || urlLogic.parseParams(output.value)
})
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>🔗 URL 编解码</h1>
      <AiHelpPanel
        title="URL 编解码"
        desc="URL 编码与解码，自动识别方向，解析 URL 参数"
        api-tool="url"
        :params="[
          { name: 'text', desc: '要编码/解码的 URL 或文本', required: true, example: 'https://example.com?q=你好' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>
    <div class="tool-actions">
      <button class="btn" @click="encode">编码</button>
      <button class="btn btn-secondary" @click="decode">解码</button>
      <button class="btn btn-secondary" @click="clearAll">清空</button>
      <button class="btn btn-secondary" @click="loadExample">加载示例</button>
    </div>
    <div class="tool-actions">
      <button class="btn btn-sm" :class="autoMode ? '' : 'btn-secondary'" @click="autoMode = !autoMode" style="font-size:11px">
        自动 {{ autoMode ? 'ON' : 'OFF' }}
      </button>
    </div>
    <div class="tool-section">
      <div class="tool-panel">
        <h3>输入</h3>
        <textarea v-model="input" class="textarea" placeholder="输入 URL 或参数..." rows="12"></textarea>
      </div>
      <div class="tool-panel">
        <h3>输出</h3>
        <textarea v-model="output" class="textarea" placeholder="处理结果..." rows="12" readonly></textarea>
        <button class="btn btn-sm" @click="copy" style="align-self:flex-start">{{ copyText }}</button>
      </div>
    </div>
    <div v-if="parsedParams.length" class="params-table card">
      <h3 style="margin-bottom:10px;font-size:14px">参数解析</h3>
      <table class="table">
        <thead>
          <tr>
            <th>Key</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in parsedParams" :key="p.key">
            <td class="key-col">{{ p.key }}</td>
            <td class="val-col">{{ p.value }}</td>
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
.params-table {
  margin-top: 16px;
  overflow: hidden;
}
.table {
  width: 100%;
  font-size: 13px;
  border-collapse: collapse;
}
.table th, .table td {
  text-align: left;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
}
.key-col {
  color: var(--accent);
  font-weight: 500;
  width: 30%;
}
.val-col {
  word-break: break-all;
}
</style>

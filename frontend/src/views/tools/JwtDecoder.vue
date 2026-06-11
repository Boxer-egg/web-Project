<script setup>
import { ref } from 'vue'
import { useTool } from '../../composables/useTool'
import { useToast } from '../../composables/useToast'
import * as jwtLogic from '../../logic/jwt'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const header = ref('')
const payload = ref('')
const signature = ref('')
const expired = ref('')
const toast = useToast()

const {
  input,
  autoMode,
  error,
  clearAll: baseClear,
  loadExample,
  process: parse
} = useTool({
  storageKey: 'jwt',
  processor: (val) => {
    const res = jwtLogic.decode(val)
    if (!res) return ''
    
    header.value = typeof res.header === 'object' ? JSON.stringify(res.header, null, 2) : res.header
    payload.value = typeof res.payload === 'object' ? JSON.stringify(res.payload, null, 2) : res.payload
    signature.value = res.signature
    expired.value = res.expired ? `${res.expired}（过期时间：${new Date(res.expDate).toLocaleString()}）` : ''
    
    if (res.headerError) throw new Error(res.headerError)
    if (res.payloadError) throw new Error(res.payloadError)
    
    return '' // output isn't used
  },
  paramMapping: { token: { ref: ref('') } },
  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IuacseW8oOWFgCIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNzI3MTc1NjAwfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
})

function clearAll() {
  baseClear()
  header.value = ''
  payload.value = ''
  signature.value = ''
  expired.value = ''
}

function copyText(text) {
  navigator.clipboard.writeText(text)
  toast.success('已复制')
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>📜 JWT 解码器</h1>
      <AiHelpPanel
        title="JWT 解码器"
        desc="解析 JWT Token 的 Header、Payload 和 Signature，自动检测过期时间"
        :params="[
          { name: 'token', desc: 'JWT Token 字符串', required: true, example: 'eyJhbGciOiJIUzI1NiIs...' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>
    <div class="tool-actions">
      <button class="btn" @click="parse">解析</button>
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
        <textarea v-model="input" class="textarea" placeholder="粘贴 JWT Token..." rows="12"></textarea>
      </div>
      <div class="tool-panel">
        <h3>解析结果</h3>
        <div v-if="expired" class="status-msg" :class="{ 'error-text': expired.includes('已过期') }">
          {{ expired }}
        </div>
        <div v-if="header" style="margin-bottom:12px">
          <div class="panel-label">
            <span>Header</span>
            <button class="btn btn-sm btn-secondary" @click="copyText(header)">复制</button>
          </div>
          <textarea v-model="header" class="textarea" rows="6" readonly></textarea>
        </div>
        <div v-if="payload">
          <div class="panel-label">
            <span>Payload</span>
            <button class="btn btn-sm btn-secondary" @click="copyText(payload)">复制</button>
          </div>
          <textarea v-model="payload" class="textarea" rows="10" readonly></textarea>
        </div>
        <div v-if="signature" style="margin-top:12px">
          <div class="panel-label">Signature</div>
          <code class="signature-box">{{ signature }}</code>
        </div>
      </div>
    </div>
    <div v-if="error" class="error-msg">❌ {{ error }}</div>
  </div>
</template>

<style scoped>
.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.panel-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 13px;
  color: var(--text-secondary);
}
.status-msg {
  margin-bottom: 10px;
  font-size: 13px;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius);
}
.error-text {
  color: var(--error);
}
.signature-box {
  display: block;
  font-size: 12px;
  word-break: break-all;
  padding: 8px;
  background: var(--bg-secondary);
  border-radius: var(--radius);
  border: 1px solid var(--border);
}
.error-msg {
  color: var(--error);
  background: rgba(239, 68, 68, 0.1);
  padding: 10px 16px;
  border-radius: var(--radius);
  margin-top: 10px;
  font-size: 14px;
}
</style>

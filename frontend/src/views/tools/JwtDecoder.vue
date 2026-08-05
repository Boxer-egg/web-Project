<script setup>
import { ref, computed, watch } from 'vue'
import { useTool } from '../../composables/useTool'
import { useToast } from '../../composables/useToast'
import * as jwtLogic from '../../logic/jwt'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const toast = useToast()

const headerRaw = ref('')
const headerJson = ref('')
const payloadRaw = ref('')
const payloadJson = ref('')
const signature = ref('')
const hasSignature = ref(true)
const expired = ref('')
const expDate = ref('')
const iatDate = ref('')
const nbfDate = ref('')
const headerError = ref('')
const payloadError = ref('')
const foldHeader = ref(false)
const foldPayload = ref(false)
const foldSignature = ref(false)

const validity = ref('idle') // idle | valid | invalid

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

    headerRaw.value = res.headerRaw
    headerJson.value = typeof res.header === 'object' ? JSON.stringify(res.header, null, 2) : res.header
    payloadRaw.value = res.payloadRaw
    payloadJson.value = typeof res.payload === 'object' ? JSON.stringify(res.payload, null, 2) : res.payload
    signature.value = res.signature
    hasSignature.value = res.hasSignature
    expired.value = res.expired
    expDate.value = res.expDate
    iatDate.value = res.iatDate
    nbfDate.value = res.nbfDate
    headerError.value = res.headerError
    payloadError.value = res.payloadError

    if (res.headerError) error.value = res.headerError
    if (res.payloadError) error.value = res.payloadError

    return '' // output isn't used
  },
  paramMapping: { token: { ref: ref('') } },
  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IuacseW8oOWFgCIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNzI3MTc1NjAwfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
})

// 实时格式检测（防抖 300ms）
let validityTimer = null
watch(input, (val) => {
  clearTimeout(validityTimer)
  validityTimer = setTimeout(() => {
    const trimmed = (val || '').split('\n')[0].trim().replace(/\s+/g, '')
    if (!trimmed) { validity.value = 'idle'; return }
    if (trimmed.toLowerCase().startsWith('bearer')) {
      validity.value = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+(\.[A-Za-z0-9_-]+)?$/.test(trimmed.slice(6)) ? 'valid' : 'invalid'
    } else {
      validity.value = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+(\.[A-Za-z0-9_-]+)?$/.test(trimmed) ? 'valid' : 'invalid'
    }
  }, 300)
})

const multiLine = computed(() => (input.value || '').split('\n').filter(l => l.trim()).length > 1)

function clearAll() {
  baseClear()
  headerRaw.value = ''
  headerJson.value = ''
  payloadRaw.value = ''
  payloadJson.value = ''
  signature.value = ''
  hasSignature.value = true
  expired.value = ''
  expDate.value = ''
  iatDate.value = ''
  nbfDate.value = ''
  headerError.value = ''
  payloadError.value = ''
  validity.value = 'idle'
}

async function copyText(text, msg = '已复制') {
  if (!text) { toast.warn('没有可复制的内容'); return }
  try {
    await navigator.clipboard.writeText(text)
    toast.success(msg)
  } catch {
    toast.warn('复制失败，请手动复制')
  }
}

const fullResult = computed(() => {
  const h = headerJson.value
  const p = payloadJson.value
  return `Header:\n${h}\n\nPayload:\n${p}`
})
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
        <textarea
          v-model="input"
          class="textarea"
          :class="{ 'valid-input': validity === 'valid', 'invalid-input': validity === 'invalid' }"
          placeholder="粘贴 JWT Token..."
          rows="12"
        ></textarea>
        <div v-if="validity === 'valid'" class="validity-msg valid">✓ 格式正确</div>
        <div v-else-if="validity === 'invalid'" class="validity-msg invalid">请输入有效的 JWT 格式（header.payload.signature）</div>
        <div v-if="multiLine" class="validity-msg warn">检测到多个 Token，仅解析第一个</div>
      </div>
      <div class="tool-panel">
        <h3>解析结果</h3>
        <div v-if="expired" class="status-msg" :class="{ 'error-text': expired.includes('已过期') }">
          {{ expired }}
        </div>

        <!-- Header 折叠区 -->
        <div v-if="headerJson" class="section-block">
          <div class="panel-label" @click="foldHeader = !foldHeader">
            <span>Header {{ foldHeader ? '▶' : '▼' }}</span>
            <button class="btn btn-sm btn-secondary" @click.stop="copyText(headerJson, 'Header 已复制')">复制</button>
          </div>
          <div v-if="!foldHeader">
            <div class="raw-line">原始：<code class="raw-code">{{ headerRaw }}</code></div>
            <div v-if="headerError" class="section-error">⚠️ {{ headerError }}</div>
            <textarea v-model="headerJson" class="textarea" rows="5" readonly></textarea>
          </div>
        </div>

        <!-- Payload 折叠区 -->
        <div v-if="payloadJson" class="section-block">
          <div class="panel-label" @click="foldPayload = !foldPayload">
            <span>Payload {{ foldPayload ? '▶' : '▼' }}</span>
            <button class="btn btn-sm btn-secondary" @click.stop="copyText(payloadJson, 'Payload 已复制')">复制</button>
          </div>
          <div v-if="!foldPayload">
            <div class="raw-line">原始：<code class="raw-code">{{ payloadRaw }}</code></div>
            <div v-if="payloadError" class="section-error">⚠️ {{ payloadError }}</div>
            <textarea v-model="payloadJson" class="textarea" rows="7" readonly></textarea>
            <div v-if="expDate || iatDate || nbfDate" class="date-info">
              <div v-if="expDate">exp（过期）：{{ new Date(expDate).toLocaleString() }}</div>
              <div v-if="iatDate">iat（签发）：{{ new Date(iatDate).toLocaleString() }}</div>
              <div v-if="nbfDate">nbf（生效）：{{ new Date(nbfDate).toLocaleString() }}</div>
            </div>
          </div>
        </div>

        <!-- Signature 折叠区 -->
        <div v-if="signature || !hasSignature" class="section-block">
          <div class="panel-label" @click="foldSignature = !foldSignature">
            <span>Signature {{ foldSignature ? '▶' : '▼' }}</span>
          </div>
          <div v-if="!foldSignature">
            <code class="signature-box">{{ hasSignature ? signature : '无签名' }}</code>
          </div>
        </div>

        <button v-if="headerJson || payloadJson" class="btn btn-sm btn-secondary" style="margin-top:10px" @click="copyText(fullResult, '完整结果已复制')">
          复制完整结果
        </button>
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
  cursor: pointer;
  user-select: none;
}
.section-block {
  margin-bottom: 14px;
}
.raw-line {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 4px;
  word-break: break-all;
}
.raw-code {
  font-family: monospace;
  font-size: 11px;
}
.section-error {
  font-size: 12px;
  color: var(--error);
  background: rgba(239, 68, 68, 0.08);
  border-radius: var(--radius);
  padding: 6px 10px;
  margin-bottom: 6px;
}
.date-info {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.7;
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
.validity-msg {
  font-size: 12px;
  margin-top: 6px;
}
.validity-msg.valid { color: var(--success); }
.validity-msg.invalid { color: var(--error); }
.validity-msg.warn { color: var(--warning); }
.valid-input { border-color: var(--success) !important; }
.invalid-input { border-color: var(--error) !important; }
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

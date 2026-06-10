<script setup>
import { ref, onMounted } from 'vue'
import { useStorage } from '@vueuse/core'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const input = useStorage('jwt-input', '')
const header = ref('')
const payload = ref('')
const signature = ref('')
const error = ref('')
const expired = ref('')

function getUrlParams() {
  const hash = window.location.hash
  const query = hash.split('?')[1] || ''
  return new URLSearchParams(query)
}

function base64UrlDecode(str) {
  str += new Array(5 - str.length % 4).join('=')
  str = str.replace(/\-/g, '+').replace(/\_/g, '/')
  return decodeURIComponent(escape(window.atob(str)))
}

function parse() {
  error.value = ''
  header.value = ''
  payload.value = ''
  signature.value = ''
  expired.value = ''

  if (!input.value.trim()) return

  let token = input.value.trim()
  if (token.toLowerCase().startsWith('bearer ')) {
    token = token.slice(7)
  }

  const parts = token.split('.')
  if (parts.length !== 3) {
    error.value = 'JWT 格式错误：应包含 header.payload.signature 三部分'
    return
  }

  try {
    header.value = JSON.stringify(JSON.parse(base64UrlDecode(parts[0])), null, 2)
  } catch (e) {
    header.value = parts[0]
    error.value = 'Header 部分不是标准 JSON: ' + e.message
  }

  try {
    const p = JSON.parse(base64UrlDecode(parts[1]))
    payload.value = JSON.stringify(p, null, 2)

    if (p.exp) {
      const expDate = new Date(p.exp * 1000)
      const now = Date.now()
      if (expDate.getTime() < now) {
        expired.value = '已过期（过期时间：' + expDate.toLocaleString() + '）'
      } else if (expDate.getTime() - now < 24 * 3600 * 1000) {
        expired.value = '即将过期（24小时内，过期时间：' + expDate.toLocaleString() + '）'
      } else {
        expired.value = '未过期（过期时间：' + expDate.toLocaleString() + '）'
      }
    }
    if (p.iat) {
      const iatDate = new Date(p.iat * 1000)
      payload.value += '\n\n// iat 签发时间：' + iatDate.toLocaleString()
    }
  } catch (e) {
    payload.value = parts[1]
    error.value = error.value || 'Payload 部分不是标准 JSON: ' + e.message
  }

  signature.value = parts[2]
}

function clearAll() {
  input.value = ''
  header.value = ''
  payload.value = ''
  signature.value = ''
  error.value = ''
  expired.value = ''
}

function loadExample() {
  input.value = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IuacseW8oOWFgCIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNzI3MTc1NjAwfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
  parse()
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {}
}

onMounted(() => {
  const params = getUrlParams()
  if (params.get('token')) {
    input.value = params.get('token')
    parse()
  } else if (!input.value) {
    loadExample()
  }
})
</script>

<template>
  <div class="tool-page">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
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
    <div class="tool-section">
      <div class="tool-panel">
        <h3>输入</h3>
        <textarea v-model="input" class="textarea" placeholder="粘贴 JWT Token..." rows="12"></textarea>
      </div>
      <div class="tool-panel">
        <h3>解析结果</h3>
        <div v-if="expired" style="margin-bottom:10px;font-size:13px">{{ expired }}</div>
        <div v-if="header" style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <span style="font-size:13px;color:var(--text-secondary)">Header</span>
            <button class="btn btn-sm btn-secondary" @click="copy(header)">复制</button>
          </div>
          <textarea v-model="header" class="textarea" rows="6" readonly></textarea>
        </div>
        <div v-if="payload">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <span style="font-size:13px;color:var(--text-secondary)">Payload</span>
            <button class="btn btn-sm btn-secondary" @click="copy(payload)">复制</button>
          </div>
          <textarea v-model="payload" class="textarea" rows="10" readonly></textarea>
        </div>
        <div v-if="signature" style="margin-top:12px">
          <div style="font-size:13px;color:var(--text-secondary);margin-bottom:4px">Signature</div>
          <code style="font-size:12px;word-break:break-all">{{ signature }}</code>
        </div>
      </div>
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
</style>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useStorage } from '@vueuse/core'

const textInput = useStorage('base64-input', '')
const output = ref('')
const isImage = ref(false)
const imagePreview = ref('')
const copyText = ref('复制结果')
const fileInfo = ref('')
const isBase64 = ref(false)
const autoMode = useStorage('base64-auto', true)

function getUrlParams() {
  return new URLSearchParams(window.location.search)
}

function detectBase64(str) {
  if (!str || !str.trim()) return false
  const s = str.trim()
  return /^[A-Za-z0-9+/]*={0,2}$/.test(s) && s.length % 4 === 0 && s.length > 4
}

function autoProcess() {
  if (!textInput.value || !autoMode.value) return
  if (detectBase64(textInput.value)) {
    isBase64.value = true
    base64ToText()
  } else {
    isBase64.value = false
    textToBase64()
  }
}

watch(textInput, () => {
  if (autoMode.value) autoProcess()
}, { immediate: false })

onMounted(() => {
  const params = getUrlParams()
  if (params.get('text')) {
    textInput.value = params.get('text')
  } else if (!textInput.value) {
    textInput.value = 'Hello 世界! 这是一段示例文本。'
  }
  if (autoMode.value) autoProcess()
})

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str)
  const bin = String.fromCharCode(...bytes)
  return btoa(bin)
}

function base64ToUtf8(str) {
  const bin = atob(str)
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function textToBase64() {
  if (!textInput.value) return
  try {
    output.value = utf8ToBase64(textInput.value)
    isImage.value = false
    imagePreview.value = ''
    fileInfo.value = ''
  } catch (e) {
    output.value = '编码失败: ' + e.message
  }
}

function base64ToText() {
  if (!textInput.value) return
  try {
    output.value = base64ToUtf8(textInput.value)
    isImage.value = false
    imagePreview.value = ''
    fileInfo.value = ''
  } catch (e) {
    output.value = '解码失败: 无效的 Base64 字符串'
  }
}

function handleFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (file.size > 10 * 1024 * 1024) {
    output.value = '文件过大，请上传小于 10MB 的文件'
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    output.value = reader.result
    fileInfo.value = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`
    if (file.type.startsWith('image/')) {
      isImage.value = true
      imagePreview.value = reader.result
    } else {
      isImage.value = false
      imagePreview.value = ''
    }
  }
  reader.readAsDataURL(file)
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
  textInput.value = ''
  output.value = ''
  isImage.value = false
  imagePreview.value = ''
  fileInfo.value = ''
}

function loadExample() {
  textInput.value = 'Hello 世界! 123'
  textToBase64()
}
</script>

<template>
  <div class="tool-page">
    <h1>🔐 Base64 编解码</h1>
    <div class="tool-actions">
      <button class="btn" @click="textToBase64">文本 → Base64</button>
      <button class="btn btn-secondary" @click="base64ToText">Base64 → 文本</button>
      <label class="btn btn-secondary" style="cursor:pointer">
        文件 → Base64
        <input type="file" @change="handleFile" style="display:none">
      </label>
      <button class="btn btn-secondary" @click="clearAll">清空</button>
      <button class="btn btn-secondary" @click="loadExample">加载示例</button>
    </div>
    <div class="tool-actions">
      <button class="btn btn-sm" :class="autoMode ? '' : 'btn-secondary'" @click="autoMode = !autoMode" style="font-size:11px">
        自动 {{ autoMode ? 'ON' : 'OFF' }}
      </button>
      <span v-if="autoMode && isBase64" style="font-size:11px;color:var(--accent)">已识别为 Base64，自动解码</span>
      <span v-else-if="autoMode && textInput" style="font-size:11px;color:var(--text-muted)">自动编码中</span>
    </div>
    <div class="tool-section">
      <div class="tool-panel">
        <h3>输入</h3>
        <textarea v-model="textInput" class="textarea" placeholder="输入文本或 Base64..." rows="16"></textarea>
      </div>
      <div class="tool-panel">
        <h3>输出 <span v-if="fileInfo" style="color:var(--text-muted);font-size:12px">{{ fileInfo }}</span></h3>
        <img v-if="isImage && imagePreview" :src="imagePreview" style="max-width:100%;max-height:200px;border-radius:var(--radius);margin-bottom:10px">
        <textarea v-model="output" class="textarea" placeholder="处理结果..." rows="isImage ? 8 : 16" readonly></textarea>
        <button class="btn btn-sm" @click="copy" style="align-self:flex-start">{{ copyText }}</button>
      </div>
    </div>
  </div>
</template>

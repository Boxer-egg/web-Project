<script setup>
import { ref, watch } from 'vue'
import { useTool } from '../../composables/useTool'
import * as base64Logic from '../../logic/base64'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const isImage = ref(false)
const imagePreview = ref('')
const fileInfo = ref('')
const isBase64 = ref(false)

function autoProcess(val) {
  if (!val) return ''
  if (base64Logic.detectBase64(val)) {
    isBase64.value = true
    try {
      return base64Logic.base64ToUtf8(val)
    } catch {
      isBase64.value = false
      return base64Logic.utf8ToBase64(val)
    }
  } else {
    isBase64.value = false
    return base64Logic.utf8ToBase64(val)
  }
}

const {
  input: textInput,
  output,
  error,
  autoMode,
  copyText,
  clearAll: baseClear,
  loadExample,
  process: runAuto,
  copy
} = useTool({
  storageKey: 'base64',
  processor: autoProcess,
  paramMapping: { text: { ref: ref('') } },
  example: 'Hello 世界! 这是一段示例文本。'
})

function textToBase64() {
  if (!textInput.value) return
  try {
    output.value = base64Logic.utf8ToBase64(textInput.value)
    isImage.value = false
    imagePreview.value = ''
    fileInfo.value = ''
    error.value = ''
  } catch (e) {
    error.value = '编码失败: ' + e.message
  }
}

function base64ToText() {
  if (!textInput.value) return
  try {
    output.value = base64Logic.base64ToUtf8(textInput.value)
    isImage.value = false
    imagePreview.value = ''
    fileInfo.value = ''
    error.value = ''
  } catch (e) {
    error.value = '解码失败: 无效的 Base64 字符串'
  }
}

function handleFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (file.size > 10 * 1024 * 1024) {
    error.value = '文件过大，请上传小于 10MB 的文件'
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

function clearAll() {
  baseClear()
  isImage.value = false
  imagePreview.value = ''
  fileInfo.value = ''
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>🔐 Base64 编解码</h1>
      <AiHelpPanel
        title="Base64 编解码"
        desc="文本与 Base64 互相转换，支持文件上传为 Base64 DataURL"
        :params="[
          { name: 'text', desc: '要编码/解码的文本或 Base64 字符串', required: true, example: 'Hello World' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>
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
        <textarea v-model="output" class="textarea" :placeholder="isImage ? 'Base64 DataURL...' : '处理结果...'" :rows="isImage ? 8 : 16" readonly></textarea>
        <button class="btn btn-sm" @click="copy" style="align-self:flex-start">{{ copyText }}</button>
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
.error-msg {
  color: var(--error);
  background: rgba(239, 68, 68, 0.1);
  padding: 10px 16px;
  border-radius: var(--radius);
  margin-top: 10px;
  font-size: 14px;
}
</style>

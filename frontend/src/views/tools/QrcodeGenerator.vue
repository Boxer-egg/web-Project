<script setup>
import { ref, onMounted, watch } from 'vue'
import { getUrlParams } from '../../utils/urlParams'
import { useStorage } from '@vueuse/core'
import QRCode from 'qrcode'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const text = useStorage('qr-text', '')
const size = useStorage('qr-size', 256)
const level = useStorage('qr-level', 'M')
const fgColor = useStorage('qr-fg', '#000000')
const bgColor = useStorage('qr-bg', '#ffffff')
const margin = useStorage('qr-margin', 2)
const qrDataUrl = ref('')
const error = ref('')


async function generate() {
  error.value = ''
  if (!text.value.trim()) { qrDataUrl.value = ''; return }
  try {
    qrDataUrl.value = await QRCode.toDataURL(text.value, {
      width: size.value,
      margin: margin.value,
      errorCorrectionLevel: level.value,
      color: { dark: fgColor.value, light: bgColor.value }
    })
  } catch (e) {
    error.value = '生成失败: ' + (e.message || '内容过长或格式错误')
    qrDataUrl.value = ''
  }
}

function download() {
  if (!qrDataUrl.value) return
  const a = document.createElement('a')
  a.href = qrDataUrl.value
  a.download = 'qrcode.png'
  a.click()
}

function clearAll() {
  text.value = ''
  qrDataUrl.value = ''
  error.value = ''
}

function loadExample() {
  text.value = 'https://github.com'
  generate()
}

watch([size, level, fgColor, bgColor, margin], () => {
  if (text.value) generate()
}, { flush: 'post' })

onMounted(() => {
  const params = getUrlParams()
  if (params.get('text')) {
    text.value = params.get('text')
    if (params.get('size')) size.value = parseInt(params.get('size'))
    if (params.get('level')) level.value = params.get('level')
    generate()
  } else if (!text.value) {
    loadExample()
  }
})
</script>

<template>
  <div class="tool-page">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h1>▣ 二维码生成器</h1>
      <AiHelpPanel
        title="二维码生成器"
        desc="将文本或 URL 转换为可扫描的二维码图片，支持自定义尺寸、颜色和纠错级别"
        :params="[
          { name: 'text', desc: '要编码的内容', required: true, example: 'https://example.com' },
          { name: 'size', desc: '尺寸：128/256/512/1024', required: false, example: '256' },
          { name: 'level', desc: '纠错级别：L/M/Q/H', required: false, example: 'M' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>
    <div class="tool-section">
      <div class="tool-panel">
        <h3>配置</h3>
        <textarea v-model="text" class="textarea" placeholder="输入文本或 URL..." rows="6"></textarea>
        <div style="margin-top:12px">
          <label style="font-size:13px;color:var(--text-secondary);display:block;margin-bottom:4px">尺寸: {{ size }}px</label>
          <input type="range" v-model.number="size" min="128" max="1024" step="128" style="width:100%">
          <div style="display:flex;gap:8px;margin-top:4px">
            <button v-for="s in [128,256,512,1024]" :key="s" class="btn btn-sm btn-secondary" @click="size=s">{{ s }}</button>
          </div>
        </div>
        <div style="margin-top:12px">
          <label style="font-size:13px;color:var(--text-secondary);display:block;margin-bottom:4px">纠错级别</label>
          <div style="display:flex;gap:6px">
            <button v-for="l in ['L','M','Q','H']" :key="l" class="btn btn-sm" :class="{ 'btn-secondary': level !== l }" @click="level=l">{{ l }}</button>
          </div>
        </div>
        <div style="margin-top:12px;display:flex;gap:12px;align-items:center">
          <div>
            <label style="font-size:13px;color:var(--text-secondary);display:block;margin-bottom:4px">前景色</label>
            <input type="color" v-model="fgColor" style="width:50px;height:32px;border:none;cursor:pointer">
          </div>
          <div>
            <label style="font-size:13px;color:var(--text-secondary);display:block;margin-bottom:4px">背景色</label>
            <input type="color" v-model="bgColor" style="width:50px;height:32px;border:none;cursor:pointer">
          </div>
          <div>
            <label style="font-size:13px;color:var(--text-secondary);display:block;margin-bottom:4px">边距: {{ margin }}</label>
            <input type="range" v-model.number="margin" min="0" max="4" style="width:80px">
          </div>
        </div>
        <div class="tool-actions" style="margin-top:16px">
          <button class="btn" @click="generate">生成</button>
          <button class="btn btn-secondary" @click="clearAll">清空</button>
          <button class="btn btn-secondary" @click="loadExample">示例</button>
        </div>
      </div>
      <div class="tool-panel" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:300px">
        <img v-if="qrDataUrl" :src="qrDataUrl" :style="{ width: Math.min(size, 300) + 'px', height: Math.min(size, 300) + 'px', imageRendering: 'pixelated' }" style="border:1px solid var(--border);border-radius:var(--radius)">
        <div v-else style="color:var(--text-muted);padding:40px;text-align:center">
          输入内容生成二维码
        </div>
        <button v-if="qrDataUrl" class="btn btn-sm btn-secondary" @click="download" style="margin-top:12px">下载 PNG</button>
      </div>
    </div>
    <div v-if="error" class="error-msg" style="margin-top:10px">❌ {{ error }}</div>
  </div>
</template>

<style scoped>
.error-msg {
  color: var(--error);
  background: rgba(239, 68, 68, 0.1);
  padding: 10px 16px;
  border-radius: var(--radius);
  font-size: 14px;
}
</style>

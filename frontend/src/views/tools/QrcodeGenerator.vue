<script setup>
import { ref, computed, onMounted, watch } from 'vue'
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

// Approximate byte-mode QR capacity per version (numeric/alphanumeric/byte), for typical byte content.
// Version 1 ~ 40, level L/M/Q/H approximate byte capacities.
const BYTE_CAPACITY = {
  L: [17, 32, 53, 78, 106, 134, 154, 192, 230, 271, 321, 367, 425, 458, 520, 586, 644, 718, 792, 858, 929, 1003, 1091, 1171, 1273, 1367, 1465, 1528, 1628, 1732, 1840, 1952, 2068, 2188, 2303, 2431, 2563, 2699, 2809, 2953],
  M: [14, 26, 42, 62, 84, 106, 122, 152, 180, 213, 251, 287, 331, 362, 412, 450, 504, 560, 624, 666, 711, 779, 857, 911, 997, 1059, 1125, 1190, 1264, 1370, 1452, 1538, 1628, 1722, 1809, 1911, 1989, 2099, 2213, 2331],
  Q: [11, 20, 32, 46, 60, 74, 86, 108, 130, 151, 177, 203, 241, 258, 292, 322, 364, 394, 442, 482, 523, 568, 618, 664, 718, 754, 808, 871, 911, 985, 1033, 1115, 1171, 1231, 1286, 1354, 1426, 1502, 1582, 1660],
  H: [7, 14, 24, 34, 44, 58, 64, 84, 98, 119, 137, 155, 177, 194, 220, 250, 280, 310, 338, 382, 403, 439, 461, 511, 535, 593, 625, 658, 698, 742, 790, 842, 898, 958, 983, 1054, 1096, 1142, 1222, 1276]
}

const LEVEL_LABELS = { L: 'L≈7%', M: 'M≈15%', Q: 'Q≈25%', H: 'H≈30%' }

const charCount = computed(() => text.value.length)
const capacityHint = computed(() => {
  if (!text.value) return ''
  const cap = BYTE_CAPACITY[level.value][39] // version 40 capacity
  if (charCount.value > cap) return '内容过长，无法生成二维码'
  return `字符数: ${charCount.value}（当前 ${level.value} 级最大约 ${cap} 字符）`
})

const recommendedLevel = computed(() => {
  if (!text.value) return ''
  const len = charCount.value
  const best = ['L', 'M', 'Q', 'H'].find(lv => len <= BYTE_CAPACITY[lv][39]) || 'H'
  return best
})

async function generate() {
  error.value = ''
  if (!text.value.trim()) { qrDataUrl.value = ''; return }
  if (fgColor.value.toLowerCase() === bgColor.value.toLowerCase()) {
    error.value = '前景色和背景色不能相同'
    qrDataUrl.value = ''
    return
  }
  const cap = BYTE_CAPACITY[level.value][39]
  if (text.value.length > cap) {
    error.value = `内容过长（当前 ${text.value.length} 字符，${level.value} 级最大支持 ${cap} 字符），请缩短内容或提高纠错级别`
    qrDataUrl.value = ''
    return
  }
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

async function copyContent() {
  if (!text.value) { error.value = '没有可复制的内容'; return }
  try {
    await navigator.clipboard.writeText(text.value)
  } catch {}
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
        api-tool="qrcode"
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
        <div style="margin-top:8px;font-size:12px;color:var(--text-muted)">
          {{ capacityHint }}
          <span v-if="text && recommendedLevel !== level" style="margin-left:8px;color:var(--warning)">
            建议纠错级别：{{ recommendedLevel }}（{{ LEVEL_LABELS[recommendedLevel] }}）
          </span>
        </div>
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
          <p style="margin:6px 0 0;font-size:12px;color:var(--text-muted);line-height:1.5">
            L≈7%（低）、M≈15%（中）、Q≈25%（较高）、H≈30%（高）。级别越高，二维码被遮挡或污损后仍能识别的概率越大，但码点会更密集。
          </p>
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
          <button class="btn btn-secondary" @click="copyContent">复制内容</button>
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

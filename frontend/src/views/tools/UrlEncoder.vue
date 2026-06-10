<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStorage } from '@vueuse/core'

const input = useStorage('url-input', '')
const output = ref('')
const copyText = ref('复制结果')

function getUrlParams() {
  const hash = window.location.hash
  const query = hash.split('?')[1] || ''
  return new URLSearchParams(query)
}

const params = computed(() => {
  if (!output.value) return []
  try {
    const url = new URL(output.value.startsWith('http') ? output.value : 'http://example.com' + output.value)
    return Array.from(url.searchParams.entries())
  } catch {
    return []
  }
})

function encode() {
  if (!input.value) return
  output.value = input.value.split('\n').map(line => encodeURIComponent(line)).join('\n')
}

function decode() {
  if (!input.value) return
  try {
    output.value = input.value.split('\n').map(line => decodeURIComponent(line)).join('\n')
  } catch (e) {
    output.value = '解码失败: ' + e.message
  }
}

function auto() {
  if (!input.value) return
  if (input.value.includes('%')) {
    try {
      decodeURIComponent(input.value)
      decode()
    } catch {
      encode()
    }
  } else {
    encode()
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
  input.value = 'https://example.com/search?q=你好世界&page=1'
  encode()
}

onMounted(() => {
  const params = getUrlParams()
  if (params.get('text')) {
    input.value = params.get('text')
    encode()
  } else if (!input.value) {
    loadExample()
  } else {
    encode()
  }
})
</script>

<template>
  <div class="tool-page">
    <h1>🔗 URL 编解码</h1>
    <div class="tool-actions">
      <button class="btn" @click="encode">编码</button>
      <button class="btn btn-secondary" @click="decode">解码</button>
      <button class="btn btn-secondary" @click="auto">自动识别</button>
      <button class="btn btn-secondary" @click="clearAll">清空</button>
      <button class="btn btn-secondary" @click="loadExample">加载示例</button>
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
    <div v-if="params.length" class="params-table card">
      <h3 style="margin-bottom:10px;font-size:14px">参数解析</h3>
      <table style="width:100%;font-size:13px;border-collapse:collapse">
        <thead>
          <tr style="border-bottom:1px solid var(--border)">
            <th style="text-align:left;padding:6px">Key</th>
            <th style="text-align:left;padding:6px">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="[k, v] in params" :key="k" style="border-bottom:1px solid var(--border)">
            <td style="padding:6px;color:var(--accent)">{{ k }}</td>
            <td style="padding:6px">{{ v }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

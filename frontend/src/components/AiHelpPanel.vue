<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  title: { type: String, required: true },
  desc: { type: String, required: true },
  params: { type: Array, default: () => [] },
  apiTool: { type: String, default: '' }
})

const route = useRoute()
const show = ref(false)
const copiedKey = ref('')
let copyTimer = null

onUnmounted(() => {
  if (copyTimer) clearTimeout(copyTimer)
})

const apiPath = computed(() => route.meta?.apiPath || '')

const relevantParams = computed(() =>
  props.params.filter(p => (apiPath.value ? p.name !== 'auto' : true))
)

const exampleUrl = computed(() => {
  const base = window.location.origin
  const path = apiPath.value || route.path
  const queryParts = relevantParams.value
    .filter(p => p.example)
    .map(p => `${p.name}=${encodeURIComponent(p.example)}`)
  if (props.apiTool) {
    queryParts.unshift(`tool=${encodeURIComponent(props.apiTool)}`)
  }
  const query = queryParts.join('&')
  if (apiPath.value) {
    return query ? `${base}${path}?${query}` : `${base}${path}`
  }
  return query ? `${base}${path}?${query}&auto=1` : `${base}${path}?auto=1`
})

const curlCommand = computed(() => `curl -sL "${exampleUrl.value}"`)
const wgetCommand = computed(() => `wget -qO- "${exampleUrl.value}"`)

async function copy(key, text) {
  try {
    await navigator.clipboard.writeText(text)
    copiedKey.value = key
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => copiedKey.value = '', 2000)
  } catch {}
}

async function copyUrl() {
  await copy('url', exampleUrl.value)
}

async function copyDesc() {
  const text = `${props.title}：${props.desc}\n调用方式：${exampleUrl.value}`
  await copy('desc', text)
}

function isCopied(key) {
  return copiedKey.value === key
}
</script>

<template>
  <div class="ai-help">
    <button class="ai-toggle" @click="show = !show">
      <span>🤖</span>
      <span>AI 调用</span>
    </button>
    <div v-if="show" class="ai-panel card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <strong style="font-size:14px">🤖 AI 调用说明</strong>
        <button class="btn btn-sm btn-secondary" @click="show = false">关闭</button>
      </div>
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px">
        {{ title }}：{{ desc }}
      </p>
      <div style="margin-bottom:12px">
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">示例调用链接：</div>
        <pre class="code-block">{{ exampleUrl }}</pre>
      </div>
      <div v-if="relevantParams.length" style="margin-bottom:12px">
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">参数说明：</div>
        <table style="width:100%;font-size:12px;border-collapse:collapse">
          <thead>
            <tr style="border-bottom:1px solid var(--border)">
              <th style="text-align:left;padding:4px">参数</th>
              <th style="text-align:left;padding:4px">说明</th>
              <th style="text-align:left;padding:4px">必需</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in relevantParams" :key="p.name" style="border-bottom:1px solid var(--border)">
              <td style="padding:4px;color:var(--accent);font-family:monospace">{{ p.name }}</td>
              <td style="padding:4px">{{ p.desc }}</td>
              <td style="padding:4px">{{ p.required ? '是' : '否' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="apiPath" style="margin-bottom:12px">
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">命令行调用示例：</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <div>
            <pre class="code-block">{{ curlCommand }}</pre>
            <button class="btn btn-sm" style="margin-top:4px" @click="copy('curl', curlCommand)">{{ isCopied('curl') ? '已复制' : '复制 curl' }}</button>
          </div>
          <div>
            <pre class="code-block">{{ wgetCommand }}</pre>
            <button class="btn btn-sm" style="margin-top:4px" @click="copy('wget', wgetCommand)">{{ isCopied('wget') ? '已复制' : '复制 wget' }}</button>
          </div>
        </div>
      </div>

      <div style="display:flex;gap:8px">
        <button class="btn btn-sm" @click="copyUrl">{{ isCopied('url') ? '已复制' : '复制链接' }}</button>
        <button class="btn btn-sm btn-secondary" @click="copyDesc">{{ isCopied('desc') ? '已复制' : '复制说明' }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-help {
  position: relative;
}
.ai-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.ai-toggle:hover {
  border-color: var(--accent);
  color: var(--accent);
}
.ai-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 480px;
  max-width: calc(100vw - 40px);
  z-index: 100;
  padding: 16px;
}
.code-block {
  display: block;
  margin: 0;
  padding: 10px 12px;
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
  color: var(--text-primary);
  line-height: 1.5;
}
@media (max-width: 768px) {
  .ai-panel {
    width: calc(100vw - 40px);
    right: -10px;
  }
}
</style>

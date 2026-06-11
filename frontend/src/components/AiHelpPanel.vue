<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  title: { type: String, required: true },
  desc: { type: String, required: true },
  params: { type: Array, default: () => [] },
})

const route = useRoute()
const show = ref(false)
const copied = ref(false)
let copyTimer = null

onUnmounted(() => {
  if (copyTimer) clearTimeout(copyTimer)
})

const exampleUrl = computed(() => {
  const base = window.location.origin
  const path = route.path
  const query = props.params
    .filter(p => p.example)
    .map(p => `${p.name}=${encodeURIComponent(p.example)}`)
    .join('&')
  return query ? `${base}${path}?${query}&auto=1` : `${base}${path}?auto=1`
})

async function copyUrl() {
  try {
    await navigator.clipboard.writeText(exampleUrl.value)
    copied.value = true
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => copied.value = false, 2000)
  } catch {}
}

async function copyDesc() {
  const text = `${props.title}：${props.desc}\n调用方式：${exampleUrl.value}`
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => copied.value = false, 2000)
  } catch {}
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
        <code style="display:block;font-size:12px;background:var(--bg-primary);padding:8px;border-radius:var(--radius);word-break:break-all;border:1px solid var(--border)">
          {{ exampleUrl }}
        </code>
      </div>
      <div v-if="params.length" style="margin-bottom:12px">
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
            <tr v-for="p in params" :key="p.name" style="border-bottom:1px solid var(--border)">
              <td style="padding:4px;color:var(--accent);font-family:monospace">{{ p.name }}</td>
              <td style="padding:4px">{{ p.desc }}</td>
              <td style="padding:4px">{{ p.required ? '是' : '否' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-sm" @click="copyUrl">{{ copied ? '已复制' : '复制链接' }}</button>
        <button class="btn btn-sm btn-secondary" @click="copyDesc">复制说明</button>
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
@media (max-width: 768px) {
  .ai-panel {
    width: calc(100vw - 40px);
    right: -10px;
  }
}
</style>

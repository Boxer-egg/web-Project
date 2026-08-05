<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from '../composables/useToast'

const ENDPOINT = 'https://formspree.io/f/mrpzgqnj'
const MAX_LEN = 2000

const route = useRoute()
const toast = useToast()

const isOpen = ref(false)
const message = ref('')
const email = ref('')
const gotcha = ref('')
const submitting = ref(false)

const remaining = computed(() => MAX_LEN - message.value.length)

function open() {
  isOpen.value = true
}

function close() {
  isOpen.value = false
}

function reset() {
  message.value = ''
  email.value = ''
  gotcha.value = ''
}

async function submit() {
  const content = message.value.trim()
  if (!content) {
    toast.warn('请填写反馈内容')
    return
  }
  if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    toast.warn('邮箱格式不正确')
    return
  }

  submitting.value = true
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        message: content,
        email: email.value.trim(),
        page: route.path,
        _gotcha: gotcha.value,
      }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    toast.success('反馈已发送，感谢你的建议！')
    reset()
    close()
  } catch {
    toast.error('发送失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <button v-if="!isOpen" class="fab" @click="open" title="意见反馈">💬</button>

  <div v-else class="panel">
    <div class="panel-header">
      <span class="panel-title">意见反馈</span>
      <button class="close-btn" @click="close" title="关闭">✕</button>
    </div>
    <form class="panel-body" @submit.prevent="submit">
      <textarea
        v-model="message"
        class="input textarea"
        placeholder="遇到的问题或建议…"
        :maxlength="MAX_LEN"
        rows="5"
      ></textarea>
      <div class="char-count" :class="{ warn: remaining < 100 }">{{ remaining }}</div>
      <input
        v-model="email"
        type="email"
        class="input"
        placeholder="邮箱（选填，方便回复你）"
      />
      <input v-model="gotcha" type="text" name="_gotcha" class="hp" tabindex="-1" autocomplete="off" />
      <button type="submit" class="submit-btn" :disabled="submitting">
        {{ submitting ? '发送中…' : '发送' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: var(--accent);
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  transition: transform 0.2s;
}
.fab:hover {
  transform: scale(1.08);
}

.panel {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 320px;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-secondary);
}
.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}
.close-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
}
.close-btn:hover {
  color: var(--text-primary);
}

.panel-body {
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 13px;
  font-family: inherit;
  box-sizing: border-box;
}
.input:focus {
  outline: none;
  border-color: var(--accent);
}
.textarea {
  resize: vertical;
  min-height: 90px;
}

.char-count {
  text-align: right;
  font-size: 11px;
  color: var(--text-muted);
  margin-top: -6px;
}
.char-count.warn {
  color: var(--warning);
}

.hp {
  position: absolute;
  left: -9999px;
  opacity: 0;
  height: 0;
  pointer-events: none;
}

.submit-btn {
  padding: 9px;
  border: none;
  border-radius: var(--radius);
  background: var(--accent);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}
.submit-btn:hover:not(:disabled) {
  background: var(--accent-hover);
}
.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .panel {
    right: 12px;
    left: 12px;
    width: auto;
    bottom: 12px;
  }
  .fab {
    right: 16px;
    bottom: 16px;
  }
}
</style>

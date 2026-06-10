<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStorage } from '@vueuse/core'

const height = useStorage('bmi-height', '')
const weight = useStorage('bmi-weight', '')

const result = computed(() => {
  const h = parseFloat(height.value)
  const w = parseFloat(weight.value)
  if (!h || !w || h <= 0 || w <= 0) return null
  const bmi = w / ((h / 100) ** 2)
  const rounded = Math.round(bmi * 10) / 10
  let category = ''
  let color = ''
  if (bmi < 18.5) { category = '偏瘦'; color = 'var(--warning)' }
  else if (bmi < 24) { category = '正常'; color = 'var(--success)' }
  else if (bmi < 28) { category = '偏胖'; color = 'var(--warning)' }
  else if (bmi < 32) { category = '肥胖'; color = 'var(--error)' }
  else { category = '重度肥胖'; color = 'var(--error)' }
  const idealMin = Math.round(18.5 * ((h / 100) ** 2) * 10) / 10
  const idealMax = Math.round(23.9 * ((h / 100) ** 2) * 10) / 10
  return { bmi: rounded, category, color, idealMin, idealMax }
})

function getUrlParams() {
  // History mode: read from search
  return new URLSearchParams(window.location.search)
}

function clearAll() {
  height.value = ''
  weight.value = ''
}

onMounted(() => {
  const params = getUrlParams()
  if (params.get('height')) height.value = params.get('height')
  if (params.get('weight')) weight.value = params.get('weight')
})
</script>

<template>
  <div class="tool-page">
    <h1>⚖️ BMI 计算器</h1>
    <div class="card" style="margin-bottom: 16px; padding: 16px; font-size: 13px; color: var(--text-secondary); line-height: 1.8">
      <strong style="color: var(--text-primary)">中国成人 BMI 标准：</strong><br>
      偏瘦 &lt; 18.5 | 正常 18.5 ~ 23.9 | 偏胖 24 ~ 27.9 | 肥胖 28 ~ 31.9 | 重度肥胖 ≥ 32
    </div>
    <div class="tool-section">
      <div class="tool-panel card">
        <h3>输入信息</h3>
        <label style="font-size: 13px; color: var(--text-secondary); display: block; margin-bottom: 4px">身高（厘米）</label>
        <input v-model="height" class="input" type="number" placeholder="例如：175" min="1" max="300">
        <label style="font-size: 13px; color: var(--text-secondary); display: block; margin: 12px 0 4px">体重（千克）</label>
        <input v-model="weight" class="input" type="number" placeholder="例如：70" min="1" max="500">
        <div class="tool-actions" style="margin-top: 16px">
          <button class="btn btn-secondary" @click="clearAll">清空</button>
        </div>
      </div>
      <div class="tool-panel">
        <h3>计算结果</h3>
        <div v-if="result" class="result-card">
          <div class="bmi-value" :style="{ color: result.color }">{{ result.bmi }}</div>
          <div class="bmi-category" :style="{ color: result.color }">{{ result.category }}</div>
          <div class="bmi-detail">
            理想体重范围：{{ result.idealMin }} ~ {{ result.idealMax }} kg
          </div>
        </div>
        <div v-else class="empty-tip">
          请输入身高和体重查看结果
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.result-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 32px;
  text-align: center;
}
.bmi-value {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 8px;
}
.bmi-category {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
}
.bmi-detail {
  font-size: 14px;
  color: var(--text-secondary);
}
.empty-tip {
  color: var(--text-muted);
  text-align: center;
  padding: 60px 20px;
  font-size: 14px;
}
</style>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getUrlParams } from '../../utils/urlParams'
import { useStorage } from '@vueuse/core'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

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
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h1>⚖️ BMI 计算器</h1>
      <AiHelpPanel
        title="BMI 计算器"
        desc="根据身高体重计算身体质量指数（中国成人标准）"
        :params="[
          { name: 'height', desc: '身高（厘米）', required: true, example: '175' },
          { name: 'weight', desc: '体重（千克）', required: true, example: '70' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
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
    <div class="card" style="margin-top: 20px; padding: 16px; font-size: 13px; color: var(--text-secondary); line-height: 1.8">
      <p style="margin-bottom:8px;color:var(--text-primary)"><strong>BMI（身体质量指数）= 体重(kg) ÷ 身高²(m²)</strong></p>
      <p style="margin-bottom:8px">BMI 是目前国际上常用的衡量人体胖瘦程度及是否健康的标准，适用于成年人群（18-65岁）。</p>
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead>
          <tr style="border-bottom:1px solid var(--border)">
            <th style="text-align:left;padding:4px">分类</th>
            <th style="text-align:left;padding:4px">BMI 范围</th>
            <th style="text-align:left;padding:4px">健康风险</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="padding:4px;color:#f59e0b">偏瘦</td><td style="padding:4px">&lt; 18.5</td><td style="padding:4px">营养不良、免疫力下降风险</td></tr>
          <tr style="background:rgba(34,197,94,0.05)"><td style="padding:4px;color:#22c55e">正常</td><td style="padding:4px">18.5 ~ 23.9</td><td style="padding:4px">健康范围，慢性病风险最低</td></tr>
          <tr><td style="padding:4px;color:#f59e0b">偏胖</td><td style="padding:4px">24 ~ 27.9</td><td style="padding:4px">高血压、糖尿病风险开始增加</td></tr>
          <tr style="background:rgba(239,68,68,0.05)"><td style="padding:4px;color:#ef4444">肥胖</td><td style="padding:4px">28 ~ 31.9</td><td style="padding:4px">心血管疾病风险显著升高</td></tr>
          <tr style="background:rgba(239,68,68,0.1)"><td style="padding:4px;color:#ef4444">重度肥胖</td><td style="padding:4px">≥ 32</td><td style="padding:4px">多种并发症风险，建议就医</td></tr>
        </tbody>
      </table>
      <p style="margin-top:8px;font-size:11px;color:var(--text-muted)">* 中国成人标准（WS/T 428-2013），不适合运动员、孕妇、未成年人等特殊人群</p>
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

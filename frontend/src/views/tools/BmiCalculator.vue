<script setup>
import { ref, computed } from 'vue'
import * as bmiLogic from '../../logic/bmi'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const weight = ref(65)
const height = ref(170)
const result = ref(null)
const error = ref('')

const displayResult = computed(() => {
  if (!result.value) return null
  const bmi = parseFloat(result.value.bmi)
  let color = ''
  if (bmi < 18.5) color = 'var(--warning)'
  else if (bmi < 24) color = 'var(--success)'
  else if (bmi < 28) color = 'var(--warning)'
  else color = 'var(--error)'
  const h = height.value / 100
  const idealMin = (18.5 * h * h).toFixed(1)
  const idealMax = (23.9 * h * h).toFixed(1)
  return { ...result.value, color, idealMin, idealMax }
})

function calculate() {
  try {
    result.value = bmiLogic.calculate(weight.value, height.value)
    error.value = ''
  } catch (e) {
    error.value = e.message
    result.value = null
  }
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>⚖️ BMI 计算器</h1>
      <AiHelpPanel
        title="BMI 计算器"
        desc="身体质量指数计算"
        :params="[
          { name: 'weight', desc: '体重 (kg)', required: true, example: '65' },
          { name: 'height', desc: '身高 (cm)', required: true, example: '170' }
        ]"
      />
    </div>
    <div class="tool-section">
      <div class="tool-panel card">
        <div class="config-row">
          <label>体重: {{ weight }} kg</label>
          <input v-model.number="weight" type="range" min="30" max="200" class="range-input">
        </div>
        <div class="config-row">
          <label>身高: {{ height }} cm</label>
          <input v-model.number="height" type="range" min="100" max="250" class="range-input">
        </div>
        <button class="btn" @click="calculate">计算</button>
      </div>
      <div class="tool-panel">
        <div v-if="displayResult" class="result-card">
          <div class="bmi-value" :style="{ color: displayResult.color }">{{ displayResult.bmi }}</div>
          <div class="bmi-category" :style="{ color: displayResult.color }">{{ displayResult.category }}</div>
          <div class="bmi-detail">
            理想体重范围：{{ displayResult.idealMin }} ~ {{ displayResult.idealMax }} kg
          </div>
        </div>
        <div v-else-if="error" class="error-msg">❌ {{ error }}</div>
        <div v-else class="empty-tip">请输入身高和体重查看结果</div>
      </div>
    </div>

    <div class="card bmi-info">
      <p class="bmi-formula">BMI（身体质量指数）= 体重(kg) ÷ 身高²(m²)</p>
      <p class="bmi-desc">BMI 是目前国际上常用的衡量人体胖瘦程度及是否健康的标准，适用于成年人群（18-65岁）。</p>
      <table class="bmi-table">
        <thead>
          <tr>
            <th>分类</th>
            <th>BMI 范围</th>
            <th>健康风险</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="tag warning">偏瘦</td>
            <td>&lt; 18.5</td>
            <td>营养不良、免疫力下降风险</td>
          </tr>
          <tr>
            <td class="tag success">正常</td>
            <td>18.5 ~ 23.9</td>
            <td>健康范围，慢性病风险最低</td>
          </tr>
          <tr>
            <td class="tag warning">超重</td>
            <td>24 ~ 27.9</td>
            <td>高血压、糖尿病风险开始增加</td>
          </tr>
          <tr>
            <td class="tag error">肥胖</td>
            <td>≥ 28</td>
            <td>心血管疾病风险显著升高</td>
          </tr>
        </tbody>
      </table>
      <p class="bmi-note">* 中国成人标准（WS/T 428-2013），不适合运动员、孕妇、未成年人等特殊人群。</p>
    </div>
  </div>
</template>

<style scoped>
.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.config-row { margin-bottom: 16px; }
.config-row label { display: block; font-size: 13px; color: var(--text-secondary); margin-bottom: 4px; }
.range-input { width: 100%; }
.result-card { background: var(--bg-secondary); padding: 20px; border-radius: var(--radius); text-align: center; }
.bmi-value { font-size: 48px; font-weight: 700; color: var(--accent); }
.bmi-category { font-size: 18px; color: var(--text-primary); margin-top: 4px; }
.bmi-detail { font-size: 14px; color: var(--text-secondary); margin-top: 12px; }
.empty-tip { color: var(--text-muted); text-align: center; padding: 20px; }
.error-msg { color: var(--error); padding: 10px; }

.bmi-info {
  margin-top: 20px;
  padding: 20px;
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-secondary);
}
.bmi-formula {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}
.bmi-desc {
  margin-bottom: 16px;
}
.bmi-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  margin-bottom: 12px;
}
.bmi-table th,
.bmi-table td {
  text-align: left;
  padding: 8px;
  border-bottom: 1px solid var(--border);
}
.bmi-table th {
  color: var(--text-primary);
}
.tag {
  font-weight: 600;
}
.tag.warning { color: var(--warning); }
.tag.success { color: var(--success); }
.tag.error { color: var(--error); }
.bmi-note {
  font-size: 12px;
  color: var(--text-muted);
}

@media (max-width: 600px) {
  .tool-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>

<script setup>
import { ref, computed } from 'vue'
import { useStorage } from '@vueuse/core'
import { calcGrossMargin } from '../../logic/grossMargin.js'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const cost = useStorage('gross-margin-cost', 12)
const price = useStorage('gross-margin-price', 28)

const result = computed(() => calcGrossMargin(cost.value, price.value))

const rateText = computed(() => {
  const r = result.value
  if (!r.valid) return '—'
  return `${r.grossMarginRate.toFixed(2)}%`
})

const rateClass = computed(() => {
  const r = result.value
  if (!r.valid) return 'neutral'
  if (r.negative) return 'negative'
  if (r.grossMarginRate < 30) return 'low'
  if (r.grossMarginRate >= 70) return 'high'
  return 'ok'
})

const rateHint = computed(() => {
  const r = result.value
  if (!r.valid) return '请先填写售价'
  if (r.negative) return '亏损：毛利为负'
  if (r.grossMarginRate < 30) return '偏低：盈利空间较小'
  if (r.grossMarginRate >= 70) return '健康：毛利率优秀'
  return '正常：盈利空间合理'
})
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>💰 毛利率计算</h1>
      <AiHelpPanel
        title="毛利率计算"
        desc="输入食材成本与售价，自动给出计算过程并显示毛利率。"
        :params="[
          { name: 'cost', desc: '食材成本（元）', required: true, example: '12' },
          { name: 'price', desc: '售价（元）', required: true, example: '28' }
        ]"
      />
    </div>

    <div class="gm-layout">
      <div class="card gm-input-panel">
        <div class="config-row">
          <label for="gm-cost">食材成本（元）</label>
          <input
            id="gm-cost"
            v-model.number="cost"
            class="input"
            type="number"
            min="0"
            step="0.01"
            placeholder="请输入食材成本"
          >
        </div>
        <div class="config-row">
          <label for="gm-price">售价（元）</label>
          <input
            id="gm-price"
            v-model.number="price"
            class="input"
            type="number"
            min="0"
            step="0.01"
            placeholder="请输入售价"
          >
        </div>
        <p class="gm-tip">计算结果基于录入成本，仅供参考</p>
      </div>

      <div class="gm-result-panel">
        <div v-if="!result.valid" class="empty-tip card">
          请填写售价，输入后自动计算毛利率
        </div>

        <template v-else>
          <div class="card gm-rate-card" :class="rateClass">
            <div class="gm-rate-label">毛利率</div>
            <div class="gm-rate-value">{{ rateText }}</div>
            <div class="gm-rate-hint">{{ rateHint }}</div>
          </div>

          <div class="card gm-steps">
            <div class="gm-steps-title">计算过程</div>
            <div v-for="step in result.steps" :key="step.label" class="gm-step">
              <span class="gm-step-label">{{ step.label }}</span>
              <span class="gm-step-formula">{{ step.formula }}</span>
              <span class="gm-step-result">
                = {{ step.result.toFixed(2) }} {{ step.unit }}
              </span>
            </div>
          </div>

          <div v-if="result.warning" class="gm-warning">⚠️ {{ result.warning }}</div>
        </template>
      </div>
    </div>

    <div class="card gm-info">
      <p class="gm-formula">毛利率 = 毛利 ÷ 售价 × 100% =（售价 − 成本）÷ 售价 × 100%</p>
      <p class="gm-desc">
        毛利率反映扣除原材料成本后的盈利空间。餐饮行业常见毛利率约 50% ~ 70%，成本占比越高毛利率越低。
      </p>
    </div>
  </div>
</template>

<style scoped>
.tool-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.empty-tip {
  color: var(--text-muted);
  text-align: center;
  padding: 40px 20px;
}

.gm-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
}

.gm-input-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-row label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.gm-tip {
  font-size: 12px;
  color: var(--text-muted);
}

.gm-result-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.gm-rate-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px;
}

.gm-rate-card.ok { border-color: var(--success); }
.gm-rate-card.high { border-color: var(--success); }
.gm-rate-card.low { border-color: var(--warning); }
.gm-rate-card.negative { border-color: var(--error); }
.gm-rate-card.neutral { border-color: var(--border); }

.gm-rate-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.gm-rate-value {
  font-size: 42px;
  font-weight: 700;
  line-height: 1.1;
}

.gm-rate-card.ok .gm-rate-value,
.gm-rate-card.high .gm-rate-value { color: var(--success); }
.gm-rate-card.low .gm-rate-value { color: var(--warning); }
.gm-rate-card.negative .gm-rate-value { color: var(--error); }
.gm-rate-card.neutral .gm-rate-value { color: var(--text-primary); }

.gm-rate-hint {
  font-size: 13px;
  color: var(--text-muted);
}

.gm-steps {
  padding: 16px 20px;
}

.gm-steps-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.gm-step {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px dashed var(--border);
  font-size: 14px;
  flex-wrap: wrap;
}

.gm-step:last-child {
  border-bottom: none;
}

.gm-step-label {
  flex-shrink: 0;
  font-weight: 500;
  color: var(--text-primary);
}

.gm-step-formula {
  color: var(--text-secondary);
}

.gm-step-result {
  color: var(--accent);
  font-weight: 600;
}

.gm-warning {
  padding: 12px 14px;
  border-radius: var(--radius);
  background: rgba(239, 68, 68, 0.1);
  color: var(--error);
  font-size: 13px;
}

.gm-info {
  margin-top: 20px;
}

.gm-formula {
  font-weight: 500;
  margin-bottom: 6px;
}

.gm-desc {
  color: var(--text-secondary);
  font-size: 13px;
}

@media (max-width: 768px) {
  .gm-layout {
    grid-template-columns: 1fr;
  }
}
</style>

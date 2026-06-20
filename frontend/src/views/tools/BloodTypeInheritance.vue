<script setup>
import { ref, onMounted } from 'vue'
import { useStorage } from '@vueuse/core'
import { useToast } from '../../composables/useToast'
import { getUrlParams } from '../../utils/urlParams'
import { calculateInheritance } from '../../logic/bloodType'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const aboOptions = ['A', 'B', 'AB', 'O']
const rhOptions = [
  { value: '', label: '不指定' },
  { value: '+', label: 'Rh 阳性 (+)' },
  { value: '-', label: 'Rh 阴性 (-)' }
]

const fatherAbo = useStorage('blood-father-abo', 'A')
const fatherRh = useStorage('blood-father-rh', '')
const motherAbo = useStorage('blood-mother-abo', 'B')
const motherRh = useStorage('blood-mother-rh', '')

const result = ref(null)
const toast = useToast()

function compute() {
  try {
    const father = `${fatherAbo.value}${fatherRh.value}`
    const mother = `${motherAbo.value}${motherRh.value}`
    result.value = calculateInheritance(father, mother)
  } catch (e) {
    toast.error(e.message)
    result.value = null
  }
}

onMounted(() => {
  const params = getUrlParams()
  if (params.get('parent1')) {
    const p1 = parseBloodTypeParam(params.get('parent1'))
    if (p1) {
      fatherAbo.value = p1.abo
      fatherRh.value = p1.rh
    }
  }
  if (params.get('parent2')) {
    const p2 = parseBloodTypeParam(params.get('parent2'))
    if (p2) {
      motherAbo.value = p2.abo
      motherRh.value = p2.rh
    }
  }
  if (params.get('auto') === '1') compute()
})

/**
 * Parse a URL blood type parameter into ABO and Rh components.
 * @param {string} value
 * @returns {{abo: string, rh: string}|null}
 */
function parseBloodTypeParam(value) {
  const text = String(value || '').toUpperCase().trim()
  const aboMatch = text.match(/^(A|B|AB|O)/)
  if (!aboMatch) return null
  const abo = aboMatch[1]
  const rhMatch = text.slice(abo.length).match(/^(\+|\-)/)
  return { abo, rh: rhMatch ? rhMatch[1] : '' }
}

/**
 * Format a probability as a percentage string.
 * @param {number} p
 * @returns {string}
 */
function formatPercent(p) {
  return `${(p * 100).toFixed(p === 0.75 ? 1 : p === 0.5 ? 0 : p === 0.25 ? 0 : p === 1 ? 0 : 1)}%`
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>🩸 血型遗传规律</h1>
      <AiHelpPanel
        title="血型遗传规律"
        desc="根据父母 ABO 与 Rh 血型，推算子女可能的血型及概率"
        api-tool="blood_type"
        :params="[
          { name: 'parent1', desc: '父亲血型，例如 A 或 AB+', required: false, example: 'A' },
          { name: 'parent2', desc: '母亲血型，例如 B 或 O-', required: false, example: 'B' },
          { name: 'auto', desc: '是否自动计算（填 1）', required: false, example: '1' }
        ]"
      />
    </div>

    <div class="tool-section">
      <div class="tool-panel card">
        <h3>父母血型</h3>
        <div class="parent-row">
          <div class="parent-block">
            <label>父亲</label>
            <div class="abo-rh">
              <select v-model="fatherAbo" class="input abo-input">
                <option v-for="abo in aboOptions" :key="abo" :value="abo">{{ abo }} 型</option>
              </select>
              <select v-model="fatherRh" class="input rh-input">
                <option v-for="opt in rhOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
          </div>
          <div class="parent-block">
            <label>母亲</label>
            <div class="abo-rh">
              <select v-model="motherAbo" class="input abo-input">
                <option v-for="abo in aboOptions" :key="abo" :value="abo">{{ abo }} 型</option>
              </select>
              <select v-model="motherRh" class="input rh-input">
                <option v-for="opt in rhOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
          </div>
        </div>
        <div class="tool-actions">
          <button class="btn" @click="compute">计算</button>
        </div>
        <p class="note">
          注：采用标准简化模型（A/B 视为杂合子，Rh+ 视为杂合子 Dd），结果反映常见教材概率。
        </p>
      </div>

      <div class="tool-panel card">
        <h3>结果</h3>
        <div v-if="result" class="result-block">
          <p class="explanation">{{ result.explanation }}</p>

          <div class="result-section">
            <span class="result-label">ABO 血型概率</span>
            <div class="probability-list">
              <div
                v-for="item in result.abo"
                :key="item.type"
                class="probability-item"
              >
                <span class="type-badge abo">{{ item.type }} 型</span>
                <div class="probability-bar-wrap">
                  <div class="probability-bar" :style="{ width: `${item.probability * 100}%` }"></div>
                </div>
                <span class="probability-text">{{ formatPercent(item.probability) }}</span>
              </div>
            </div>
          </div>

          <div v-if="result.rh" class="result-section">
            <span class="result-label">Rh 血型概率</span>
            <div class="probability-list">
              <div
                v-for="item in result.rh"
                :key="item.type"
                class="probability-item"
              >
                <span class="type-badge rh">{{ item.type === '+' ? '阳性' : '阴性' }}</span>
                <div class="probability-bar-wrap">
                  <div class="probability-bar" :style="{ width: `${item.probability * 100}%` }"></div>
                </div>
                <span class="probability-text">{{ formatPercent(item.probability) }}</span>
              </div>
            </div>
          </div>

          <div v-if="result.full" class="result-section">
            <span class="result-label">组合血型概率</span>
            <div class="probability-list">
              <div
                v-for="item in result.full"
                :key="item.type"
                class="probability-item"
              >
                <span class="type-badge full">{{ item.type }}</span>
                <div class="probability-bar-wrap">
                  <div class="probability-bar" :style="{ width: `${item.probability * 100}%` }"></div>
                </div>
                <span class="probability-text">{{ formatPercent(item.probability) }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          选择父母血型后点击“计算”
        </div>
      </div>
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
.parent-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
.parent-block label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}
.abo-rh {
  display: flex;
  gap: 10px;
}
.abo-input {
  flex: 1;
}
.rh-input {
  width: 130px;
  flex-shrink: 0;
}
.tool-actions {
  margin-top: 8px;
}
.note {
  margin-top: 12px;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.5;
}
.result-block {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.explanation {
  margin: 0;
  font-size: 15px;
  color: var(--text-primary);
  line-height: 1.6;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius);
}
.result-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.result-label {
  font-size: 13px;
  color: var(--text-secondary);
}
.probability-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.probability-item {
  display: flex;
  align-items: center;
  gap: 12px;
}
.type-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  padding: 6px 0;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 500;
  flex-shrink: 0;
}
.type-badge.abo {
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
}
.type-badge.rh {
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;
}
.type-badge.full {
  background: rgba(139, 92, 246, 0.12);
  color: #7c3aed;
}
.probability-bar-wrap {
  flex: 1;
  height: 10px;
  background: var(--bg-tertiary);
  border-radius: 5px;
  overflow: hidden;
}
.probability-bar {
  height: 100%;
  background: var(--accent);
  border-radius: 5px;
  transition: width 0.3s ease;
}
.probability-text {
  width: 48px;
  text-align: right;
  font-size: 14px;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}
.empty-state {
  color: var(--text-muted);
  padding: 40px;
  text-align: center;
  background: var(--bg-secondary);
  border-radius: var(--radius);
  border: 1px dashed var(--border);
}

@media (max-width: 768px) {
  .parent-row {
    grid-template-columns: 1fr;
  }
  .abo-rh {
    flex-direction: row;
  }
  .probability-item {
    gap: 8px;
  }
  .type-badge {
    width: 56px;
    font-size: 13px;
  }
}
</style>

<script setup>
import { ref } from 'vue'
import * as bmiLogic from '../../logic/bmi'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const weight = ref(65)
const height = ref(170)
const result = ref(null)
const error = ref('')

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
          <input type="range" v-model.number="weight" min="30" max="200" class="range-input">
        </div>
        <div class="config-row">
          <label>身高: {{ height }} cm</label>
          <input type="range" v-model.number="height" min="100" max="250" class="range-input">
        </div>
        <button class="btn" @click="calculate">计算</button>
      </div>
      <div class="tool-panel">
        <div v-if="result" class="result-card">
          <div class="bmi-value">{{ result.bmi }}</div>
          <div class="bmi-category">{{ result.category }}</div>
        </div>
        <div v-if="error" class="error-msg">❌ {{ error }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.config-row { margin-bottom: 16px; }
.config-row label { display: block; font-size: 13px; color: var(--text-secondary); margin-bottom: 4px; }
.range-input { width: 100%; }
.result-card { background: var(--bg-secondary); padding: 20px; border-radius: var(--radius); text-align: center; }
.bmi-value { font-size: 48px; font-weight: 700; color: var(--accent); }
.bmi-category { font-size: 18px; color: var(--text-primary); }
.error-msg { color: var(--error); padding: 10px; }
</style>

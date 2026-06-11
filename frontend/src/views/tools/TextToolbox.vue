<script setup>
import { ref, computed } from 'vue'
import { useStorage } from '@vueuse/core'
import { useTool } from '../../composables/useTool'
import * as textLogic from '../../logic/text-toolbox'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const findText = useStorage('toolbox-find', '')
const replaceText = useStorage('toolbox-replace', '')
const useRegex = useStorage('toolbox-regex', false)
const chaining = ref(false)
const originalInput = ref('')

const actionMap = {
  upper: textLogic.toUpper,
  lower: textLogic.toLower,
  capitalize: textLogic.toCapitalize,
  swapcase: textLogic.swapCase,
  dedup: textLogic.removeDuplicateLines,
  noempty: textLogic.removeEmptyLines,
  trim: textLogic.trimLines,
  mergeempty: textLogic.mergeEmptyLines,
  sortasc: textLogic.sortAsc,
  sortdesc: textLogic.sortDesc,
  reverselines: textLogic.reverseLines,
  reversechars: textLogic.reverseChars,
  addlinenum: textLogic.addLineNumbers,
  dellinenum: textLogic.removeLineNumbers,
  tolist: textLogic.toList,
}

const {
  input,
  output,
  error,
  autoMode,
  copyText,
  clearAll: baseClear,
  loadExample,
  copy
} = useTool({
  storageKey: 'toolbox',
  processor: (val) => {
    // If an action was specified in URL, it might have been applied.
    // However, useTool processor is usually for "auto" mode.
    // For toolbox, we might not want an "auto" action besides maybe just returning input.
    return output.value || val
  },
  paramMapping: {
    text: { ref: ref('') },
    action: { 
      ref: ref(''), 
      transform: (act) => {
        if (actionMap[act]) {
          // Apply action immediately if found in URL
          setTimeout(() => {
            output.value = actionMap[act](input.value)
          }, 100)
        }
        return act
      }
    }
  },
  example: `apple\nbanana\nApple\ncherry\nbanana\n  hello world  `
})

const stats = computed(() => textLogic.getStats(input.value))

function runAction(fn) {
  if (!chaining.value) {
    originalInput.value = input.value
  }
  // If we already have output and we're chaining, use output as next input
  const currentSource = output.value || input.value
  output.value = fn(currentSource)
  chaining.value = true
}

function resetChain() {
  input.value = originalInput.value || input.value
  output.value = ''
  chaining.value = false
}

function handleFindReplace() {
  try {
    output.value = textLogic.findReplace(input.value, findText.value, replaceText.value, useRegex.value)
    error.value = ''
  } catch (e) {
    error.value = e.message
  }
}

function clearAll() {
  baseClear()
  chaining.value = false
  originalInput.value = ''
}

const actions = [
  { name: '转大写', key: 'upper' },
  { name: '转小写', key: 'lower' },
  { name: '首字母大写', key: 'capitalize' },
  { name: '大小写翻转', key: 'swapcase' },
  { name: '去重行', key: 'dedup' },
  { name: '去空行', key: 'noempty' },
  { name: '去首尾空格', key: 'trim' },
  { name: '合并空行', key: 'mergeempty' },
  { name: '升序排序', key: 'sortasc' },
  { name: '降序排序', key: 'sortdesc' },
  { name: '反转行序', key: 'reverselines' },
  { name: '字符翻转', key: 'reversechars' },
  { name: '添加行号', key: 'addlinenum' },
  { name: '删除行号', key: 'dellinenum' },
  { name: '转列表', key: 'tolist' },
]
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>🧰 文本处理工具箱</h1>
      <AiHelpPanel
        title="文本处理工具箱"
        desc="提供大小写转换、去重去空行、排序翻转、查找替换等 16+ 种文本处理功能"
        :params="[
          { name: 'text', desc: '要处理的文本', required: true, example: 'Hello World' },
          { name: 'action', desc: '操作：upper/lower/capitalize/swapcase/dedup/noempty/trim/mergeempty/sortasc/sortdesc/reverselines/reversechars/addlinenum/dellinenum/tolist', required: false, example: 'upper' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>
    <div class="stats-bar card">
      <span>字符: <strong>{{ stats.chars }}</strong></span>
      <span>单词: <strong>{{ stats.words }}</strong></span>
      <span>行数: <strong>{{ stats.lines }}</strong></span>
      <span>字节: <strong>{{ stats.bytes }}</strong></span>
    </div>
    <div class="tool-section">
      <div class="tool-panel">
        <h3>输入</h3>
        <textarea v-model="input" class="textarea" placeholder="输入文本..." rows="12"></textarea>
        <div v-if="chaining" class="chain-info">
          🔗 复合模式：每次操作基于上次结果
          <button class="btn btn-sm btn-secondary" @click="resetChain">重置</button>
        </div>
        <div class="actions-grid">
          <button v-for="act in actions" :key="act.key" class="btn btn-sm btn-secondary" @click="runAction(actionMap[act.key])">
            {{ act.name }}
          </button>
        </div>
        <div class="card find-replace">
          <div class="panel-label">查找替换</div>
          <div class="replace-inputs">
            <input v-model="findText" class="input" placeholder="查找">
            <input v-model="replaceText" class="input" placeholder="替换为">
          </div>
          <div class="replace-opts">
            <label class="checkbox-label">
              <input type="checkbox" v-model="useRegex"> 使用正则
            </label>
            <button class="btn btn-sm" @click="handleFindReplace">执行替换</button>
          </div>
        </div>
      </div>
      <div class="tool-panel">
        <h3>输出</h3>
        <textarea v-model="output" class="textarea" placeholder="处理结果..." rows="20" readonly></textarea>
        <button class="btn btn-sm" @click="copy" style="align-self:flex-start">{{ copyText }}</button>
      </div>
    </div>
    <div class="tool-actions" style="margin-top:10px">
      <button class="btn btn-secondary" @click="clearAll">清空</button>
      <button class="btn btn-secondary" @click="loadExample">示例</button>
    </div>
    <div v-if="error" class="error-msg">❌ {{ error }}</div>
  </div>
</template>

<style scoped>
.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.stats-bar {
  margin-bottom: 16px;
  padding: 10px 16px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 13px;
  color: var(--text-secondary);
}
.stats-bar strong {
  color: var(--text-primary);
}
.chain-info {
  font-size: 12px;
  color: var(--accent);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 6px;
  margin-top: 10px;
}
.find-replace {
  margin-top: 12px;
  padding: 12px;
}
.panel-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.replace-inputs {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.replace-opts {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
}
.error-msg {
  color: var(--error);
  background: rgba(239, 68, 68, 0.1);
  padding: 10px 16px;
  border-radius: var(--radius);
  margin-top: 10px;
  font-size: 14px;
}
</style>

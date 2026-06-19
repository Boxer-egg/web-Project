<script setup>
import { ref, watch, onMounted } from 'vue'
import { useStorage } from '@vueuse/core'
import { getUrlParams } from '../../utils/urlParams'
import { search } from '../../data/zipPlateArea'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const type = useStorage('zpa-type', 'zip')
const query = useStorage('zpa-query', '')
const results = ref([])

const types = [
  { key: 'zip', label: '邮编', placeholder: '输入邮编，如 518000' },
  { key: 'plate', label: '车牌', placeholder: '输入车牌前缀，如 粤B' },
  { key: 'area', label: '区号', placeholder: '输入电话区号，如 0755' }
]

function doSearch() {
  results.value = search(type.value, query.value)
}

watch([type, query], () => {
  doSearch()
})

onMounted(() => {
  const params = getUrlParams()
  if (params.get('type') && types.some(t => t.key === params.get('type'))) {
    type.value = params.get('type')
  }
  if (params.get('q')) {
    query.value = params.get('q')
  }
  doSearch()
})

function clearAll() {
  query.value = ''
  results.value = []
}

const typeLabel = {
  zip: '邮编',
  plate: '车牌前缀',
  area: '电话区号'
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>📮 邮编 / 车牌 / 区号查询</h1>
      <AiHelpPanel
        title="邮编/车牌/区号查询"
        desc="离线查询中国邮编、车牌归属地、电话区号"
        api-tool="zip_plate_area"
        :params="[
          { name: 'type', desc: '查询类型：zip / plate / area', required: true, example: 'plate' },
          { name: 'q', desc: '查询关键词', required: true, example: '粤B' }
        ]"
      />
    </div>

    <div class="card config-bar">
      <div class="type-btns">
        <button
          v-for="t in types"
          :key="t.key"
          class="btn btn-sm"
          :class="{ 'btn-secondary': type !== t.key }"
          @click="type = t.key"
        >
          {{ t.label }}
        </button>
      </div>
      <div class="search-row">
        <input
          v-model="query"
          class="input"
          :placeholder="types.find(t => t.key === type)?.placeholder"
          @keyup.enter="doSearch"
        >
        <button class="btn" @click="doSearch">查询</button>
        <button class="btn btn-secondary" @click="clearAll">清空</button>
      </div>
    </div>

    <div class="results card">
      <div class="results-header">
        <span>查询结果</span>
        <span v-if="results.length" class="count">{{ results.length }} 条</span>
      </div>
      <table v-if="results.length" class="result-table">
        <thead>
          <tr>
            <th>{{ typeLabel[type] }}</th>
            <th>省份</th>
            <th>城市</th>
            <th v-if="type === 'zip'">区县</th>
            <th v-if="type === 'plate'">备注</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, i) in results" :key="i">
            <td class="key-cell">{{ type === 'zip' ? item.code : type === 'plate' ? item.prefix : item.code }}</td>
            <td>{{ item.province }}</td>
            <td>{{ item.city }}</td>
            <td v-if="type === 'zip'">{{ item.district || '-' }}</td>
            <td v-if="type === 'plate'">{{ item.note || '-' }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else-if="query.trim()" class="empty-state">未找到匹配结果</div>
      <div v-else class="empty-state">输入关键词开始查询</div>
    </div>
  </div>
</template>

<style scoped>
.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}
.config-bar {
  margin-bottom: 16px;
  padding: 16px;
}
.type-btns {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.search-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.search-row .input {
  flex: 1;
  min-width: 200px;
}
.results {
  padding: 16px;
}
.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  color: var(--text-secondary);
}
.count {
  color: var(--accent);
}
.result-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.result-table th,
.result-table td {
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
}
.result-table th {
  color: var(--text-secondary);
  font-weight: 500;
}
.key-cell {
  color: var(--accent);
  font-family: monospace;
  font-weight: 600;
}
.empty-state {
  color: var(--text-muted);
  padding: 40px;
  text-align: center;
}
</style>

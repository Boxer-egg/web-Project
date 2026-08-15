<script setup>
import { computed } from 'vue'

const props = defineProps({
  balls: { type: Object, required: true },
  baseBalls: { type: Array, required: true },
  lang: { type: String, default: 'cn' },
  selected: { type: String, default: null }
})

const emit = defineEmits(['select'])

function displayName(name) {
  const b = props.balls[name]
  if (!b) return name
  return props.lang === 'en' ? b.name : (b.nameCn || b.name)
}

function shortName(name) {
  const b = props.balls[name]
  if (!b) return name
  const cn = b.nameCn || b.name
  return cn.length > 4 ? cn.slice(0, 4) + '…' : cn
}

function imgUrl(img) {
  return `/images/ballxpit/${img}`
}

/**
 * Build a lookup of base-ball pair -> result ball name.
 * Only includes recipes where both components are base balls.
 */
const pairMap = computed(() => {
  const map = new Map()
  const baseSet = new Set(props.baseBalls)
  for (const ball of Object.values(props.balls)) {
    for (const recipe of ball.recipes || []) {
      const comps = recipe.components
      if (comps.length !== 2) continue
      const [a, b] = comps
      if (!baseSet.has(a) || !baseSet.has(b)) continue
      const key = [a, b].sort().join('|')
      map.set(key, ball.name)
    }
  }
  return map
})

function resultAt(row, col) {
  if (row === col) return null
  const key = [row, col].sort().join('|')
  return pairMap.value.get(key) || null
}

function onCellClick(name) {
  if (name) emit('select', name)
}
</script>

<template>
  <div class="matrix-panel">
    <div class="matrix-scroll">
      <table class="matrix-table">
        <thead>
          <tr>
            <th class="corner-cell"></th>
            <th
              v-for="col in baseBalls"
              :key="col"
              class="col-header"
              :title="displayName(col)"
            >
              <img :src="imgUrl(balls[col].img)" :alt="displayName(col)" class="header-icon" />
              <span class="header-name">{{ shortName(col) }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in baseBalls" :key="row">
            <th class="row-header" :title="displayName(row)">
              <img :src="imgUrl(balls[row].img)" :alt="displayName(row)" class="header-icon" />
              <span class="header-name">{{ shortName(row) }}</span>
            </th>
            <td
              v-for="col in baseBalls"
              :key="col"
              class="matrix-cell"
              :class="{
                'empty': row === col || !resultAt(row, col),
                'has-result': !!resultAt(row, col),
                'selected': resultAt(row, col) === selected
              }"
              @click="onCellClick(resultAt(row, col))"
            >
              <template v-if="row === col">
                <span class="dash">—</span>
              </template>
              <template v-else-if="resultAt(row, col)">
                <img :src="imgUrl(balls[resultAt(row, col)].img)" :alt="displayName(resultAt(row, col))" class="cell-icon" />
                <span class="cell-name">{{ shortName(resultAt(row, col)) }}</span>
              </template>
              <template v-else>
                <span class="dash">—</span>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="matrix-hint">
      提示：表格行 × 列的交叉格显示两颗基础弹珠的合成结果。点击结果可跳转到该弹珠详情。
    </p>
  </div>
</template>

<style scoped>
.matrix-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.matrix-scroll {
  overflow: auto;
  max-height: 70vh;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-secondary);
}
.matrix-table {
  border-collapse: separate;
  border-spacing: 0;
  font-size: 12px;
  min-width: 100%;
}
.corner-cell {
  position: sticky;
  top: 0;
  left: 0;
  z-index: 3;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  border-right: 1px solid var(--border);
  min-width: 80px;
}
.col-header {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  padding: 6px 4px;
  text-align: center;
  min-width: 64px;
  font-weight: 500;
}
.row-header {
  position: sticky;
  left: 0;
  z-index: 2;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  padding: 6px 8px;
  text-align: left;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}
.header-icon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  object-fit: contain;
  background: var(--bg-primary);
}
.header-name {
  display: block;
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.matrix-cell {
  padding: 6px 4px;
  text-align: center;
  border-bottom: 1px solid var(--border);
  border-right: 1px solid var(--border);
  min-width: 64px;
  min-height: 48px;
  vertical-align: middle;
  background: var(--bg-primary);
}
.matrix-cell.empty {
  color: var(--text-muted);
  cursor: default;
}
.matrix-cell.has-result {
  cursor: pointer;
  transition: all 0.15s;
}
.matrix-cell.has-result:hover {
  background: var(--bg-tertiary);
}
.matrix-cell.selected {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}
.cell-icon {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  object-fit: contain;
  background: var(--bg-secondary);
  display: block;
  margin: 0 auto 3px;
}
.cell-name {
  display: block;
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0 auto;
}
.dash {
  color: var(--text-muted);
  font-size: 14px;
}
.matrix-hint {
  color: var(--text-secondary);
  font-size: 13px;
  margin: 0;
}
@media (max-width: 768px) {
  .header-name,
  .cell-name {
    display: none;
  }
  .corner-cell {
    min-width: 40px;
  }
  .row-header {
    padding: 4px;
  }
  .col-header {
    min-width: 40px;
    padding: 4px 2px;
  }
  .matrix-cell {
    min-width: 40px;
    padding: 4px 2px;
  }
  .header-icon {
    width: 24px;
    height: 24px;
  }
  .cell-icon {
    width: 24px;
    height: 24px;
  }
}
</style>

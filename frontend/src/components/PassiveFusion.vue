<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: { type: Object, required: true },
  itemName: { type: String, required: true },
  lang: { type: String, default: 'cn' }
})

function item(name) {
  return props.items[name]
}

function displayName(i) {
  if (!i) return props.itemName
  return props.lang === 'en' ? i.name : (i.nameCn || i.name)
}

function imgUrl(img) {
  return `/images/ballxpit/${img}`
}

function effectDisplay(i) {
  if (!i) return ''
  return props.lang === 'en' ? (i.effect || '') : (i.effectCn || i.effect || '')
}

/**
 * 找出所有以指定道具为结果的融合配方（合成此道具）。
 */
const recipesToCraft = computed(() => {
  const i = item(props.itemName)
  if (!i || !i.recipes) return []
  return i.recipes
})

/**
 * 找出所有以指定道具为材料的融合配方（此道具可参与合成其他道具）。
 */
const recipesUsing = computed(() => {
  const result = []
  for (const i of Object.values(props.items)) {
    if (!i.recipes) continue
    for (const recipe of i.recipes) {
      if (recipe.components.includes(props.itemName)) {
        result.push(recipe)
      }
    }
  }
  return result
})
</script>

<template>
  <div class="fusion-panel">
    <!-- 合成此道具 -->
    <section v-if="recipesToCraft.length" class="fusion-section">
      <h3 class="section-title">
        <span class="section-icon">🔮</span>
        合成 {{ displayName(item(itemName)) }}
        <span class="section-count">{{ recipesToCraft.length }}</span>
      </h3>
      <div class="recipe-list">
        <div
          v-for="(recipe, idx) in recipesToCraft"
          :key="idx"
          class="recipe-card"
        >
          <div class="recipe-components">
            <div
              v-for="component in recipe.components"
              :key="component"
              class="recipe-item"
            >
              <img :src="imgUrl(item(component).img)" :alt="displayName(item(component))" class="recipe-icon" />
              <span class="recipe-name">{{ displayName(item(component)) }}</span>
            </div>
          </div>
          <div class="recipe-arrow">➜</div>
          <div class="recipe-result-block">
            <div class="recipe-result">
              <img :src="imgUrl(item(recipe.result).img)" :alt="displayName(item(recipe.result))" class="recipe-icon" />
              <span class="recipe-name">{{ displayName(item(recipe.result)) }}</span>
            </div>
            <div v-if="effectDisplay(item(recipe.result))" class="recipe-effect">
              {{ effectDisplay(item(recipe.result)) }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 此道具可参与合成 -->
    <section v-if="recipesUsing.length" class="fusion-section">
      <h3 class="section-title">
        <span class="section-icon">🧪</span>
        {{ displayName(item(itemName)) }} 可参与合成
        <span class="section-count">{{ recipesUsing.length }}</span>
      </h3>
      <div class="recipe-list">
        <div
          v-for="(recipe, idx) in recipesUsing"
          :key="idx"
          class="recipe-card"
        >
          <div class="recipe-components">
            <div
              v-for="component in recipe.components"
              :key="component"
              class="recipe-item"
              :class="{ highlight: component === itemName }"
            >
              <img :src="imgUrl(item(component).img)" :alt="displayName(item(component))" class="recipe-icon" />
              <span class="recipe-name">{{ displayName(item(component)) }}</span>
            </div>
          </div>
          <div class="recipe-arrow">➜</div>
          <div class="recipe-result-block">
            <div class="recipe-result">
              <img :src="imgUrl(item(recipe.result).img)" :alt="displayName(item(recipe.result))" class="recipe-icon" />
              <span class="recipe-name">{{ displayName(item(recipe.result)) }}</span>
            </div>
            <div v-if="effectDisplay(item(recipe.result))" class="recipe-effect">
              {{ effectDisplay(item(recipe.result)) }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <div v-if="!recipesToCraft.length && !recipesUsing.length" class="empty">
      该道具暂无合成配方。
    </div>
  </div>
</template>

<style scoped>
.fusion-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.fusion-section {
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px;
}
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: var(--text-primary);
}
.section-icon {
  font-size: 18px;
}
.section-count {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 400;
}
.recipe-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.recipe-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  flex-wrap: wrap;
}
.recipe-components {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 200px;
}
.recipe-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  flex: 1;
  min-width: 140px;
}
.recipe-item.highlight {
  border-color: var(--accent);
  background: var(--bg-tertiary);
}
.recipe-icon {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  background: var(--bg-secondary);
  object-fit: contain;
}
.recipe-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}
.recipe-arrow {
  font-size: 20px;
  color: var(--text-muted);
  padding: 0 8px;
}
.recipe-result {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--bg-tertiary);
  border: 1px solid var(--accent);
  border-radius: var(--radius);
  min-width: 140px;
}
.recipe-result-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 140px;
  flex: 1;
}
.recipe-result-block .recipe-result {
  width: 100%;
}
.recipe-effect {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
  padding: 0 4px;
}
.empty {
  text-align: center;
  color: var(--text-muted);
  padding: 40px 20px;
  background: var(--bg-secondary);
  border: 1px dashed var(--border);
  border-radius: var(--radius);
}
@media (max-width: 768px) {
  .recipe-card {
    flex-direction: column;
    align-items: stretch;
  }
  .recipe-arrow {
    text-align: center;
    transform: rotate(90deg);
  }
  .recipe-components {
    min-width: 0;
    width: 100%;
  }
  .recipe-result {
    width: 100%;
  }
}
</style>

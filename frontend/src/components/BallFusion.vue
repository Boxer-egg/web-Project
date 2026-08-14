<script setup>
import { computed } from 'vue'
import { TAG_LABELS, tagDisplayName } from '../utils/ballxpitTags.js'

const props = defineProps({
  balls: { type: Object, required: true },
  ballName: { type: String, required: true },
  lang: { type: String, default: 'cn' }
})

function ball(name) {
  return props.balls[name]
}

function displayName(b) {
  if (!b) return name
  return props.lang === 'en' ? b.name : (b.nameCn || b.name)
}

function imgUrl(img) {
  return `/images/ballxpit/${img}`
}

function tagDisplay(tag) {
  return tagDisplayName(tag, props.lang)
}

function effectDisplay(b) {
  if (!b) return ''
  return props.lang === 'en' ? (b.effect || '') : (b.effectCn || b.effect || '')
}

/**
 * 找出所有以指定弹珠为结果的融合配方（合成此弹珠）。
 */
const recipesToCraft = computed(() => {
  const b = ball(props.ballName)
  if (!b || !b.recipes) return []
  return b.recipes
})

/**
 * 找出所有以指定弹珠为材料的融合配方（此弹珠可参与合成其他弹珠）。
 */
const recipesUsing = computed(() => {
  const result = []
  for (const b of Object.values(props.balls)) {
    if (!b.recipes) continue
    for (const recipe of b.recipes) {
      if (recipe.components.includes(props.ballName)) {
        result.push(recipe)
      }
    }
  }
  return result
})

function uniqueSortedResults(recipes) {
  const seen = new Set()
  const list = []
  for (const r of recipes) {
    if (!seen.has(r.result)) {
      seen.add(r.result)
      list.push(r.result)
    }
  }
  return list
}
</script>

<template>
  <div class="fusion-panel">
    <!-- 合成此弹珠 -->
    <section v-if="recipesToCraft.length" class="fusion-section">
      <h3 class="section-title">
        <span class="section-icon">🔮</span>
        合成 {{ displayName(ball(ballName)) }}
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
              <img :src="imgUrl(ball(component).img)" :alt="displayName(ball(component))" class="recipe-icon" />
              <span class="recipe-name">{{ displayName(ball(component)) }}</span>
              <div v-if="ball(component).tags.length" class="recipe-tags">
                <span v-for="tag in ball(component).tags" :key="tag" class="mini-tag">{{ tagDisplay(tag) }}</span>
              </div>
            </div>
          </div>
          <div class="recipe-arrow">➜</div>
          <div class="recipe-result">
            <img :src="imgUrl(ball(recipe.result).img)" :alt="displayName(ball(recipe.result))" class="recipe-icon" />
            <span class="recipe-name">{{ displayName(ball(recipe.result)) }}</span>
            <div v-if="ball(recipe.result).tags.length" class="recipe-tags">
              <span v-for="tag in ball(recipe.result).tags" :key="tag" class="mini-tag">{{ tagDisplay(tag) }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 此弹珠可参与合成 -->
    <section v-if="recipesUsing.length" class="fusion-section">
      <h3 class="section-title">
        <span class="section-icon">🧪</span>
        {{ displayName(ball(ballName)) }} 可参与合成
        <span class="section-count">{{ uniqueSortedResults(recipesUsing).length }}</span>
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
              :class="{ highlight: component === ballName }"
            >
              <img :src="imgUrl(ball(component).img)" :alt="displayName(ball(component))" class="recipe-icon" />
              <span class="recipe-name">{{ displayName(ball(component)) }}</span>
              <div v-if="ball(component).tags.length" class="recipe-tags">
                <span v-for="tag in ball(component).tags" :key="tag" class="mini-tag">{{ tagDisplay(tag) }}</span>
              </div>
            </div>
          </div>
          <div class="recipe-arrow">➜</div>
          <div class="recipe-result">
            <img :src="imgUrl(ball(recipe.result).img)" :alt="displayName(ball(recipe.result))" class="recipe-icon" />
            <span class="recipe-name">{{ displayName(ball(recipe.result)) }}</span>
            <div v-if="ball(recipe.result).tags.length" class="recipe-tags">
              <span v-for="tag in ball(recipe.result).tags" :key="tag" class="mini-tag">{{ tagDisplay(tag) }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div v-if="!recipesToCraft.length && !recipesUsing.length" class="empty">
      该弹珠暂无融合配方。
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
.recipe-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-left: 4px;
}
.mini-tag {
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-muted);
  border: 1px solid var(--border);
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

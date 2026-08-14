<script setup>
import { TAG_LABELS, tagDisplayName } from '../utils/ballxpitTags.js'

const props = defineProps({
  balls: { type: Object, required: true },
  nodeName: { type: String, required: true },
  expanded: { type: Array, default: () => [] },
  search: { type: String, default: '' },
  lang: { type: String, default: 'cn' },
  depth: { type: Number, default: 0 }
})

const emit = defineEmits(['toggle', 'select'])

function ball(name) {
  return props.balls[name]
}

function displayName(b) {
  if (!b) return ''
  return props.lang === 'en' ? b.name : (b.nameCn || b.name)
}

function componentName(name) {
  return displayName(ball(name))
}

function imgUrl(img) {
  return `/images/ballxpit/${img}`
}

function hasChildren(b) {
  return b && b.children && b.children.length > 0
}

function isExpanded(name) {
  return props.expanded.includes(name)
}

function matchesSearch(name) {
  if (!props.search.trim()) return true
  const b = ball(name)
  if (!b) return false
  const term = props.search.toLowerCase()
  return (
    b.name.toLowerCase().includes(term) ||
    (b.nameCn || '').toLowerCase().includes(term) ||
    b.tags.some(t => {
      const label = (TAG_LABELS[t] || t).toLowerCase()
      return t.toLowerCase().includes(term) || label.includes(term)
    })
  )
}

function visibleChildren(b) {
  if (!hasChildren(b)) return []
  const term = props.search.trim().toLowerCase()
  if (!term) return b.children
  // If searching, show children that match OR have matching descendants
  return b.children.filter(name => matchesSearch(name) || hasMatchingDescendant(name))
}

function hasMatchingDescendant(name) {
  const b = ball(name)
  if (!b || !hasChildren(b)) return false
  if (b.children.some(c => matchesSearch(c))) return true
  return b.children.some(c => hasMatchingDescendant(c))
}

function onCardClick(name) {
  emit('select', name)
}

function onExpandClick(name, e) {
  e.stopPropagation()
  emit('toggle', name)
}

function tierClass(tier) {
  return `tier-${tier}`
}
</script>

<template>
  <div class="ball-tree">
    <div
      v-for="childName in visibleChildren(ball(nodeName))"
      :key="childName"
      class="tree-branch"
    >
      <div
        class="tree-node"
        :class="{ expanded: isExpanded(childName) }"
        @click="onCardClick(childName)"
      >
        <div class="node-line" :style="{ marginLeft: `${depth * 24}px` }">
          <div class="node-connector" v-if="depth > 0"></div>
          <img :src="imgUrl(ball(childName).img)" :alt="displayName(ball(childName))" class="node-icon" />
          <div class="node-info">
            <div class="node-name">{{ displayName(ball(childName)) }}</div>
            <div class="node-recipe">
              <span
                v-for="(recipe, idx) in ball(childName).recipes"
                :key="idx"
                class="recipe-row"
              >
                {{ recipe.components.map(componentName).join(' + ') }}
              </span>
            </div>
            <div v-if="ball(childName).tags.length" class="node-tags">
              <span v-for="tag in ball(childName).tags" :key="tag" class="tag">{{ tagDisplayName(tag, props.lang) }}</span>
            </div>
          </div>
          <button
            v-if="hasChildren(ball(childName))"
            class="expand-btn"
            :class="{ active: isExpanded(childName) }"
            @click="onExpandClick(childName, $event)"
          >
            {{ isExpanded(childName) ? '收起' : '展开' }}
          </button>
        </div>
      </div>
      <BallTree
        v-if="hasChildren(ball(childName)) && isExpanded(childName)"
        :balls="balls"
        :node-name="childName"
        :expanded="expanded"
        :search="search"
        :lang="lang"
        :depth="depth + 1"
        @toggle="$emit('toggle', $event)"
        @select="$emit('select', $event)"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'BallTree'
}
</script>

<style scoped>
.ball-tree {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.tree-branch {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.tree-node {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.2s;
}
.tree-node:hover {
  border-color: var(--accent);
}
.tree-node.expanded {
  border-color: var(--accent);
  background: var(--bg-tertiary);
}
.node-line {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  position: relative;
}
.node-connector {
  position: absolute;
  left: -12px;
  top: 50%;
  width: 12px;
  height: 2px;
  background: var(--border);
}
.node-icon {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background: var(--bg-primary);
  object-fit: contain;
}
.node-info {
  flex: 1;
  min-width: 0;
}
.node-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}
.node-recipe {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}
.recipe-row {
  display: inline-block;
  margin-right: 8px;
}
.node-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}
.tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  background: var(--bg-primary);
  color: var(--text-muted);
  border: 1px solid var(--border);
}
.expand-btn {
  padding: 4px 10px;
  font-size: 12px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--bg-primary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.expand-btn:hover,
.expand-btn.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}
</style>

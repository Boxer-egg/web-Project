/**
 * YAML ↔ JSON logic using js-yaml.
 */

import yaml from 'js-yaml'

/**
 * Convert YAML text to JSON string.
 * @param {string} text - YAML input text.
 * @param {boolean} compact - Whether to output compact JSON (no indentation).
 * @returns {string} JSON string.
 * @throws {Error} If YAML is invalid.
 */
export function yamlToJson(text, compact = false) {
  if (!text || !text.trim()) return ''
  const doc = yaml.load(text)
  if (doc === undefined || doc === null) return ''
  return compact ? JSON.stringify(doc) : JSON.stringify(doc, null, 2)
}

/**
 * Convert JSON text to YAML string.
 * @param {string} text - JSON input text.
 * @param {boolean} compact - Whether to use compact YAML style (flow style).
 * @returns {string} YAML string.
 * @throws {Error} If JSON is invalid.
 */
export function jsonToYaml(text, compact = false) {
  if (!text || !text.trim()) return ''
  const data = JSON.parse(text)
  if (data === undefined || data === null) return ''
  return yaml.dump(data, {
    indent: 2,
    flowLevel: compact ? 0 : -1,
    noRefs: true
  })
}

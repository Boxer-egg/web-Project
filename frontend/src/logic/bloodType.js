/**
 * Blood type inheritance calculator.
 *
 * Uses the standard simplified Mendelian model where each phenotype maps to a
 * single representative genotype:
 *   A  -> IA i
 *   B  -> IB i
 *   AB -> IA IB
 *   O  -> i i
 *   Rh+ -> D d
 *   Rh- -> d d
 */

const ABO_GENES = {
  A: ['IA', 'i'],
  B: ['IB', 'i'],
  AB: ['IA', 'IB'],
  O: ['i', 'i']
}

const RH_GENES = {
  '+': ['D', 'd'],
  '-': ['d', 'd']
}

const ABO_TYPES = ['A', 'B', 'AB', 'O']
const RH_TYPES = ['+', '-']

/**
 * Parse a blood type string into ABO and optional Rh parts.
 * @param {string} input - Blood type such as 'A', 'B+', 'AB-', 'O'.
 * @returns {{abo: string, rh: string|null}|null}
 */
export function parseBloodType(input) {
  const text = String(input || '').toUpperCase().trim()
  const aboMatch = text.match(/^(AB|A|B|O)/)
  if (!aboMatch) return null
  const abo = aboMatch[1]
  const rhPart = text.slice(abo.length).trim()
  const rhMatch = rhPart.match(/^(\+|\-)/)
  const rh = rhMatch ? rhMatch[1] : null
  return { abo, rh }
}

/**
 * Determine ABO phenotype from a pair of alleles.
 * @param {string[]} genes - Two ABO alleles.
 * @returns {string}
 */
function aboPhenotype(genes) {
  const hasA = genes.includes('IA')
  const hasB = genes.includes('IB')
  if (hasA && hasB) return 'AB'
  if (hasA) return 'A'
  if (hasB) return 'B'
  return 'O'
}

/**
 * Determine Rh phenotype from a pair of alleles.
 * @param {string[]} genes - Two Rh alleles.
 * @returns {string}
 */
function rhPhenotype(genes) {
  return genes.includes('D') ? '+' : '-'
}

/**
 * Build a probability map for offspring phenotypes given two parent genotypes.
 * @param {string[]} g1 - First parent's alleles.
 * @param {string[]} g2 - Second parent's alleles.
 * @param {Function} phenotypeFn - Maps allele pair to phenotype string.
 * @returns {Map<string, number>}
 */
function offspringProbabilities(g1, g2, phenotypeFn) {
  const counts = new Map()
  let total = 0
  for (const a1 of g1) {
    for (const a2 of g2) {
      const pair = [a1, a2].sort()
      const ph = phenotypeFn(pair)
      counts.set(ph, (counts.get(ph) || 0) + 1)
      total += 1
    }
  }
  const result = new Map()
  for (const [ph, count] of counts) {
    result.set(ph, count / total)
  }
  return result
}

/**
 * Merge two independent probability distributions into a joint distribution.
 * @param {Map<string, number>} aboDist
 * @param {Map<string, number>} rhDist
 * @returns {Map<string, number>}
 */
function combineDistributions(aboDist, rhDist) {
  const joint = new Map()
  for (const [abo, aboProb] of aboDist) {
    for (const [rh, rhProb] of rhDist) {
      const key = `${abo}${rh}`
      joint.set(key, aboProb * rhProb)
    }
  }
  return joint
}

/**
 * Format a probability map as a sorted array of { type, probability }.
 * @param {Map<string, number>} dist
 * @returns {{type: string, probability: number}[]}
 */
function distributionToArray(dist) {
  return Array.from(dist.entries())
    .map(([type, probability]) => ({ type, probability }))
    .sort((a, b) => b.probability - a.probability)
}

/**
 * Calculate blood type inheritance results for two parents.
 * @param {string} parent1 - Father's blood type, e.g. 'A' or 'AB+'.
 * @param {string} parent2 - Mother's blood type, e.g. 'B' or 'O-'.
 * @returns {object}
 */
export function calculateInheritance(parent1, parent2) {
  const p1 = parseBloodType(parent1)
  const p2 = parseBloodType(parent2)
  if (!p1) throw new Error(`父亲血型格式无效: ${parent1}`)
  if (!p2) throw new Error(`母亲血型格式无效: ${parent2}`)
  if (!ABO_GENES[p1.abo]) throw new Error(`父亲 ABO 血型无效: ${p1.abo}`)
  if (!ABO_GENES[p2.abo]) throw new Error(`母亲 ABO 血型无效: ${p2.abo}`)

  const includeRh = p1.rh !== null || p2.rh !== null

  const aboDist = offspringProbabilities(
    ABO_GENES[p1.abo],
    ABO_GENES[p2.abo],
    aboPhenotype
  )

  let rhDist = null
  if (includeRh) {
    const rh1 = p1.rh || '+'
    const rh2 = p2.rh || '+'
    if (!RH_GENES[rh1] || !RH_GENES[rh2]) {
      throw new Error('Rh 血型必须是 + 或 -')
    }
    rhDist = offspringProbabilities(
      RH_GENES[rh1],
      RH_GENES[rh2],
      rhPhenotype
    )
  }

  const aboArray = distributionToArray(aboDist)
  const rhArray = rhDist ? distributionToArray(rhDist) : null

  let fullDist = null
  if (rhDist) {
    fullDist = distributionToArray(combineDistributions(aboDist, rhDist))
  }

  return {
    parent1: `${p1.abo}${p1.rh || ''}`,
    parent2: `${p2.abo}${p2.rh || ''}`,
    includeRh,
    abo: aboArray,
    rh: rhArray,
    full: fullDist,
    explanation: buildExplanation(p1, p2, aboArray, rhArray)
  }
}

/**
 * Build a human-readable explanation of the inheritance result.
 * @param {object} p1
 * @param {object} p2
 * @param {{type: string, probability: number}[]} abo
 * @param {{type: string, probability: number}[]|null} rh
 * @returns {string}
 */
function buildExplanation(p1, p2, abo, rh) {
  const p1Text = `${p1.abo}${p1.rh || ''}型`
  const p2Text = `${p2.abo}${p2.rh || ''}型`

  const aboTypes = abo.map(x => x.type).join('、')
  const aboOnly = abo.length === 1
    ? `子女 ABO 血型只能是 ${aboTypes} 型`
    : `子女 ABO 血型可能为 ${aboTypes} 型`

  if (!rh) {
    return `${p1Text} 与 ${p2Text} 父母，${aboOnly}。`
  }

  const rhTypes = rh.map(x => (x.type === '+' ? '阳性' : '阴性')).join('、')
  const rhOnly = rh.length === 1
    ? `Rh 血型只能是 ${rhTypes}`
    : `Rh 血型可能为 ${rhTypes}`

  return `${p1Text} 与 ${p2Text} 父母，${aboOnly}；${rhOnly}。`
}

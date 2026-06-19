/**
 * Safe expression evaluator for calculator.
 * Supports: + - * / ^ % and parentheses.
 * Does NOT use eval().
 */

const OPERATORS = {
  '+': { precedence: 1, assoc: 'left', fn: (a, b) => a + b },
  '-': { precedence: 1, assoc: 'left', fn: (a, b) => a - b },
  '*': { precedence: 2, assoc: 'left', fn: (a, b) => a * b },
  '/': { precedence: 2, assoc: 'left', fn: (a, b) => {
    if (b === 0) throw new Error('除数不能为零')
    return a / b
  }},
  '%': { precedence: 2, assoc: 'left', fn: (a, b) => {
    if (b === 0) throw new Error('模数不能为零')
    return a % b
  }},
  '^': { precedence: 3, assoc: 'right', fn: (a, b) => Math.pow(a, b) }
}

function tokenize(expr) {
  const tokens = []
  let i = 0
  const s = expr.replace(/\s+/g, '')
  while (i < s.length) {
    const ch = s[i]
    if (ch >= '0' && ch <= '9') {
      let num = ''
      while (i < s.length && ((s[i] >= '0' && s[i] <= '9') || s[i] === '.')) {
        num += s[i]
        i++
      }
      if (num === '.' || num.split('.').length > 2) {
        throw new Error(`无效数字: ${num}`)
      }
      tokens.push({ type: 'number', value: parseFloat(num) })
    } else if (ch === '(' || ch === ')') {
      tokens.push({ type: 'paren', value: ch })
      i++
    } else if (OPERATORS[ch]) {
      tokens.push({ type: 'op', value: ch })
      i++
    } else {
      throw new Error(`未知字符: ${ch}`)
    }
  }
  return tokens
}

function toRPN(tokens) {
  const output = []
  const stack = []
  for (const token of tokens) {
    if (token.type === 'number') {
      output.push(token)
    } else if (token.type === 'paren' && token.value === '(') {
      stack.push(token)
    } else if (token.type === 'paren' && token.value === ')') {
      while (stack.length && stack[stack.length - 1].value !== '(') {
        output.push(stack.pop())
      }
      if (!stack.length) throw new Error('括号不匹配')
      stack.pop() // pop '('
    } else if (token.type === 'op') {
      const o1 = OPERATORS[token.value]
      while (stack.length) {
        const top = stack[stack.length - 1]
        if (top.type !== 'op') break
        const o2 = OPERATORS[top.value]
        if ((o1.assoc === 'left' && o1.precedence <= o2.precedence) ||
            (o1.assoc === 'right' && o1.precedence < o2.precedence)) {
          output.push(stack.pop())
        } else {
          break
        }
      }
      stack.push(token)
    }
  }
  while (stack.length) {
    const t = stack.pop()
    if (t.type === 'paren') throw new Error('括号不匹配')
    output.push(t)
  }
  return output
}

function calcRPN(rpn) {
  const stack = []
  for (const token of rpn) {
    if (token.type === 'number') {
      stack.push(token.value)
    } else if (token.type === 'op') {
      if (stack.length < 2) throw new Error('表达式不完整')
      const b = stack.pop()
      const a = stack.pop()
      const res = OPERATORS[token.value].fn(a, b)
      if (!Number.isFinite(res)) throw new Error('计算结果无效')
      stack.push(res)
    }
  }
  if (stack.length !== 1) throw new Error('表达式不完整')
  return stack[0]
}

/**
 * Evaluate a mathematical expression safely.
 * @param {string} expr - Expression string.
 * @returns {number} Result.
 * @throws {Error} On invalid input or division by zero.
 */
export function evaluate(expr) {
  if (!expr || !expr.trim()) throw new Error('表达式为空')
  const tokens = tokenize(expr)
  if (!tokens.length) throw new Error('表达式为空')
  const rpn = toRPN(tokens)
  return calcRPN(rpn)
}

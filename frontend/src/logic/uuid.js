/**
 * UUID generation logic.
 */

export function generateV4() {
  const random = (() => {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      return () => {
        const a = new Uint32Array(1)
        crypto.getRandomValues(a)
        return a[0]
      }
    }
    return () => Math.floor(Math.random() * 0x100000000)
  })()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = random() % 16
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export function generateBatch(count = 5, options = {}) {
  const { 
    noHyphen = false, 
    uppercase = false, 
    prefix = '', 
    suffix = '',
    quote = '',
    comma = false
  } = options

  const results = []
  for (let i = 0; i < count; i++) {
    let id = generateV4()
    if (noHyphen) id = id.replace(/-/g, '')
    if (uppercase) id = id.toUpperCase()
    
    let formatted = `${prefix}${quote}${id}${quote}${suffix}`
    if (comma && i < count - 1) formatted += ','
    results.push(formatted)
  }
  return results
}

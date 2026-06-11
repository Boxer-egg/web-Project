/**
 * UUID generation logic.
 */

export function generateV4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = crypto.getRandomValues(new Uint8Array(1))[0] % 16
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

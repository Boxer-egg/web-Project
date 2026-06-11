/**
 * Date calculation logic.
 */

export function addDuration(dateStr, amount, unit) {
  if (!dateStr || !amount || !unit) throw new Error('请输入有效日期和增量')
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) throw new Error('无效的日期格式')
  
  const val = parseInt(amount)
  switch (unit) {
    case 'day': d.setDate(d.getDate() + val); break
    case 'week': d.setDate(d.getDate() + val * 7); break
    case 'month': d.setMonth(d.getMonth() + val); break
    case 'year': d.setFullYear(d.getFullYear() + val); break
  }
  return d.toISOString().slice(0, 10)
}

export function diffDates(date1, date2) {
  if (!date1 || !date2) throw new Error('请输入两个日期')
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) throw new Error('无效的日期格式')
  
  const diff = Math.abs(d1 - d2)
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  return days
}

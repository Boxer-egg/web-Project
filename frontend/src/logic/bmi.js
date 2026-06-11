/**
 * BMI logic.
 */

export function calculate(weight, height) {
  if (!weight || !height || weight <= 0 || height <= 0) throw new Error('请输入有效的体重和身高')
  const h = height / 100
  const bmi = weight / (h * h)
  
  let category = ''
  if (bmi < 18.5) category = '偏瘦'
  else if (bmi < 24) category = '正常'
  else if (bmi < 28) category = '超重'
  else category = '肥胖'
  
  return { bmi: bmi.toFixed(1), category }
}

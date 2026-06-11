/**
 * Lorem Ipsum generation logic.
 */

const WORDS = ["lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore", "magna", "aliqua"]

export function generate(paragraphs = 3, sentencesPerParagraph = 5) {
  let result = []
  for (let p = 0; p < paragraphs; p++) {
    let paragraph = []
    for (let s = 0; s < sentencesPerParagraph; s++) {
      let sentence = []
      const len = Math.floor(Math.random() * 5) + 5
      for (let w = 0; w < len; w++) {
        sentence.push(WORDS[Math.floor(Math.random() * WORDS.length)])
      }
      paragraph.push(sentence.join(' ').charAt(0).toUpperCase() + sentence.join(' ').slice(1) + '.')
    }
    result.push(paragraph.join(' '))
  }
  return result.join('\n\n')
}

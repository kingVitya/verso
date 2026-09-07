// Match words (Russian and English letters) and non-words (punctuation, spaces, newlines)
export const TOKENIZER_REGEX = /([а-яА-ЯёЁa-zA-Z]+)|([^а-яА-ЯёЁa-zA-Z]+)/g

/**
 * Splits text into an array of word and non-word tokens.
 * Punctuation and whitespace are preserved cleanly.
 */
export function tokenizeText(text) {
  if (!text || typeof text !== 'string') return []
  
  const tokens = []
  let match
  
  // Clone regex to avoid state issues with lastIndex
  const regex = new RegExp(TOKENIZER_REGEX.source, 'g')
  
  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      tokens.push({ type: 'word', value: match[1] })
    } else if (match[2]) {
      tokens.push({ type: 'non-word', value: match[2] })
    }
  }
  
  return tokens
}

/**
 * Extracts token indices that correspond to words.
 */
export function getWordIndices(tokens) {
  return tokens
    .map((token, index) => (token.type === 'word' ? index : -1))
    .filter((index) => index !== -1)
}

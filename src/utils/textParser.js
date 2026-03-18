import { v4 as uuidv4 } from 'uuid'

export function parseText(rawText) {
  return rawText
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(text => ({
      id: uuidv4(),
      text,
      timestamp: null,
    }))
}

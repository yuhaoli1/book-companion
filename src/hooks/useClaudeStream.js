import { useState, useCallback } from 'react'

const SYSTEM_PROMPT = `You are a brilliant study companion. When the user highlights a passage from a book, explain it clearly and concisely in plain language. Assume the user is intelligent but unfamiliar with the topic. Use analogies where helpful. Keep explanations under 150 words unless the concept genuinely demands more depth. Do not repeat the passage back verbatim — jump straight into the explanation.`

export function useClaudeStream() {
  const [loading, setLoading] = useState(false)
  const [streamedText, setStreamedText] = useState('')
  const [error, setError] = useState(null)

  const explain = useCallback(async (selectedText, apiKey) => {
    setLoading(true)
    setStreamedText('')
    setError(null)

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          system: SYSTEM_PROMPT,
          stream: true,
          messages: [
            { role: 'user', content: `Explain this passage: "${selectedText}"` },
          ],
        }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error?.message || `API error: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data)
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                accumulated += parsed.delta.text
                setStreamedText(accumulated)
              }
            } catch {
              // skip non-JSON lines
            }
          }
        }
      }

      setLoading(false)
      return accumulated
    } catch (err) {
      setError(err.message)
      setLoading(false)
      return null
    }
  }, [])

  return { loading, streamedText, error, explain, setStreamedText, setError }
}

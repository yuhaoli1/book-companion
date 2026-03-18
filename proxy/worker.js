/**
 * Cloudflare Worker — ElevenLabs TTS Proxy
 *
 * Deploy:
 *   1. npx wrangler login
 *   2. npx wrangler secret put ELEVENLABS_API_KEY
 *   3. npx wrangler deploy
 *
 * Environment variable (set via Cloudflare dashboard or wrangler secret):
 *   ELEVENLABS_API_KEY — your ElevenLabs API key
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// Simple in-memory rate limiter (per-IP, resets on worker restart)
const rateLimits = new Map()
const RATE_LIMIT = 60 // requests per window
const RATE_WINDOW = 60_000 // 1 minute

function checkRateLimit(ip) {
  const now = Date.now()
  const entry = rateLimits.get(ip)

  if (!entry || now - entry.start > RATE_WINDOW) {
    rateLimits.set(ip, { start: now, count: 1 })
    return true
  }

  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS })
    }

    const url = new URL(request.url)
    const path = url.pathname

    // Rate limit check
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown'
    if (!checkRateLimit(ip)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again shortly.' }), {
        status: 429,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = env.ELEVENLABS_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server not configured' }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    try {
      // GET /voices — list user's voices
      if (path === '/voices' && request.method === 'GET') {
        const resp = await fetch('https://api.elevenlabs.io/v1/voices', {
          headers: { 'xi-api-key': apiKey },
        })
        const data = await resp.json()
        return new Response(JSON.stringify(data), {
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        })
      }

      // GET /voices/search?q=query — search voice library
      if (path === '/voices/search' && request.method === 'GET') {
        const query = url.searchParams.get('q') || ''
        const resp = await fetch(
          `https://api.elevenlabs.io/v1/shared-voices?page_size=20&search=${encodeURIComponent(query)}`,
          { headers: { 'xi-api-key': apiKey } }
        )
        const data = await resp.json()
        return new Response(JSON.stringify(data), {
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        })
      }

      // POST /voices/add — add a shared voice to your library
      if (path === '/voices/add' && request.method === 'POST') {
        const body = await request.json()
        const resp = await fetch('https://api.elevenlabs.io/v1/voices/add-sharing', {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })
        const data = await resp.json()
        return new Response(JSON.stringify(data), {
          status: resp.status,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        })
      }

      // POST /tts/:voiceId — generate speech
      const ttsMatch = path.match(/^\/tts\/(.+)$/)
      if (ttsMatch && request.method === 'POST') {
        const voiceId = ttsMatch[1]
        const body = await request.json()

        // Cap text length to prevent abuse
        if (body.text && body.text.length > 5000) {
          return new Response(JSON.stringify({ error: 'Text too long (max 5000 chars)' }), {
            status: 400,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          })
        }

        const resp = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
          {
            method: 'POST',
            headers: {
              'xi-api-key': apiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: body.text,
              model_id: body.model_id || 'eleven_multilingual_v2',
              voice_settings: body.voice_settings || {
                stability: 0.5,
                similarity_boost: 0.75,
              },
            }),
          }
        )

        if (!resp.ok) {
          const err = await resp.text()
          return new Response(err, {
            status: resp.status,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          })
        }

        // Stream the audio back
        return new Response(resp.body, {
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'audio/mpeg',
          },
        })
      }

      // Health check
      if (path === '/' || path === '/health') {
        return new Response(JSON.stringify({ status: 'ok' }), {
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }
  },
}

import { Context, Next } from 'hono'

// Simple in-memory store for idempotency keys
// In production, use Redis or database
const idempotencyStore = new Map<string, any>()

export const idempotencyMiddleware = async (c: Context, next: Next) => {
  const idempotencyKey = c.req.header('X-Idempotency-Key')
  
  if (!idempotencyKey) {
    return c.json({ error: 'X-Idempotency-Key header required' }, 400)
  }

  // Check if we've seen this key before
  if (idempotencyStore.has(idempotencyKey)) {
    const cachedResponse = idempotencyStore.get(idempotencyKey)
    return c.json(cachedResponse.body, cachedResponse.status)
  }

  // Store the key for this request
  c.set('idempotencyKey', idempotencyKey)
  
  await next()
  
  // Cache the response for future requests with the same key
  // Only cache successful responses
  if (c.res.status >= 200 && c.res.status < 300) {
    const responseBody = await c.res.clone().json()
    idempotencyStore.set(idempotencyKey, {
      body: responseBody,
      status: c.res.status
    })
    
    // Clean up old keys after 1 hour
    setTimeout(() => {
      idempotencyStore.delete(idempotencyKey)
    }, 60 * 60 * 1000)
  }
}
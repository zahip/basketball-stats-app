import { Context, Next } from 'hono'
import { supabase } from '@/lib/supabase'

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Authorization header required' }, 401)
  }

  const token = authHeader.split(' ')[1]

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return c.json({ error: 'Invalid token' }, 401)
    }

    // Add user to context
    c.set('user', user)
    
    await next()
  } catch (error) {
    return c.json({ error: 'Authentication failed' }, 401)
  }
}

// Optional auth middleware (user may or may not be authenticated)
export const optionalAuthMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization')
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    
    try {
      const { data: { user } } = await supabase.auth.getUser(token)
      if (user) {
        c.set('user', user)
      }
    } catch (error) {
      // Ignore auth errors in optional middleware
    }
  }
  
  await next()
}
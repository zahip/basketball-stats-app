import { Context, Next } from 'hono'
import { supabase } from '@/lib/supabase'

// Development mode bypass
const isDevelopment = process.env.NODE_ENV === 'development'

export const authMiddleware = async (c: Context, next: Next): Promise<Response | void> => {
  // In development mode, allow requests with dev-token
  if (isDevelopment) {
    const authHeader = c.req.header('Authorization')

    if (authHeader?.includes('dev-token')) {
      // Create mock dev user
      const mockUser = {
        id: 'dev-user',
        email: 'dev@local',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      }
      c.set('user', mockUser)
      await next()
      return
    }
  }

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
export const optionalAuthMiddleware = async (c: Context, next: Next): Promise<void> => {
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
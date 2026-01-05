import Anthropic from '@anthropic-ai/sdk'

declare global {
  var __claude: Anthropic | undefined
}

// Initialize Claude client with API key from environment
export const claude = globalThis.__claude || new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// In development, reuse the client across hot reloads
if (process.env.NODE_ENV !== 'production') {
  globalThis.__claude = claude
}

// Check if Claude is configured
export const isClaudeConfigured = !!process.env.ANTHROPIC_API_KEY

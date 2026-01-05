import { claude, isClaudeConfigured } from './claude'
import { calculateGameStats, PlayerStats } from './stats-calculator'
import { Action, Player, Team } from '@prisma/client'

interface GenerateSummaryInput {
  homeTeam: Team
  awayTeam: Team
  scoreHome: number
  scoreAway: number
  actions: (Action & { player: Player })[]
}

/**
 * Generate professional Hebrew sports article for finished game
 * @throws Error if Claude API fails or is not configured
 */
export async function generateHebrewSummary(
  input: GenerateSummaryInput
): Promise<string> {
  if (!isClaudeConfigured) {
    throw new Error('Claude API is not configured. Set ANTHROPIC_API_KEY environment variable.')
  }

  const { homeTeam, awayTeam, scoreHome, scoreAway, actions } = input

  // Calculate detailed statistics
  const { homeStats, awayStats } = calculateGameStats(
    actions,
    homeTeam.id,
    awayTeam.id
  )

  // Determine winner
  const winner = scoreHome > scoreAway ? homeTeam.name : awayTeam.name
  const winnerScore = Math.max(scoreHome, scoreAway)
  const loserScore = Math.min(scoreHome, scoreAway)

  // Build prompt with structured data
  const prompt = buildHebrewSummaryPrompt({
    homeTeam,
    awayTeam,
    scoreHome,
    scoreAway,
    homeStats,
    awayStats,
    winner,
    winnerScore,
    loserScore,
  })

  try {
    // Call Claude API
    const message = await claude.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    // Extract text from response
    const summary = message.content[0].type === 'text'
      ? message.content[0].text
      : ''

    if (!summary || summary.trim().length === 0) {
      throw new Error('Claude API returned empty response')
    }

    return summary.trim()
  } catch (error) {
    console.error('❌ Failed to generate Hebrew summary:', error)
    throw new Error(`Failed to generate summary: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Build comprehensive prompt for Claude
 */
function buildHebrewSummaryPrompt(data: {
  homeTeam: Team
  awayTeam: Team
  scoreHome: number
  scoreAway: number
  homeStats: PlayerStats[]
  awayStats: PlayerStats[]
  winner: string
  winnerScore: number
  loserScore: number
}): string {
  const {
    homeTeam,
    awayTeam,
    scoreHome,
    scoreAway,
    homeStats,
    awayStats,
    winner,
    winnerScore,
    loserScore,
  } = data

  // Format top performers (top 3 from each team)
  const homeTopPerformers = homeStats.slice(0, 3)
  const awayTopPerformers = awayStats.slice(0, 3)

  const formatPlayerStats = (stats: PlayerStats) => {
    const fgPct = stats.fieldGoalsAttempted > 0
      ? ((stats.fieldGoalsMade / stats.fieldGoalsAttempted) * 100).toFixed(1)
      : '0.0'
    return `${stats.player.name} (#${stats.player.jerseyNumber}): ${stats.points} נקודות, ${stats.rebounds} ריבאונדים, ${stats.assists} אסיסטים (${fgPct}% קליעה)`
  }

  return `אתה כתב ספורט מקצועי בעיתון ספורט ישראלי מוביל. כתב עליך לכתוב כתבה מקצועית בעברית על משחק כדורסל שהסתיים זה עתה.

**פרטי המשחק:**
- קבוצת בית: ${homeTeam.name}
- קבוצת חוץ: ${awayTeam.name}
- תוצאה סופית: ${homeTeam.name} ${scoreHome} - ${scoreAway} ${awayTeam.name}
- מנצח: ${winner} (${winnerScore}-${loserScore})

**ביצועי שחקנים מובילים - ${homeTeam.name}:**
${homeTopPerformers.map(formatPlayerStats).join('\n')}

**ביצועי שחקנים מובילים - ${awayTeam.name}:**
${awayTopPerformers.map(formatPlayerStats).join('\n')}

**סטטיסטיקות קבוצתיות:**
- ${homeTeam.name}: ${scoreHome} נקודות, סה"כ ${homeStats.reduce((sum, s) => sum + s.rebounds, 0)} ריבאונדים, ${homeStats.reduce((sum, s) => sum + s.assists, 0)} אסיסטים
- ${awayTeam.name}: ${scoreAway} נקודות, סה"כ ${awayStats.reduce((sum, s) => sum + s.rebounds, 0)} ריבאונדים, ${awayStats.reduce((sum, s) => sum + s.assists, 0)} אסיסטים

**הנחיות לכתיבה:**
1. כתוב כתבה בת 3-4 פסקאות בעברית תקנית ומקצועית
2. פסקה ראשונה: תאר את המשחק והתוצאה, הדגש מה היה הגורם המכריע לניצחון
3. פסקה שנייה: פרט על ביצועי השחקנים המובילים של הקבוצה המנצחת
4. פסקה שלישית: תאר את ביצועי הקבוצה המפסידה ומה מנע מהם לנצח
5. פסקה רביעית (אופציונלית): סיכום ומבט קדימה
6. השתמש בשפה דינמית וחיה, כמו כתבות ספורט מקצועיות
7. אל תכלול כותרות או תבניות - רק טקסט רציף של הכתבה
8. השתמש בטרמינולוגיה מקצועית של כדורסל בעברית

כתוב את הכתבה עכשיו (רק את תוכן הכתבה, ללא כותרת):`
}

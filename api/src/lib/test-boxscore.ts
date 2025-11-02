import { calculateAdvancedStats } from './boxscore'

// Test the box score calculation functions
function testBoxScoreCalculations() {
  console.log('🧮 Testing box score calculations...\n')

  // Sample player stats
  const playerStats = {
    pts: 24,
    fgm2: 8,  // 8/12 = 66.7%
    fga2: 12,
    fgm3: 2,  // 2/6 = 33.3%
    fga3: 6,
    ftm: 4,   // 4/5 = 80%
    fta: 5,
    oreb: 2,
    dreb: 7,
    ast: 6,
    stl: 2,
    blk: 1,
    tov: 3,
    pf: 2
  }

  const advanced = calculateAdvancedStats(playerStats)

  console.log('📊 Player Stats:', playerStats)
  console.log('\n📈 Advanced Stats:')
  console.log(`  Effective FG%: ${advanced.eFG.toFixed(1)}%`)
  console.log(`  True Shooting%: ${advanced.tsPercent.toFixed(1)}%`)
  console.log(`  Field Goal%: ${advanced.fgPercent.toFixed(1)}%`)
  console.log(`  Three Point%: ${advanced.threePercent.toFixed(1)}%`)
  console.log(`  Free Throw%: ${advanced.ftPercent.toFixed(1)}%`)
  console.log(`  Total Rebounds: ${advanced.totalReb}`)
  console.log(`  Assist/TO Ratio: ${advanced.astToRatio.toFixed(1)}`)

  // Validate calculations
  const expectedEFG = ((10 + 0.5 * 2) / 18) * 100 // (FGM + 0.5*3PM) / FGA
  const expectedTS = (24 / (2 * (18 + 0.44 * 5))) * 100 // PTS / (2 * (FGA + 0.44*FTA))
  
  console.log('\n✅ Validation:')
  console.log(`  eFG% calculation: ${expectedEFG.toFixed(1)}% (expected) vs ${advanced.eFG.toFixed(1)}% (actual)`)
  console.log(`  TS% calculation: ${expectedTS.toFixed(1)}% (expected) vs ${advanced.tsPercent.toFixed(1)}% (actual)`)
  
  if (Math.abs(advanced.eFG - expectedEFG) < 0.1 && Math.abs(advanced.tsPercent - expectedTS) < 0.1) {
    console.log('  ✅ Calculations are correct!')
  } else {
    console.log('  ❌ Calculation error detected')
  }

  console.log('\n🏀 Box score calculations test completed!')
}

// Run if called directly
if (require.main === module) {
  testBoxScoreCalculations()
}

export { testBoxScoreCalculations }
# Live Game Issues - Quick Reference & Code Fixes

## Summary

**3 issues identified in live game page:**

| Priority | Issue | Location | Status | Minutes to Fix |
|----------|-------|----------|--------|----------------|
| 🔴 HIGH | Bench players can't be added to court | `quick-bench.tsx:140-151` | BLOCKING | 5 |
| 🟡 MED | Team switching is confusing | `page.tsx:516-523` | UX Issue | 15 |
| 🟡 MED | Button sizes too small (WCAG violation) | `page.tsx:515-565` | A11y Issue | 10 |

---

## Issue 1: Bench Players Can't Be Added (CRITICAL FIX)

### Problem
Users cannot add players to court at game start. `courtPlayers` is initialized empty, and a guard prevents adding when array is empty.

### Files & Lines to Change
- `web/src/app/games/[id]/live/page.tsx` lines 411-419
- `web/src/components/game/quick-bench.tsx` lines 140-151

### The Fixes

**Fix 1A: Update handleSubIn in page.tsx (lines 411-419)**

```typescript
// BEFORE:
const handleSubIn = (playerInId: string, playerOutId: string) => {
  const newCourt = courtPlayers.filter((id) => id !== playerOutId)
  newCourt.push(playerInId)
  setCourtPlayers(newCourt)
  toast({
    title: "Substitution",
    description: "Player substituted",
  })
}

// AFTER:
const handleSubIn = (playerInId: string, playerOutId?: string) => {
  let newCourt: string[]
  
  if (playerOutId) {
    // Traditional substitution: remove player, add new one
    newCourt = courtPlayers.filter((id) => id !== playerOutId)
  } else {
    // Adding to empty or non-full court
    newCourt = [...courtPlayers]
  }
  
  // Prevent duplicates and exceeding 5 players
  if (!newCourt.includes(playerInId) && newCourt.length < 5) {
    newCourt.push(playerInId)
    setCourtPlayers(newCourt)
    toast({
      title: playerOutId ? "Substitution" : "Player Added",
      description: playerOutId ? "Player substituted" : "Player added to court",
    })
  } else if (newCourt.includes(playerInId)) {
    toast({
      title: "Already on Court",
      description: "This player is already on the court",
      variant: "destructive",
    })
  } else {
    toast({
      title: "Court Full",
      description: "Court already has 5 players",
      variant: "destructive",
    })
  }
}
```

**Fix 1B: Update Sub In button in quick-bench.tsx (lines 139-151)**

```typescript
// BEFORE:
<Button
  onClick={() => {
    if (courtPlayers.length > 0) {
      onSubIn(player.id, courtPlayers[0].id)
    }
  }}
  variant="default"
  size="sm"
  className="h-7 px-2 text-xs font-semibold flex-shrink-0"
>
  Sub In
</Button>

// AFTER:
<Button
  onClick={() => {
    if (courtPlayers.length >= 5) {
      onSubIn(player.id, courtPlayers[0].id)
    } else {
      onSubIn(player.id)
    }
  }}
  variant="default"
  size="sm"
  className="h-8 px-3 text-xs font-semibold flex-shrink-0"
>
  {courtPlayers.length >= 5 ? "Sub In" : "Add"}
</Button>
```

---

## Issue 2: Team Switching is Confusing

### Problem
- Button is too small (28px height vs 44px minimum)
- Label is cryptic ("Opp" unclear)
- ActivePlayersBar disappears with no explanation
- No visual feedback showing selected team

### Files & Lines to Change
- `web/src/app/games/[id]/live/page.tsx` lines 516-523 (button styling)
- `web/src/app/games/[id]/live/page.tsx` lines 483-493 (add away team explanation)

### The Fixes

**Fix 2A: Expand and improve team toggle button (lines 516-523)**

```typescript
// BEFORE:
<Button
  variant="outline"
  size="sm"
  onClick={() => setSelectedTeam(selectedTeam === "home" ? "away" : "home")}
  className="text-[10px] h-7 px-2"
>
  {selectedTeam === "home" ? "📊 Team" : "👥 Opp"}
</Button>

// AFTER:
<Button
  variant={selectedTeam === "home" ? "default" : "outline"}
  size="sm"
  onClick={() => setSelectedTeam(selectedTeam === "home" ? "away" : "home")}
  className={cn(
    "text-xs h-9 px-3 font-semibold transition-all",
    selectedTeam === "home" && "ring-2 ring-primary ring-offset-2 shadow-md"
  )}
>
  {selectedTeam === "home" ? "📊 Your Team" : "👥 Opponent"}
</Button>
```

**Fix 2B: Add placeholder when away team selected (lines 483-493)**

```typescript
// BEFORE:
{selectedTeam === "home" && (
  <ActivePlayersBar
    activePlayer={selectedPlayer}
    onPlayerSelect={handlePlayerSelect}
    courtPlayers={courtPlayersList}
    benchPlayers={benchPlayersList}
    playingTime={playingTime}
    onBenchOpen={() => setBenchOpen(true)}
    selectedTeam={selectedTeam}
  />
)}

// AFTER:
{selectedTeam === "home" && (
  <ActivePlayersBar
    activePlayer={selectedPlayer}
    onPlayerSelect={handlePlayerSelect}
    courtPlayers={courtPlayersList}
    benchPlayers={benchPlayersList}
    playingTime={playingTime}
    onBenchOpen={() => setBenchOpen(true)}
    selectedTeam={selectedTeam}
  />
)}

{selectedTeam === "away" && (
  <Card className="border-none shadow-sm flex-shrink-0">
    <CardContent className="p-4">
      <div className="text-sm text-muted-foreground text-center">
        <p className="font-medium mb-2">Recording Opponent Stats</p>
        <p className="text-xs">Player roster management is available for your team only.</p>
        <p className="text-xs mt-2">Switch to "Your Team" to manage court and substitutions.</p>
      </div>
    </CardContent>
  </Card>
)}
```

---

## Issue 3: Button Sizes Too Small

### Problem
- Buttons are h-7 (28px) instead of WCAG minimum h-11 (44px)
- Font is text-[10px] instead of readable text-xs (12px)
- Spacing is gap-1 (4px) instead of comfortable gap-2 (8px)
- Violates accessibility guidelines

### Files & Lines to Change
- `web/src/app/games/[id]/live/page.tsx` lines 515-565 (entire control bar)
- `web/src/components/game/quick-bench.tsx` lines 148-151 (sub buttons)

### The Fixes

**Fix 3A: Expand control bar buttons (page.tsx lines 515-565)**

```typescript
// BEFORE:
<div
  className="flex-shrink-0 border-t bg-muted/40 px-2 py-1 flex items-center justify-between gap-1"
  role="navigation"
  aria-label="Game controls"
>
  <div className="flex items-center gap-1">
    <Button
      variant="outline"
      size="sm"
      onClick={() => setSelectedTeam(selectedTeam === "home" ? "away" : "home")}
      className="text-[10px] h-7 px-2"
    >
      {selectedTeam === "home" ? "📊 Team" : "👥 Opp"}
    </Button>
  </div>

  <div className="flex items-center gap-1">
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setBoxScoreOpen(true)}
      className="text-[10px] gap-0.5 h-7 px-2"
    >
      <span>📈</span>
      <span className="hidden sm:inline">Box</span>
    </Button>

    <Button
      variant="ghost"
      size="sm"
      onClick={() => setPlayByPlayOpen(true)}
      className="text-[10px] gap-0.5 h-7 px-2"
    >
      <span>📝</span>
      <span className="hidden sm:inline">Play</span>
    </Button>
  </div>

// AFTER:
<div
  className="flex-shrink-0 border-t bg-muted/40 px-2 py-2 flex items-center justify-between gap-2"
  role="navigation"
  aria-label="Game controls"
>
  <div className="flex items-center gap-2">
    <Button
      variant="outline"
      size="sm"
      onClick={() => setSelectedTeam(selectedTeam === "home" ? "away" : "home")}
      className="text-xs h-9 px-3 font-semibold"
    >
      {selectedTeam === "home" ? "📊 Your Team" : "👥 Opponent"}
    </Button>
  </div>

  <div className="flex items-center gap-2">
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setBoxScoreOpen(true)}
      className="text-xs gap-1 h-9 px-3"
    >
      <span>📈</span>
      <span className="hidden sm:inline">Box</span>
    </Button>

    <Button
      variant="ghost"
      size="sm"
      onClick={() => setPlayByPlayOpen(true)}
      className="text-xs gap-1 h-9 px-3"
    >
      <span>📝</span>
      <span className="hidden sm:inline">Play</span>
    </Button>
  </div>
```

**Fix 3B: Expand sub buttons in quick-bench.tsx (lines 148-151)**

Replace `className="h-7 px-2 text-xs font-semibold flex-shrink-0"` with:
```typescript
className="h-8 px-3 text-xs font-semibold flex-shrink-0"
```

---

## Testing Checklist

After implementing all fixes, test these scenarios:

### Critical Tests (Must Pass)
- [ ] Game loads → no errors
- [ ] Open bench modal → all players listed
- [ ] Click "Add" on a bench player → player appears on court
- [ ] Add 5 players → court shows 5 players
- [ ] Try to add 6th player → "Court Full" toast shown
- [ ] Click team toggle → shows "Your Team" and "Opponent" labels
- [ ] Switch to opponent → placeholder text shown (not blank)
- [ ] Switch back to team → player bar reappears

### Accessibility Tests (Mobile/Tablet)
- [ ] All buttons are at least 44px tall (use Safari/Chrome DevTools)
- [ ] Button text is readable (12px or larger)
- [ ] Button spacing is comfortable (at least 8px between)
- [ ] Can tap buttons accurately with thumb on phone
- [ ] Zoom to 200% and buttons still functional

### UI Tests
- [ ] Team toggle shows visual selection (different background/ring)
- [ ] Button text is visible on all device sizes
- [ ] No text is truncated or hidden
- [ ] Toasts appear with clear messages
- [ ] No blank spaces or broken layout

---

## Quick Summary of Changes

| File | Line(s) | Change | Impact |
|------|---------|--------|--------|
| `page.tsx` | 411-419 | Make `playerOutId` optional, handle empty court | Fixes bench adding |
| `quick-bench.tsx` | 139-151 | Remove guard, show "Add" vs "Sub In" | Enables court setup |
| `page.tsx` | 516-523 | Expand button, improve label, add ring styling | Fixes team toggle visibility |
| `page.tsx` | 483-493 | Add away team placeholder | Explains UI behavior |
| `page.tsx` | 515-565 | Increase sizes: h-7→h-9, px-2→px-3, gap-1→gap-2 | Meets accessibility standards |
| `quick-bench.tsx` | 148-151 | Change h-7→h-8, px-2→px-3 | Better touch targets |

**Total time to implement: ~30 minutes**

---

## Verification Commands

After making changes, run these to verify:

```bash
# Check TypeScript compilation (no errors)
cd web
pnpm type-check

# Run tests if they exist
pnpm test

# Start dev server and manually test
pnpm dev
```

Then visit `http://localhost:3000/games/[gameId]/live` and test the scenarios above.


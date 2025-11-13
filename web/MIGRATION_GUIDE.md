# Design System Migration Guide

This guide shows you how to migrate from the old design to the new modern design system.

## Quick Start

1. **Server is running on:** http://localhost:3003
2. **All base components are ready** - No compilation errors
3. **Start with Live Game page** for immediate visual impact

---

## Before & After Examples

### 1. Button Styles

**BEFORE (Old):**
```tsx
<button className="bg-green-600 text-white hover:opacity-80 py-2.5 px-1.5">
  2PT Made
</button>
```

**AFTER (New):**
```tsx
<Button variant="success" size="touch" className="h-16 flex-col gap-0.5">
  <span className="text-base font-bold">2PT</span>
  <span className="text-xs opacity-90">Made</span>
</Button>
```

**What Changed:**
- Uses semantic `variant="success"` instead of hardcoded color
- Better typography with separated label and sublabel
- Consistent shadow and hover effects
- Active scale animation built-in
- Proper touch target sizing

---

### 2. Card Layouts

**BEFORE (Old):**
```tsx
<div className="rounded-lg border bg-card shadow-sm p-6">
  <h3 className="text-2xl font-semibold">Shooting</h3>
  <div className="p-2.5">
    {/* Content */}
  </div>
</div>
```

**AFTER (New):**
```tsx
<Card className="border-l-4 border-l-success">
  <CardHeader className="pb-3">
    <div className="flex items-center gap-2">
      <Target className="h-5 w-5 text-success" />
      <CardTitle className="text-sm font-bold">Shooting</CardTitle>
    </div>
  </CardHeader>
  <CardContent className="space-y-2">
    {/* Content */}
  </CardContent>
</Card>
```

**What Changed:**
- Colored left border for visual categorization
- Icon integration for better visual hierarchy
- Better shadow: `shadow-md shadow-black/5`
- Larger border radius: `rounded-xl` (12px)
- Hover effect built-in

---

### 3. Score Display

**BEFORE (Old):**
```tsx
<div className="flex justify-between p-4">
  <div>
    <span>Your Team</span>
    <span className="text-3xl">{homeScore}</span>
  </div>
  <div>
    <span>Opponent</span>
    <span className="text-3xl">{awayScore}</span>
  </div>
</div>
```

**AFTER (New):**
```tsx
<ScoreDisplay
  homeTeam="Lakers"
  awayTeam="Warriors"
  homeScore={54}
  awayScore={48}
  period={2}
  clock="5:42"
  status="active"
/>
```

**What Changed:**
- Component handles all layout and styling
- Gradient backgrounds for leading team
- Team badges with color coding
- Score comparison bar
- Status badges (Live, Paused, Final)
- Responsive grid layout

---

### 4. Player Badges

**BEFORE (Old):**
```tsx
<span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs">
  Player #{selectedPlayer}
</span>
```

**AFTER (New):**
```tsx
<Badge variant="outline" size="lg">
  #{selectedPlayer}
</Badge>
```

Or with team color:
```tsx
<Badge variant="home-team" size="lg">
  Your Team
</Badge>
```

**What Changed:**
- Semantic variants for different contexts
- Size system: sm, default, lg
- Built-in transitions
- Better spacing and typography

---

### 5. Team Selection

**BEFORE (Old):**
```tsx
<div className="flex items-center gap-1.5">
  <span className="font-medium">
    {selectedTeam === 'home' ? '🏀 Your Team' : '👥 Opponent'}
  </span>
</div>
```

**AFTER (New):**
```tsx
<Card className="bg-gradient-to-br from-muted/30 to-muted/10">
  <CardContent className="p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Badge variant={selectedTeam === 'home' ? 'home-team' : 'away-team'} size="lg">
          {selectedTeam === 'home' ? 'Your Team' : 'Opponent'}
        </Badge>
        {selectedPlayer && (
          <Badge variant="outline" size="lg">#{selectedPlayer}</Badge>
        )}
      </div>
    </div>
  </CardContent>
</Card>
```

**What Changed:**
- Gradient background card
- Color-coded team badges
- Better spacing and visual hierarchy
- Consistent with design system

---

## Color Migration Map

### Old Hardcoded Colors → New Semantic Colors

| Old Style | New Style | Use Case |
|-----------|-----------|----------|
| `bg-green-600` | `variant="success"` | Made shots, positive actions |
| `bg-red-600` | `variant="destructive"` | Missed shots, errors |
| `bg-yellow-600` | `variant="warning"` | Fouls, warnings |
| `bg-blue-600` | `variant="default"` or `text-primary` | General actions |
| `bg-purple-600` | `variant="home-team"` or `text-home-team` | Home team elements |
| `bg-gray-600` | `text-muted-foreground` | Secondary text |

### New Basketball-Specific Colors

```tsx
// Home Team (Purple)
className="bg-home-team"           // Background
className="text-home-team"         // Text
className="border-home-team"       // Border
variant="home-team"                // Badge variant

// Away Team (Blue)
className="bg-away-team"           // Background
className="text-away-team"         // Text
className="border-away-team"       // Border
variant="away-team"                // Badge variant

// Made Shots (Green)
variant="success"                  // Button/Badge
className="text-success"           // Text
className="border-l-success"       // Left border accent

// Missed Shots (Red)
variant="destructive"              // Button/Badge
className="text-destructive"       // Text

// Fouls/Warnings (Orange)
variant="warning"                  // Button/Badge
className="text-warning"           // Text
className="border-l-warning"       // Left border accent
```

---

## Component-Specific Migration

### ActionGrid Component (ALREADY DONE)

**File:** `/Users/zahiperi/Zahi/basketball-stats-app/web/src/components/game/action-grid.tsx`

This component has already been refactored! Key changes:
- Replaced emoji-based labels with clean text + icons
- Uses new Button variants (success/destructive/warning)
- Better spacing with `space-y-3`
- Gradient status card
- Lucide icons integration

**No action needed** - Component is ready to use!

---

### Live Game Page Integration

**File:** `/Users/zahiperi/Zahi/basketball-stats-app/web/src/app/games/[id]/live/page.tsx`

**Step 1: Import new components**
```tsx
import { ScoreDisplay } from '@/components/game/score-display'
import { Badge } from '@/components/ui/badge'
```

**Step 2: Replace score header (around line 250)**

Find this:
```tsx
{/* Old header with scores */}
<div className="flex justify-between items-center">
  <div>
    <h2>Our Score: {data.game.ourScore}</h2>
  </div>
  <div>
    <h2>Opponent Score: {data.game.oppScore}</h2>
  </div>
</div>
```

Replace with:
```tsx
<ScoreDisplay
  homeTeam={data.game.team.name}
  awayTeam={data.game.opponent}
  homeScore={data.game.ourScore}
  awayScore={data.game.oppScore}
  period={data.game.period}
  clock={formatClock(data.game.clockSec)}
  status={mapGameStatus(data.game.status)}
/>
```

**Step 3: Update team badges**

Find badge usage and replace:
```tsx
// Old
<span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs">
  {selectedTeam === 'home' ? 'Your Team' : 'Opponent'}
</span>

// New
<Badge variant={selectedTeam === 'home' ? 'home-team' : 'away-team'} size="lg">
  {selectedTeam === 'home' ? 'Your Team' : 'Opponent'}
</Badge>
```

---

### Box Score Component

**File:** `/Users/zahiperi/Zahi/basketball-stats-app/web/src/components/game/box-score.tsx`

**Step 1: Update table header**
```tsx
<thead className="bg-muted/50">
  <tr className="border-b border-border">
    <th className="px-4 py-3 text-left font-semibold">Player</th>
    <th className="px-3 py-3 text-center font-semibold">PTS</th>
    {/* More headers */}
  </tr>
</thead>
```

**Step 2: Add hover states to rows**
```tsx
<tbody>
  {players.map((player) => (
    <tr
      key={player.id}
      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" size="sm">#{player.jersey}</Badge>
          <span className="font-medium">{player.name}</span>
        </div>
      </td>
      {/* More cells */}
    </tr>
  ))}
</tbody>
```

**Step 3: Add team comparison**

Use `StatComparison` component:
```tsx
import { StatComparison } from '@/components/game/stat-card'

<Card>
  <CardHeader>
    <CardTitle>Team Stats</CardTitle>
  </CardHeader>
  <CardContent className="space-y-1">
    <StatComparison label="Points" homeValue={54} awayValue={48} />
    <StatComparison label="FG%" homeValue="45.5%" awayValue="42.3%" />
    <StatComparison label="Rebounds" homeValue={22} awayValue={18} />
  </CardContent>
</Card>
```

---

### Players Grid Component

**File:** `/Users/zahiperi/Zahi/basketball-stats-app/web/src/components/game/players-grid.tsx`

**Update player card styling:**
```tsx
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

<Card
  className={cn(
    "cursor-pointer transition-all duration-200",
    selected && "ring-2 ring-primary shadow-lg shadow-primary/20"
  )}
  onClick={() => onSelectPlayer(player)}
>
  <CardContent className="p-4">
    <div className="flex items-center gap-3">
      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-home-team to-home-team/80 flex items-center justify-center">
        <span className="text-lg font-bold text-white">
          #{player.jersey}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">
          {player.firstName} {player.lastName}
        </p>
        <p className="text-xs text-muted-foreground">
          {player.position}
        </p>
      </div>
      {selected && (
        <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-4 w-4 text-white" />
        </div>
      )}
    </div>
  </CardContent>
</Card>
```

---

## Testing Your Changes

### Visual Checklist

After making changes, verify:

1. **Colors**
   - [ ] Purple used for home team
   - [ ] Blue used for away team
   - [ ] Green for success/made shots
   - [ ] Red for errors/missed shots
   - [ ] Orange for warnings/fouls

2. **Spacing**
   - [ ] Cards have `space-y-3` or `space-y-4` between them
   - [ ] CardContent has `p-6` or `p-4` (mobile)
   - [ ] Consistent gaps in grids: `gap-2`, `gap-3`, `gap-4`

3. **Shadows**
   - [ ] Cards have `shadow-md shadow-black/5`
   - [ ] Buttons have colored shadows (e.g., `shadow-primary/30`)
   - [ ] Hover effects increase shadow to `shadow-lg`

4. **Borders**
   - [ ] Cards have `rounded-xl` (12px)
   - [ ] Accent borders use `border-l-4`
   - [ ] Border colors match section purpose

5. **Typography**
   - [ ] Page titles: `text-3xl md:text-4xl font-bold`
   - [ ] Card titles: `text-sm font-bold` or `text-lg font-semibold`
   - [ ] Stats: `text-4xl font-bold` or `text-5xl font-bold`
   - [ ] Muted text: `text-muted-foreground`

### Browser DevTools Check

1. Open http://localhost:3003/games/[gameId]/live
2. Open DevTools (F12)
3. Check Elements tab:
   - Verify CSS variables are applied
   - Check computed colors match design
   - Inspect shadow values

### Responsive Check

Test at these breakpoints:
- 320px (iPhone SE)
- 375px (iPhone 12)
- 768px (iPad)
- 1024px (Desktop)
- 1440px (Large Desktop)

---

## Common Issues & Solutions

### Issue: Colors not showing

**Problem:** CSS variables not loaded
**Solution:** Restart dev server, check `globals.css` imports in `layout.tsx`

### Issue: Components not found

**Problem:** Import paths incorrect
**Solution:** Use `@/components/...` not relative paths

### Issue: TypeScript errors on Badge variants

**Problem:** New variants not recognized
**Solution:** Restart TypeScript server in VSCode (Cmd+Shift+P → "Restart TS Server")

### Issue: Buttons too small on mobile

**Problem:** Not using `size="touch"`
**Solution:** Add `size="touch"` prop to all action buttons

### Issue: Text too light/dark

**Problem:** Using wrong semantic color
**Solution:** Use `text-foreground` for main text, `text-muted-foreground` for secondary

---

## Rollback Plan

If you need to revert changes:

```bash
# Revert all component changes
cd /Users/zahiperi/Zahi/basketball-stats-app
git checkout HEAD -- web/src/components/ui/button.tsx
git checkout HEAD -- web/src/components/ui/card.tsx
git checkout HEAD -- web/src/components/ui/badge.tsx
git checkout HEAD -- web/src/app/globals.css
git checkout HEAD -- web/tailwind.config.js

# Remove new components
rm web/src/components/game/score-display.tsx
rm web/src/components/game/stat-card.tsx
rm -rf web/src/components/game/examples
```

---

## Resources

- **Design System Docs:** `/Users/zahiperi/Zahi/basketball-stats-app/web/DESIGN_SYSTEM.md`
- **Implementation Summary:** `/Users/zahiperi/Zahi/basketball-stats-app/DESIGN_IMPLEMENTATION_SUMMARY.md`
- **Example Components:** `/Users/zahiperi/Zahi/basketball-stats-app/web/src/components/game/examples/modern-game-layout.tsx`

---

## Next Steps

1. **Integrate ScoreDisplay** into live game page
2. **Update player selection** with modern cards
3. **Refactor box score table** with new styling
4. **Polish forms** with new input styling
5. **Update dashboard** with game cards

**Estimated Time:** 2-3 hours for complete migration

**Server Running:** http://localhost:3003 (Ready to test!)

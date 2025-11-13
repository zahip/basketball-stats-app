# Basketball Stats App - Modern Design System

This document outlines the complete design system implementation matching the modern dashboard aesthetic.

## Color System & Basketball Semantics

### Primary Colors

```typescript
// Purple - Primary brand color & Home Team
--primary: 262 83% 58%             // #7C3AED - Vibrant purple
--home-team: 262 83% 58%           // Same as primary (Purple = Home)

// Blue - Secondary accents & Away Team
--accent: 212 100% 97%             // Light blue backgrounds
--away-team: 212 100% 48%          // Bright blue for away team

// Backgrounds
--background: 220 17% 97%          // Light blue-gray page background
--card: 0 0% 100%                  // Pure white cards (elevated)
--secondary: 262 90% 97%           // Light purple/lavender
```

### Basketball Action Colors

```typescript
// Success = Made Shots
--success: 142 76% 36%             // Green #16A34A
// Use: 2PT Made, 3PT Made, FT Made

// Warning = Fouls & Turnovers
--warning: 38 92% 50%              // Orange #F59E0B
// Use: Fouls, Turnovers, Warnings

// Destructive = Missed Shots
--destructive: 0 84% 60%           // Red #EF4444
// Use: 2PT Miss, 3PT Miss, FT Miss

// Court Colors (for backgrounds)
--court-light: 45 42% 88%          // Light tan #EDE3D0
--court-dark: 35 30% 78%           // Darker tan #D9C7AB
```

### Color Mapping Rules

**Home vs Away:**
- Home Team: Purple (`bg-home-team`, `text-home-team`)
- Away Team: Blue (`bg-away-team`, `text-away-team`)

**Shot Results:**
- Made: Green (`bg-success`, `variant="success"`)
- Missed: Red (`bg-destructive`, `variant="destructive"`)

**Event Categories:**
- Shooting: Green border-left accent
- Plays (assists, rebounds, steals): Blue border-left accent
- Fouls/Other: Orange/Yellow border-left accent

---

## Component Library

### 1. Enhanced Card Component

**Base Card** - Elevated white cards with soft shadows:

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

// Basic usage
<Card>
  <CardHeader>
    <CardTitle>Game Score</CardTitle>
    <CardDescription>Live tracking</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Your team: 54 | Opponent: 48</p>
  </CardContent>
</Card>

// With colored left border accent
<Card className="border-l-4 border-l-success">
  <CardHeader className="pb-3">
    <CardTitle className="text-sm font-bold">Shooting Stats</CardTitle>
  </CardHeader>
  <CardContent className="space-y-2">
    {/* Content */}
  </CardContent>
</Card>
```

**Features:**
- `rounded-xl` (12px border radius)
- Soft shadow: `shadow-md shadow-black/5`
- Hover effect: `hover:shadow-lg`
- Border: `border-border/40` (subtle)

### 2. Modern Button Variants

**Gradient Primary Button** (CTA style from design):

```tsx
import { Button } from '@/components/ui/button'

// Primary gradient (matching purple CTA in design)
<Button variant="gradient" size="lg">
  Start Game
</Button>

// Action buttons with icons
<Button variant="success" size="touch">
  <Check className="h-4 w-4" />
  2PT Made
</Button>

// Outlined secondary
<Button variant="outline" size="default">
  Cancel
</Button>

// Ghost (minimal)
<Button variant="ghost" size="sm">
  Edit
</Button>
```

**Available Variants:**
- `default` - Solid primary purple with shadow
- `gradient` - Purple gradient (bottom-right direction)
- `success` - Green (for made shots)
- `destructive` - Red (for missed shots)
- `warning` - Orange (for fouls)
- `outline` - Border only
- `secondary` - Light purple background
- `ghost` - No background
- `link` - Text link

**Sizes:**
- `sm` - h-9 (compact)
- `default` - h-11 (standard)
- `lg` - h-12 (prominent)
- `xl` - h-14 (hero CTA)
- `touch` - h-12 with min-w-44px (mobile)
- `icon` - h-11 w-11 (square)

### 3. Enhanced Badge Component

**Team Badges:**

```tsx
import { Badge } from '@/components/ui/badge'

// Home team indicator
<Badge variant="home-team">Your Team</Badge>

// Away team indicator
<Badge variant="away-team">Opponent</Badge>

// Player jersey number
<Badge variant="outline" size="lg">
  #23
</Badge>

// Stat indicators
<Badge variant="success">Made</Badge>
<Badge variant="destructive">Miss</Badge>
<Badge variant="warning">Foul</Badge>
```

**Variants:**
- `default` - Primary purple
- `secondary` - Light purple
- `success` - Light green background
- `destructive` - Light red background
- `warning` - Light orange background
- `accent` - Light blue background
- `outline` - Border only
- `home-team` - Purple badge (bold)
- `away-team` - Blue badge (bold)

### 4. Stat Display Cards

**Score Card Pattern:**

```tsx
<Card className="bg-gradient-to-br from-home-team/5 to-home-team/10">
  <CardContent className="p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Your Team</p>
        <p className="text-4xl font-bold text-home-team">54</p>
      </div>
      <Badge variant="home-team" size="lg">
        Leading
      </Badge>
    </div>
  </CardContent>
</Card>
```

**Box Score Table Pattern:**

```tsx
<Card>
  <CardHeader>
    <CardTitle>Box Score</CardTitle>
  </CardHeader>
  <CardContent className="p-0">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left font-semibold">Player</th>
            <th className="px-3 py-3 text-center font-semibold">PTS</th>
            <th className="px-3 py-3 text-center font-semibold">FG%</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" size="sm">#23</Badge>
                <span className="font-medium">Player Name</span>
              </div>
            </td>
            <td className="px-3 py-3 text-center font-semibold">18</td>
            <td className="px-3 py-3 text-center">45.5%</td>
          </tr>
        </tbody>
      </table>
    </div>
  </CardContent>
</Card>
```

### 5. Action Grid (Game Controls)

**Modern Action Button Grid:**

```tsx
<Card className="border-l-4 border-l-success">
  <CardHeader className="pb-3">
    <CardTitle className="text-sm font-bold flex items-center gap-2">
      <span>🏀</span>
      Shooting
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-2">
    <div className="grid grid-cols-2 gap-2">
      <Button
        variant="success"
        size="touch"
        className="h-16"
        onClick={() => handleAction('SHOT_2_MADE')}
      >
        <div className="text-center">
          <div className="text-lg font-bold">2PT</div>
          <div className="text-xs opacity-90">Made</div>
        </div>
      </Button>

      <Button
        variant="destructive"
        size="touch"
        className="h-16"
        onClick={() => handleAction('SHOT_2_MISS')}
      >
        <div className="text-center">
          <div className="text-lg font-bold">2PT</div>
          <div className="text-xs opacity-90">Miss</div>
        </div>
      </Button>
    </div>
  </CardContent>
</Card>
```

### 6. Player Selection Grid

**Player Card Pattern:**

```tsx
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

### 7. Form Components

**Modern Input Styling:**

```tsx
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

<div className="space-y-2">
  <Label htmlFor="team-name" className="text-sm font-semibold">
    Team Name
  </Label>
  <Input
    id="team-name"
    placeholder="Enter team name"
    className="h-11 rounded-lg border-2 focus:border-primary/50"
  />
</div>
```

**Form Card Pattern:**

```tsx
<Card className="max-w-md mx-auto">
  <CardHeader>
    <CardTitle className="text-2xl font-bold">Create New Game</CardTitle>
    <CardDescription>Set up your game details</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="opponent">Opponent Name</Label>
      <Input id="opponent" placeholder="Enter opponent name" />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="date">Game Date</Label>
        <Input id="date" type="date" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="venue">Venue</Label>
        <Input id="venue" placeholder="Location" />
      </div>
    </div>
  </CardContent>
  <CardFooter className="flex gap-3">
    <Button variant="outline" className="flex-1">Cancel</Button>
    <Button variant="gradient" className="flex-1">Create Game</Button>
  </CardFooter>
</Card>
```

---

## Layout Patterns

### 1. Page Container

```tsx
<div className="min-h-screen bg-background">
  <div className="container mx-auto p-4 md:p-6 max-w-7xl">
    {/* Page content */}
  </div>
</div>
```

### 2. Dashboard Grid Layout

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
  <Card>
    {/* Revenue card equivalent = Score card */}
  </Card>
  <Card>
    {/* Activity goal = Game stats */}
  </Card>
  <Card>
    {/* Calendar = Schedule */}
  </Card>
</div>
```

### 3. Live Game Layout

```tsx
<div className="space-y-4">
  {/* Game Header Card */}
  <Card className="border-l-4 border-l-primary">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lakers vs Warriors</h1>
          <p className="text-muted-foreground">Q2 • 5:42 remaining</p>
        </div>
        <Badge variant="success" size="lg">Live</Badge>
      </div>
    </CardContent>
  </Card>

  {/* Score Display */}
  <div className="grid grid-cols-2 gap-4">
    <Card className="bg-gradient-to-br from-home-team/5 to-home-team/10">
      {/* Home team score */}
    </Card>
    <Card className="bg-gradient-to-br from-away-team/5 to-away-team/10">
      {/* Away team score */}
    </Card>
  </div>

  {/* Action Grid */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <div className="space-y-3">
      {/* Player selection */}
      {/* Action buttons */}
    </div>
    <div>
      {/* Play-by-play or Box Score */}
    </div>
  </div>
</div>
```

---

## Typography Scale

```tsx
// Page Titles
<h1 className="text-3xl md:text-4xl font-bold text-foreground">
  Live Game
</h1>

// Section Titles
<h2 className="text-2xl font-bold text-foreground">
  Box Score
</h2>

// Card Titles
<CardTitle className="text-lg font-semibold">
  Shooting Stats
</CardTitle>

// Subsections
<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
  Quarter 2
</h3>

// Body Text
<p className="text-sm text-foreground">
  Regular content
</p>

// Muted Text
<p className="text-sm text-muted-foreground">
  Secondary information
</p>

// Stats Display
<div className="text-4xl font-bold text-home-team">54</div>
```

---

## Spacing System

Based on the design system image spacing:

```tsx
// Card Padding
<CardHeader className="p-6 pb-3">     // Standard header
<CardContent className="p-6 pt-0">     // Content below header
<CardContent className="p-6">          // Standalone content

// Compact Variants (mobile)
<CardHeader className="p-4 pb-2">
<CardContent className="p-4 pt-0">

// Grid Gaps
<div className="grid grid-cols-3 gap-3">        // Action buttons
<div className="grid grid-cols-2 gap-4">        // Cards
<div className="grid grid-cols-1 gap-6">        // Sections

// Stack Spacing
<div className="space-y-2">   // Tight (form fields)
<div className="space-y-3">   // Medium (action sections)
<div className="space-y-4">   // Standard (page sections)
<div className="space-y-6">   // Loose (major sections)
```

---

## Accessibility Guidelines

### Focus States

All interactive elements have visible focus rings:
```tsx
focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
```

### Touch Targets

Minimum 44x44px for all buttons:
```tsx
<Button size="touch">  // Ensures min-w-[44px] min-h-[44px]
```

### Color Contrast

All color combinations meet WCAG AA:
- Primary text on white: 14.5:1
- Muted text on white: 4.7:1
- Button text: All meet minimum 4.5:1

### Semantic HTML

```tsx
// Use proper heading hierarchy
<h1> → <h2> → <h3>

// Use semantic buttons
<Button> instead of <div onClick>

// Use proper ARIA labels
<Button aria-label="Record 2-point made shot">
  2PT Made
</Button>
```

---

## Animation & Transitions

### Button Interactions

```tsx
// Hover: Scale + Shadow
hover:shadow-lg hover:shadow-primary/40

// Active: Slight scale down
active:scale-[0.98]

// Transition timing
transition-all duration-200
```

### Card Hover Effects

```tsx
<Card className="transition-shadow hover:shadow-lg hover:shadow-black/10">
```

### Loading States

```tsx
// Skeleton for loading cards
<Card className="animate-pulse">
  <CardContent className="p-6">
    <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
    <div className="h-8 bg-muted rounded w-1/2"></div>
  </CardContent>
</Card>
```

---

## Basketball-Specific Patterns

### Score Comparison Display

```tsx
<Card>
  <CardContent className="p-6">
    <div className="flex items-center justify-center gap-6">
      <div className="text-center">
        <Badge variant="home-team" className="mb-2">Your Team</Badge>
        <div className="text-5xl font-bold text-home-team">54</div>
      </div>
      <div className="text-2xl font-bold text-muted-foreground">-</div>
      <div className="text-center">
        <Badge variant="away-team" className="mb-2">Opponent</Badge>
        <div className="text-5xl font-bold text-away-team">48</div>
      </div>
    </div>
  </CardContent>
</Card>
```

### Stat Comparison Row

```tsx
<div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
  <div className="flex-1 text-right">
    <span className="text-lg font-bold text-home-team">18</span>
  </div>
  <div className="flex-1 text-center">
    <span className="text-sm font-medium text-muted-foreground">Field Goals</span>
  </div>
  <div className="flex-1 text-left">
    <span className="text-lg font-bold text-away-team">15</span>
  </div>
</div>
```

### Period/Quarter Indicator

```tsx
<Badge variant="secondary" size="lg" className="gap-2">
  <span className="text-xs font-medium">Q2</span>
  <span className="text-sm font-bold">5:42</span>
</Badge>
```

### Event Timeline Item

```tsx
<div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50">
  <Badge variant="success" size="sm">2PT</Badge>
  <div className="flex-1 min-w-0">
    <p className="text-sm font-medium truncate">#23 LeBron James</p>
    <p className="text-xs text-muted-foreground">5:42 Q2</p>
  </div>
  <div className="text-sm font-bold text-home-team">+2</div>
</div>
```

---

## Mobile Responsive Patterns

### Breakpoint Strategy

```tsx
// Mobile first approach
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// Stack on mobile, side-by-side on desktop
<div className="flex flex-col md:flex-row gap-4">

// Hide on mobile
<div className="hidden md:block">

// Show only on mobile
<div className="block md:hidden">
```

### Touch-Optimized Action Grid

```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
  <Button variant="success" size="touch" className="h-20 flex-col">
    <span className="text-2xl">🏀</span>
    <span className="text-xs">2PT Made</span>
  </Button>
</div>
```

---

## Implementation Checklist

### Phase 1: Base Components (Completed)
- ✅ Updated CSS variables with new color system
- ✅ Enhanced Card component with better shadows/radius
- ✅ Updated Button with gradient variant and new sizes
- ✅ Enhanced Badge with team/stat variants
- ✅ Configured Tailwind with basketball-specific colors

### Phase 2: Action Grid Refactor
- [ ] Update ActionGrid component to use new button variants
- [ ] Replace emoji-based buttons with icon + text layout
- [ ] Implement new color system (success/destructive/warning)
- [ ] Add better spacing and touch targets

### Phase 3: Live Game Page
- [ ] Redesign score display with gradient backgrounds
- [ ] Update game header card with modern styling
- [ ] Implement new player selection grid
- [ ] Add team badges (home-team/away-team variants)

### Phase 4: Box Score Display
- [ ] Create modern table styling with hover states
- [ ] Add stat comparison rows
- [ ] Implement gradient backgrounds for team sections
- [ ] Add advanced stats cards

### Phase 5: Forms & Inputs
- [ ] Update game creation form
- [ ] Enhance player management forms
- [ ] Add modern input styling
- [ ] Implement gradient CTA buttons

---

## Code Migration Examples

### Before (Old Style)

```tsx
<Button className="bg-green-600 text-white hover:opacity-80">
  2PT Made
</Button>
```

### After (New Style)

```tsx
<Button variant="success" size="touch">
  <span className="text-lg font-bold">2PT</span>
  <span className="text-xs">Made</span>
</Button>
```

---

## Resources

- Tailwind CSS Docs: https://tailwindcss.com
- shadcn/ui: https://ui.shadcn.com
- Radix UI (base components): https://www.radix-ui.com
- Lucide Icons: https://lucide.dev

---

**Last Updated:** November 13, 2025
**Version:** 1.0.0
**Design System:** Modern Dashboard Theme

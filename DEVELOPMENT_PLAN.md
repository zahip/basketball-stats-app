# Basketball Stats App - Development Plan

This document outlines the planned development phases for the basketball stats application.

## Current Status: Phase 1 Complete ✅

The app has a solid foundation with real-time game tracking, offline support, and basic statistics.

### Phase 1: Core Game Experience (COMPLETED)

All core features for live game tracking are now functional:

1. ✅ **Game Details Page** (`/games/[id]`)
   - View complete game information
   - Start game button (PLANNED → LIVE transition)
   - Smart routing based on game status

2. ✅ **Live Box Score Display**
   - Real-time team statistics (FG%, 3P%, FT%, rebounds, assists, etc.)
   - Real-time player statistics table
   - Advanced metrics: eFG%, TS%, AST/TO ratio
   - Auto-refresh every 10 seconds

3. ✅ **Period & Clock Management UI**
   - Live countdown clock
   - Start/Pause controls
   - Next Period button
   - Quick time set buttons (10:00, 5:00, 2:00, 1:00)
   - Reset Clock and End Game buttons

4. ✅ **Play-by-Play Event Feed**
   - Scrollable feed of all game events
   - Color-coded by event type and team
   - Event icons for quick recognition
   - Grouped by period
   - Auto-refresh every 5 seconds

5. ✅ **Player Substitution Tracking**
   - SUB_IN / SUB_OUT event recording
   - Visual on-court vs bench indicators
   - Prevents having more than 5 players on court
   - Persists to localStorage

---

## Phase 2: Post-Game Features (NEXT UP)

**Goal**: View completed games and analyze performance

### Priority Features:

1. **Game Summary/Report Page** (`/games/[id]/summary`)
   - Final box score (team + players)
   - Four factors breakdown (eFG%, TO%, ORB%, FTR)
   - Game timeline/key moments
   - Export to PDF button

2. **Shot Chart Visualization** (`/games/[id]/shot-chart`)
   - Basketball court diagram using react-konva (already installed)
   - Plot made/missed shots by location
   - Filter by player, period, shot type
   - Heat map visualization
   - **Backend**: Add shot location (x, y coordinates) to event metadata

3. **Historical Games View** (enhance `/games`)
   - Filter by date range, opponent, status
   - Sort by date, score, etc.
   - Quick stats preview per game
   - Search functionality

4. **Player Season Statistics** (`/players/[id]/stats`)
   - Aggregate stats across all games
   - Averages: PPG, RPG, APG, FG%, etc.
   - Game log table
   - Trends/charts over time (using Recharts)

**Estimated Time**: 2-3 weeks

---

## Phase 3: Team & Event Management (MEDIUM PRIORITY)

**Goal**: Better control over data and corrections

### Features:

1. **Team Management UI** (`/teams/new`, `/teams/[id]/edit`)
   - Create new teams with name, season
   - Edit team details
   - View team roster
   - **Backend**: Add `POST /teams` and `PATCH /teams/:id` endpoints

2. **Event Editing/Correction**
   - View all events in a game
   - Edit event details (player, type, metadata)
   - Delete incorrect events
   - **Backend**: Add `PATCH /games/:gameId/events/:id` and `DELETE` endpoints

3. **Game Settings Configuration**
   - Set period length (10 min default → configurable)
   - Number of periods
   - Overtime rules
   - Shot clock settings
   - Store in Game model

4. **Shot Location Picker UI**
   - Interactive court overlay for recording shots
   - Tap court location when recording shot
   - Store x,y coordinates in event metadata
   - Enables heat map visualizations

**Estimated Time**: 2-3 weeks

---

## Phase 4: Analytics Dashboard (LOWER PRIORITY)

**Goal**: Advanced insights and metrics

### Features:

1. **Four Factors Dashboard** (`/games/[id]/analytics`)
   - Visual charts for four factors
   - Comparison bars (your team vs opponent)
   - Historical trends
   - Use Recharts for visualization

2. **Lineup Analysis**
   - Plus/minus by lineup combination
   - Best/worst performing lineups
   - Requires substitution tracking (completed in Phase 1)
   - **Backend**: Aggregation queries needed

3. **Advanced Player Metrics**
   - PER (Player Efficiency Rating)
   - Usage rate
   - Offensive/Defensive ratings
   - **Backend**: New calculation functions

4. **Team Season Dashboard** (`/teams/[id]/season`)
   - Season overview (record, avg points, etc.)
   - Standings (if multi-team)
   - Top performers
   - Season trends

**Estimated Time**: 3-4 weeks

---

## Phase 5: Polish & Scale (NICE-TO-HAVE)

**Goal**: Production-ready, multi-user app

### Features:

1. **Multi-Team Support**
   - User can manage multiple teams
   - Team selection/switching
   - Separate rosters per team

2. **Enhanced Mobile Experience**
   - Touch-optimized controls
   - Landscape mode for live tracking
   - PWA enhancements (install prompts, offline indicators)
   - Gesture support (swipe to undo, etc.)

3. **Keyboard Shortcuts**
   - Hotkeys for common actions
   - Number keys for player selection
   - Letter keys for action types
   - Speed up stat entry

4. **PDF Export**
   - Professional game reports
   - Use @react-pdf/renderer or puppeteer
   - Include box scores, charts, summary

5. **Testing Coverage**
   - Unit tests for critical functions
   - Integration tests for API routes
   - E2E tests for game flow
   - Vitest already configured

**Estimated Time**: 2-3 weeks

---

## Technical Debt & Improvements

### High Priority:

- [ ] **Event type consistency** - Frontend/backend mapping is now solid but needs testing
- [ ] **Error handling** - Some API errors not user-friendly
- [ ] **Loading states** - Some pages missing proper loading UIs
- [ ] **Test coverage** - No tests written yet (Vitest configured but unused)

### Medium Priority:

- [ ] **Player ID format** - Mixing numbers (jersey) vs UUIDs needs normalization
- [ ] **Minutes played calculation** - Currently 0, needs SUB_IN/SUB_OUT tracking implementation
- [ ] **Plus/minus calculation** - Currently 0, needs score differential tracking
- [ ] **Performance optimization** - Box score polling could be more efficient

### Low Priority:

- [ ] **Box score broadcasting** - Commented out, needs implementation
- [ ] **Hardcoded values** - Default clock (600s), period (1), etc.
- [ ] **Event type mapping** - Could be cleaner with TypeScript enums

---

## Missing Features for Complete Basketball Stats App

Comparing to professional stats apps (Synergy, Krossover, Hudl):

### Critical Missing:
- ✅ Live box score display (COMPLETED)
- ✅ Player on-court tracking (COMPLETED)
- ✅ Period management controls (COMPLETED)
- ✅ Game clock management (COMPLETED)
- ✅ Full game reports/summaries (COMPLETED - basic version)
- 🔲 Shot location tracking with court diagram (Phase 2)

### Important Missing:
- 🔲 Lineup analysis and plus/minus (Phase 4)
- 🔲 Team management (multiple teams) (Phase 3)
- 🔲 Season/league standings (Phase 4)
- 🔲 Advanced metrics dashboard (Phase 4)
- 🔲 Video integration (not planned)
- 🔲 Notification system (not planned)

### Nice to Have:
- 🔲 Mobile app (currently PWA)
- 🔲 Opponent scouting database (not planned)
- 🔲 Play calling system (not planned)
- 🔲 In-game notes/commentary (could add in Phase 3)
- 🔲 Social sharing (not planned)
- 🔲 Multi-language support (not planned)

---

## Recommended Next Steps

Based on current state and user needs:

### Immediate (Next Session):
1. **Test the app end-to-end** - Record a full game and verify all features work
2. **Fix any bugs discovered** - Event sync, real-time updates, box score calculations
3. **Start Phase 2** - Shot chart is the most valuable next feature

### Short Term (1-2 weeks):
1. **Implement shot chart visualization** - Most requested feature
2. **Add game summary/report page** - Complete the post-game experience
3. **Write critical tests** - Prevent regressions

### Medium Term (1-2 months):
1. **Complete Phase 2** - Historical games, player season stats
2. **Start Phase 3** - Team management, event editing
3. **Performance optimization** - Reduce polling, optimize queries

### Long Term (2-3 months):
1. **Complete Phase 3** - Full CRUD operations
2. **Start Phase 4** - Advanced analytics
3. **Consider Phase 5** - Polish and scale

---

## Development Philosophy

### Principles:
1. **Offline-first** - Game tracking must work without internet
2. **Real-time** - Updates should be instant across all devices
3. **Data integrity** - Idempotency and atomic operations prevent duplicates/race conditions
4. **Mobile-optimized** - PWA with touch-friendly controls
5. **Simple UX** - Minimize clicks to record events

### Architecture Decisions:
- **Hybrid real-time** - Optimistic updates + broadcast + database fallback
- **Event-sourced** - All stats derived from immutable event log
- **Atomic increments** - Prevent race conditions in concurrent updates
- **Idempotency keys** - Prevent duplicate event processing

---

## Notes

- This plan is flexible and can be adjusted based on user feedback
- Each phase is designed to deliver immediate value
- Phases can be worked on in parallel if needed
- Testing should be added incrementally, not as a separate phase
- Security and performance should be considered in every phase

**Last Updated**: January 2025 (after Phase 1 completion)

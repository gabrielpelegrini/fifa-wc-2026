---
Task ID: 1
Agent: main
Task: Build complete FIFA World Cup 2026 webapp

Work Log:
- Created full data layer: 48 teams (12 groups), 72 group matches, bracket config for R32→Final
- Implemented standings calculation with full tiebreaker logic (points > GD > GF > H2H > fair play)
- Implemented third-place ranking system with 8 qualifying teams across pool slots
- Built Zustand store with reactive state: score changes propagate to standings, thirds, and bracket
- Built Calendar component with filters (group, team, round), timezone conversion, venue display
- Built GroupTables component with 12 group tables + third-place ranking section
- Built KnockoutBracket with visual bracket (desktop) and linear list (mobile)
- Built CrossoverPredictor showing possible paths for 1st/2nd/3rd place finishes
- Built ScoreInput dialog for manual score entry (group + knockout matches)
- Added dark mode, responsive mobile-first layout, country flags via flagcdn
- Fixed bracket resolver to only show slot labels until groups have matches played
- All lint checks pass, no runtime errors

Stage Summary:
- Deliverable: Fully functional webapp at / route
- Key files: src/data/worldcup.ts (data), src/lib/standings.ts, src/lib/thirdPlaceRanking.ts, src/lib/bracketResolver.ts (logic), src/store/worldCupStore.ts (state), src/components/worldcup/* (UI)
- Data structure ready for API plug-in (knockoutResults Map + match scores)
- TBD placeholders used for unknown teams per user requirement
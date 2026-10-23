# Leviathan — Build Brief: Councilman Chapter (First Task)

This brief is for Claude Code. Read it together with the **Game Design Document** and the **Art & Game Feel** doc. Your job right now is to build only the **first playable slice**: Chapter 1, the Councilman. Don't build the mayor, presidency or world phases yet. Design the architecture so they can be added later.

## Goal of this milestone

A small, polished, playable vertical slice. A player starts as a newly elected city councilman in a fictional Brazil-inspired city and plays turn by turn from the desk. The run ends either with a mayoral candidacy or with the player's career over. It should already feel like the real game, with the desk, consequences, social groups and hidden morality, at small scale.

## Tech stack (fixed)

- TypeScript + React (Vite) for the desk and all UI
- PixiJS for the stylized city map, integrated into React
- GSAP and/or Framer Motion for UI animation
- Howler.js for audio
- State: a single serializable game-state object with a pure `advanceTurn(state, decisions)` simulation function. Keep simulation logic separate from UI so it can be tested.
- Content as data: events, laws, books, characters and groups live in JSON/TS data files, not hard-coded in components
- Save/load to localStorage
- Unit tests for the simulation (Vitest)

## Scope: what to build

### 1. Game state and turn system

- One turn = one week
- A "Next week" button resolves decisions and runs the simulation
- A delayed-consequence queue: decisions can schedule effects N turns in the future

### 2. Social groups

- 6 groups to start: workers, business owners, students, retirees, religious voters, the poor periphery
- Each group has an opinion of the player (-100 to 100), a list of concerns and a **memory** of past actions that slowly fades, so trust can't be bought back instantly

### 3. Hidden variables (never shown directly)

- **Integrity/corruption score:** moves with choices like accepting donations or trading favours
- **Expectations meter:** rises with populist promises and causes a crash in support if the player doesn't deliver
- **Dossier:** a list of compromising acts that can be exposed later
- Communicate them only indirectly, through how characters and the press treat the player

### 4. Party

- At the start, choose one of 4 fictional parties (left labour, liberal market, conservative, centrão-type)
- The party sets starting group opinions and relationships with party bosses

### 5. Player actions (the desk)

- **Propose small laws:** a list of local bills, each affecting groups, budget and scheduled consequences
- **Social media:** post content, either informative or populist (fast popularity, higher expectations)
- **Neighbourhood work:** build a base in one chosen neighbourhood
- **Meetings:** with party bosses, donors and community leaders
- **Read books:** a library of 3 to start (Machiavelli, Keynes, Hayek). Each takes a few turns to read and unlocks new law or dialogue options

### 6. Characters

- The **Mentor** (party veteran, gives advice, has hidden agendas)
- The **Rival** (another councilman climbing alongside you)
- The **Journalist** (investigates you, and grows more dangerous as the dossier grows)
- Characters send messages and requests to the desk, and their tone reflects hidden morality

### 7. Events (never random)

- Every event must be triggered by state conditions or past choices, never by pure chance
- After each crisis, a **newspaper article** explains the cause-and-effect link to the player's earlier choice

### 8. Conspiracy mini-game (basic version)

- One scheme type for now: hiding an illegal campaign donation
- The player chooses intermediary, payment method and who knows
- Each weak link adds a traceable "thread" to the dossier that the Journalist can pull later

### 9. The city map (PixiJS)

- A simple stylized top-down map with \~6 neighbourhoods
- Visual reactions: protest markers, construction, neighbourhood mood tint
- Zoom out from the desk to the map

### 10. Chapter goal and endings

- To run for mayor, the player needs (1) the party nomination, (2) campaign money and (3) support from at least 3 social groups
- **Success:** "Mayoral candidacy announced" screen (the slice ends here)
- **Game over:** arrested, expelled from the party, or completely lost public support
- End screen: a short **legacy page** written like a newspaper or history book

## Out of scope for now

Mayor and later chapters, debates, the world map, real AI-generated art (use placeholders with clear filenames), and final music (use placeholder hooks).

## Working rules

- Start by proposing the folder structure and data model, then build in small, testable steps
- Keep all balance numbers in a single config file
- Commit after each working feature
- Prioritize game feel from day one (see the Art & Game Feel doc), with animated transitions on every desk interaction

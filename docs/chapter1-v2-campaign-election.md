# Leviathan — Chapter 1 v2: Money, Projects, Campaign & Election Night

**For Claude Code.** This extends the Councilman chapter that already exists in this repo. Read `README.md`, `src/content/balance.ts`, `src/core/types.ts` and `src/chapters/councilman/` first. Do **not** rewrite the engine. Extend it with the same patterns: pure simulation, effects DSL, content as data, every number in `balance.ts`, tests in Vitest.

Design rules stay the same:
- **Nothing is random.** Every outcome comes from state and past choices. No `Math.random` anywhere in the simulation.
- **Always show the cause.** Every consequence links back to the decision that caused it (newspapers, week report, election-night narration).
- **Morality stays hidden.** No project, path or choice is ever labelled "good", "bad", "corrupt" or "honest" in the UI.
- In-game text is Portuguese, using the existing templates (`{{player}}`, `{{g:o/a}}`, `{{date:...}}`).

Before coding, propose the data-model changes and a step plan, and wait for Lucas's approval. Then build in the order of section 11, commit after each step, and briefly explain key decisions (Lucas is a CS student and wants to learn as you go).

---

## 0. What exists today (and what changes)

| Today | Problem | v2 |
|---|---|---|
| `funds` comes in (vaquinha, donor, events, schemes) and is only checked against `fundsNeeded: 60` at the convention | Money does nothing | Money buys neighbourhood projects during the term and fuels the campaign |
| `capital` is spent on laws and lobbying | Works well | Keep as is |
| Two laws are gated by books (`downtown_tax_cut` ← Hayek, `public_works_jobs` ← Keynes) | Books unlock, but don't feel like "learning" | Books unlock *smarter versions* of projects and reveal hidden consequences |
| No law is quietly harmful | Nothing tempting | Tempting projects that only help the elite, and corrupt offers that only appear to compromised players |
| Week 40 convention: candidacy / kingmaker / passed_over | One door, one check | End-of-term choice of three paths, an 8-week campaign, and a real vote count |
| No election | No climax | Election night on an old TV, with a live vote-count chart |

---

## 1. Money gets real uses

Principle: **capital is power inside the Câmara; funds are power in the streets.** Clean money is slow, dirty money is fast.

### 1.1 Track where money comes from
- Extend the `funds` effect with an optional `source: "clean" | "dirty"` (default `"clean"`).
- Keep running totals in `flags` (`income_clean`, `income_dirty`, `spent_total`), so the legacy page and the journalist can read them.
- Tag existing content: donor favours, `teixeira_donation` and any kickback are `dirty`; vaquinha, the party dinner and small donors are `clean`.

### 1.2 Neighbourhood projects ("Ajuda do gabinete")
New action in `NeighbourhoodPanel`. The councilman pays from the war chest for a visible fix done with the residents' association, which is exactly how 1980s assistencialismo worked. Each costs funds and one agenda slot, and each neighbourhood can only receive one every `projectCooldownWeeks`.

| Id | Name (pt) | Funds | Immediate | Later |
|---|---|---|---|---|
| `nb_potholes` | Mutirão tapa-buraco | 4 | mood +, base + | Cheap fix: potholes return after 8 weeks (newspaper links back) |
| `nb_pitch` | Reforma do campinho | 8 | mood +, periphery/workers opinion + | 10 weeks later: youth league starts, religious + |
| `nb_lights` | Postes de luz na viela | 6 | mood + | 6 weeks later: fewer robberies, retirees + |
| `nb_community_center` | Reforma do centro comunitário | 12 | base ++ (with Dona Lurdes, relation +) | Becomes a campaign rally venue (cheaper rallies there) |
| `nb_cleanup` | Mutirão de limpeza | 3 | mood + | none |

Hidden twist: each project also adds a little to **expectations** ("o vereador resolve tudo"). Too much assistencialismo, and people start expecting you to fix everything.

### 1.3 Money that leaves trails
- New investigation rule: during the campaign, if `spent_total` is much larger than `income_clean × campaignSpendSuspicionRatio`, the journalist's investigation speeds up ("gastos incompatíveis com a arrecadação declarada").
- Spending dirty money is fast, but the more visible the spending, the louder the trail.

### 1.4 Remove the `fundsNeeded` goal
Money is no longer a pass/fail gate. Its value is what it buys in the campaign (section 5).

---

## 2. Books unlock better projects

### 2.1 Upgrades
Add `upgradeOf?: LawId` to `LawDef`. The *naive* version is always available. The *upgraded* one appears next to it once the book is finished, grouped in the UI as "Versão aprimorada · desbloqueada por {book}".

| Naive (always available) | Upgrade | Book |
|---|---|---|
| **Cesta Básica Municipal** (new): fast periphery and religious support, big expectations; ends after 12 weeks and opinion drops | `public_works_jobs` (existing): costs more, pays off in jobs and lasting mood | Keynes |
| **Tabelamento de Preços na Feira** (new): retirees and workers love it, and 6 weeks later the feirantes leave and stalls stay empty | `street_market` regularization (existing, now marked as its upgrade) | Hayek |
| `contract_transparency` (existing) | Same law, with the hint line shown (see 2.2) | Faoro (new, optional) |

### 2.2 Books let you *see* consequences
When a book covering a law's topic is finished, the law paper shows a hint line about its delayed follow-up, for example "Analistas preveem: as empresas de ônibus vão cortar linhas noturnas." This is the learning mechanic: knowledge means foresight.
- Keynes and Hayek reveal follow-ups on economic topics (transport, wages, taxes, construction).
- Machiavelli reveals the hidden cost line on **offers from people** (donor letters, deals).
- **Optional new book:** *Os Donos do Poder*, Raymundo Faoro (1958), about Brazilian patrimonialism and the state captured by private interests. It reveals hints on corrupt offers and unlocks a stronger `contract_transparency`. It's a real book, Brazilian, and it fits the theme perfectly.

---

## 3. Tempting projects that hurt quietly

Never labelled. They look like progress, and the consequences reveal them.

### 3.1 Open to everyone: good for the elite only
| Id | Name (pt) | Looks like | Really |
|---|---|---|---|
| `beach_overpass` | Viaduto do Jardim Atlântico | Modern city, construction markers, prestige (+capital), business and Jardim Atlântico retirees happy | 10 weeks later: budget pulled from Morro bus lines and the health post (newspaper explains); Teixeira Construções wins the contract (donor relation +) |
| `downtown_revitalization` | Revitalização do Centro | Clean Centro, business and Centro mood up | Removes the camelôs: workers and periphery lose income, protest marker, newspaper a few weeks later |

### 3.2 Corruption-gated: offers from the donor
These only appear when `integrity <= corruptOfferIntegrity` **or** the player has `owes_teixeira` / `hid_donation`. They arrive as a desk letter from Augusto Teixeira titled "Uma pequena oportunidade". Honest players never see them.

| Id | Name (pt) | Private gain | Later |
|---|---|---|---|
| `emergency_paving` | Asfaltamento Emergencial | 20k dirty funds ("comissão"), donor + | 8 weeks: asphalt cracks in Vila Operária, newspaper links the overpriced contract; dossier thread |
| `morro_rezoning` | Rezoneamento da Mata do Morro | 30k dirty funds, donor ++ | 14 weeks: in the rainy season, deforestation causes a landslide in Morro da Esperança. Triggered by condition (law passed + rainy week), never random. Big newspaper; dossier thread |
| `school_lunch_contract` | Merenda Escolar Terceirizada | 15k dirty funds | 6 weeks: worse school lunches, students and periphery down |

Accepting one: the player proposes it like a normal law (capital cost, Câmara vote) and gets the private gain on approval, plus a dossier entry with threads.

---

## 4. End of term: three paths (replaces the convention)

Timeline (all in `balance.ts`):
- Weeks 1–32: governing (as today).
- Week 28: party letter warns that the decision is near and says, in words, which doors look open.
- **Week 32: "Decisão de candidatura".** A desk paper with one choice per path. Unavailable paths are shown greyed out with the reason in words.
- Weeks 33–40: campaign (section 5).
- End of week 40: election night (sections 6–7).

| Path | Requirement | Fantasy |
|---|---|---|
| **Reeleição — vereador(a)** | Party gives you a number: boss relation ≥ `reelectionBossRelation` (low). Always the fallback | Safe. Defend your record. Win by finishing among the party's top `councilSeatsForParty` candidates |
| **Prefeito(a)** | Existing nomination rule (boss ≥ 40 and has not backed Renata) | Risky. Face the big candidates, and you need many groups, not one neighbourhood |
| **Deputado(a) estadual** | Boss ≥ `deputyBossRelation` | Middle path. Votes across the whole state; party machinery and local allies matter more than charisma |

- The kingmaker deal (`backed_rival`) closes the mayor path, and gives a re-election bonus: council presidency (capital) and Renata's endorsement.
- `GoalsCard` becomes a **"Caminhos"** card showing the three paths and their status in words (hidden numbers stay hidden).
- Remove the `passed_over` ending, since re-election is always the fallback. Keep `arrested`, `expelled` and `lost_support`; they can still happen during the campaign.

---

## 5. The campaign (weeks 33–40)

### 5.1 The desk changes
- The Câmara goes into recess ("recesso branco"): the bills panel is locked and shows that.
- Campaign props replace the bills folder: santinhos, a flag, a campaign folder.
- Music shifts to the campaign stem. Still 3 agenda slots.

### 5.2 Campaign actions (cost funds; pure functions in `actions.ts`)
| Action | Cost | Effect | Catch |
|---|---|---|---|
| **Comício** in a neighbourhood | 8 | Big campaign presence there, rally marker | If base there is below `rallyMinBase`, the square is empty and the newspaper mocks it |
| **Mídia** (era channel, from `media.ts`) | free or paid spot (5) | As today, plus a paid spot that reaches more neighbourhoods | Populist still raises expectations |
| **Carro de som** in a neighbourhood | 3 | Presence +, expectations + | Annoys São Bento retirees (noise complaint) |
| **Cabos eleitorais** in a neighbourhood | 6 | Presence grows every remaining week | Paid with dirty money → thread |
| **Apoio** (endorsement meeting) | 0–capital | Dona Lurdes, a pastor, the union, Associação Comercial: transfers part of that group's vote | Requires relation; the endorser asks for a promise (expectations) |
| **Viagem ao interior** (deputy path only) | 10 | Presence in one of the 4 state regions | Time away: Porto Ferro presence decays a little |
| **Vaquinha / jantar de adesão / donor** | — | Money | Same clean vs dirty rules |
| **Compra de votos** (scheme, only when integrity is low) | 25 | Huge presence in one neighbourhood | Uses the existing scheme/conspiracy system: 3+ threads; the journalist loves it |

### 5.3 Opponents attack your record (deterministic)
- Each campaign week, each opponent uses the **strongest item in your history** against you: an exposed dossier entry, a law whose follow-up hurt a group, broken promises (expectations above tolerance), a betrayal (party switch, the Renata deal).
- It lands on the desk as a paper ("Renata acusa: ..."). Responses:
  - **Rebater com fatos:** works if you have a related book or a good record on that topic.
  - **Contra-atacar:** hurts the opponent, but backfires with retirees and religious voters.
  - **Ignorar:** the attack keeps costing votes in the neighbourhoods it targets.
- The player can also **use the record**: a "Prestação de contas" ad about a passed law with good outcomes gives a bonus in the neighbourhoods it helped.

### 5.4 Polls
The week report shows a **poll** ("Pesquisa Ibope-style"; fictional institute name). It is the vote model from **last week**, city-wide only, rounded. It's deterministic, but always one week behind, so there's still tension.

---

## 6. Vote model (pure, deterministic)

New module `src/chapters/councilman/election.ts`:

```ts
computeElection(state: GameState, path: PathId): ElectionResult
```

### 6.1 Inputs
- **New content:** `voters` and `turnout` per neighbourhood (São Bento has high turnout, Morro lower), in `neighbourhoods.ts`.
- **Player score per neighbourhood** = resident-weighted group opinions + base + campaign presence + endorsements − scandal and broken-promise penalties.
- **Opponent score per neighbourhood** = a fixed profile (data) plus reactions to the player. For example, the populist gains where the player's expectations crashed, and the businessman gains where business dislikes the player.
- **Shares:** `share_i = score_i^k / Σ score^k` (k in balance), after floor-clamping scores to a minimum. **Brancos e nulos** grow with low neighbourhood mood, which is a nice 1989 detail.
- **Deputy path:** Porto Ferro plus 4 fictional state regions (new content `regions.ts`: Serra Alta, Campo Seco, Vale do Ipê, Porto Novo), each with voters and a group mix. Player support there comes from party strength, regional endorsements, interior trips and mentor relation.
- **Re-election:** the player and 3 fictional same-party council candidates compete for the party's last seats. Win if you finish in the top `councilSeatsForParty`.

### 6.2 Output
```ts
interface ElectionResult {
  path: PathId;
  candidates: { id: string; name: string; party: string; portrait: string }[];
  /** Fixed reporting order; the drama lives here. */
  batches: {
    unitId: string;          // neighbourhood or region
    label: string;           // "Urnas da Vila Operária"
    votes: Record<string, number>;
    cumulativePct: number;   // % of ballots counted after this batch
  }[];
  final: Record<string, number>;
  winner: string;
  /** Top reasons per unit, for the narrator ("No Morro, o saneamento pesou a favor"). */
  causes: { unitId: string; text: string; cause: Cause }[];
}
```

### 6.3 Reporting order = the drama
- It's 1989: **paper ballots counted by hand in a gymnasium**, so urns from far away arrive last.
- Each neighbourhood is split into 3–5 batches. Order is fixed by distance from the counting centre: Centro → Jardim Atlântico → São Bento → Cidade Universitária → Vila Operária → Morro da Esperança. Deputy: Porto Ferro first, then the interior regions.
- So a player whose base is in the periphery **starts losing and climbs back late**, and a downtown-elite player starts strong and sweats at the end. The result is decided by choices; only the reveal is staged.

### 6.4 Tests
- Same state → identical result (run twice, deep-equal).
- Batches sum to the final; `cumulativePct` is monotonic and ends at 100.
- Scenario fixtures: a periphery-strong player trails at 50% and wins at 100% (a lead change exists); an elite-strong player leads early.
- Every path produces a winner; no NaN with zero support.
- Extend `npm run sim` to print election results for several strategies (honest periphery, corrupt donor, populist, elite) so the balance can be tuned.

---

## 7. Election night on an old TV

### 7.1 Flow
1. After the week-40 "Next week", the desk goes to **night** (lights dim, city sounds outside).
2. An old CRT TV on the desk turns on (power-on effect), and the camera zooms into it until it fills the screen.
3. Broadcast: **"PLANTÃO ELEITORAL"** on the fictional channel **TV Porto Ferro**, with anchor **Cid Monteiro** in the corner.
4. Batches report one by one. Lead change: a **"VIRADA!"** stinger. Close race: pacing slows.
5. At 100%: freeze, the anchor's line, the crowd outside reacts, then cut to the ending newspaper.

### 7.2 Screen layout (inside the TV)
- **Top:** "APURAÇÃO · 63% DAS URNAS" with a progress bar.
- **Main:** a line chart of each candidate's % over % counted. Lines cross, which is where the tension is.
- **Side:** bar totals with small candidate portraits and vote numbers ticking up.
- **Mini map:** the city (or state) with each counted unit lit in the local winner's colour.
- **Bottom ticker:** narrator lines built from `causes` ("Urnas do Morro chegando: o saneamento pesou a favor de {{player}}").
- Occasional cutaway: a still of the counting gymnasium between segments.
- **Controls:** pause, 2× speed, skip to the result. The player can't change anything; it's already decided.

### 7.3 How to animate it
- **Separation:** the simulation precomputes the whole `ElectionResult`. The UI only replays it. Never compute votes in React.
- **GSAP master timeline**, one label per batch:
  - Numbers: tween a proxy object with `snap` for integer counts.
  - Line chart: hand-rolled SVG (no chart library, so it looks like 80s TV graphics). Append one point per batch and draw the new segment with a `stroke-dashoffset` tween.
  - Bars: width tween; the leader's bar pulses.
  - Pacing: ~1.5 s per batch, ~3 s in the last 20% or when the margin is under `closeRaceMargin`.
- **CRT look in CSS** (no art needed for the effect itself):
  - Screen `div` with rounded corners (barrel feel), inset box-shadow vignette.
  - Scanlines overlay: `repeating-linear-gradient(rgba(0,0,0,.25) 0 1px, transparent 1px 3px)`.
  - Subtle flicker: keyframes on opacity 0.97–1.
  - RGB split on big numbers via `text-shadow` (red/cyan offsets); slight glow.
  - Static between segments: a small canvas noise layer at ~15 fps.
  - Power on: screen `scaleY` from 0.01 to 1 with a white line flash and brightness 3 → 1. Power off is the reverse, down to a dot.
- **TV frame:** a PNG of the TV set with a transparent screen hole, layered over the screen `div` (position via CSS variables matching the hole).
- **Typography:** a bold condensed broadcast font from Google Fonts (e.g. Oswald or Anton), yellow numbers on a blue gradient, the classic Brazilian election-coverage look.
- **Audio:** TV power-on, plantão jingle, a tick per batch, a lead-change sting, static, and the crowd outside growing with your share in the neighbourhood just reported. Feed the margin into the existing `tension.ts` to drive the music stems.
- **Accessibility:** respect `prefers-reduced-motion` (no flicker, no shake, instant chart).

---

## 8. Outcomes

| Ending id | Tone | When |
|---|---|---|
| `reelected` | victory (bittersweet if by a hair) | Re-election win |
| `elected_mayor` | victory | Mayor win (replaces `candidacy`) |
| `elected_deputy` | victory | Deputy win |
| `defeated_council` / `defeated_mayor` / `defeated_deputy` | defeat | Loss → **game over** |
| `arrested`, `expelled`, `lost_support` | defeat | Unchanged; can fire during the campaign too |

- The legacy page includes the election result and the top causes.
- Victory endings say the next chapter is "coming soon" for now.
- Bump the save version and add a migration (old saves past week 32 jump straight to the path decision).

---

## 9. New balance keys (`balance.ts`)
`campaign.decisionWeek (32)`, `campaign.warningWeek (28)`, `campaign.startWeek (33)`, `paths.reelectionBossRelation`, `paths.deputyBossRelation`, `paths.councilSeatsForParty`, `projects.cooldownWeeks`, `projects.expectationsPerProject`, `campaign.rallyCost`, `campaign.rallyMinBase`, `campaign.soundTruckCost`, `campaign.cabosCost`, `campaign.paidMediaCost`, `campaign.interiorTripCost`, `campaign.presenceDecay`, `campaign.spendSuspicionRatio`, `corruptOfferIntegrity`, `election.shareExponent`, `election.minScore`, `election.nullVotesPerMoodPoint`, `election.batchesPerUnit`, `election.closeRaceMargin`, and endorsement weights.

## 10. Content to write (data files)
- `neighbourhoods.ts`: add `voters`, `turnout`.
- `regions.ts` (new): 4 state regions with voters and group mix.
- `candidates.ts` (new):
  - Mayor: **Renata Saldanha** (the Rival, running by another party if the player took the nomination), **Roberto Galvão** (businessman, backed by the Associação Comercial and Teixeira), **Tião Barbosa** (radio host turned populist, perfect for the radio era).
  - Deputy: **Dr. Heitor Campos** (old interior oligarch), **Pastora Márcia Lemos** (evangelical), **Jorge "Jorginho" Prates** (union leader).
  - Council (same party): **Professor Nilton**, **Sargento Moura**, **Dona Cleide da Feira**.
  - Each candidate: fixed neighbourhood/region profile and reaction rules.
- `laws.ts`: Cesta Básica, Tabelamento de Preços, Viaduto, Revitalização do Centro, the 3 donor offers, `upgradeOf` links, hint lines.
- `projects.ts` (new): the 5 neighbourhood projects.
- `books.ts`: optional Faoro.
- `endings.ts`: the new endings in the newspaper style already used.
- Narrator lines for election night (`election_lines.ts`), keyed by situation: opening, unit reported, lead change, close race, landslide, final win, final loss.

## 11. Build order
1. Funds sources (clean/dirty) and neighbourhood projects.
2. Book upgrades, hint lines, tempting projects, donor offers.
3. Path decision (week 32), Caminhos card, campaign desk and actions, opponent attacks, polls.
4. Vote model and tests, plus `npm run sim` election reports. **Balance here before any UI.**
5. Election-night TV (placeholder TV frame and anchor first, effects in CSS and GSAP).
6. Endings, legacy page and save migration.

Use placeholder art and audio with the filenames from the asset list (Lucas has a separate PDF of every new asset), via `scripts/gen-placeholders.ts`, and register them in `src/ui/assets.ts`.

## 12. Open question for Lucas (ask before step 3)
**Calendar.** The game starts in January 1989 and the chapter lasts 40 weeks, so the election would land in October 1989. In real Brazil, councillors elected in 1988 served until 1992, municipal elections were in October 1992, and state-deputy elections in 1990. Options:
- (a) Keep it as is: a compressed, fictional calendar.
- (b) At week 32, a time-skip ("Três anos depois...") so the campaign happens in 1992, which also keeps the radio era.

Recommend (b), but let Lucas decide.

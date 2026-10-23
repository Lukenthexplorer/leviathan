# Leviathan — Game Design Document

## Vision

Leviathan is a turn-based political strategy "thinker" game. You start as a city councilman (vereador) in a fictional country heavily inspired by Brazil and climb, choice by choice, to the presidency and the world stage. It uses real political concepts, real economic mechanics and real thresholds, so players learn how power actually works while playing. The name comes from Thomas Hobbes's *Leviathan*: the state as a giant creature, and the player slowly becoming it.

Pillars:

- **Every choice has a cause and an effect.** Nothing is random.
- **Morality is hidden.** No menus ask "honest or corrupt?". The player drifts toward a side through their actions.
- **Learning is power.** Real books and ideas unlock real policies and arguments.
- **Thinking over reflexes.** The fun is in decisions, not mechanical skill.

## Setting

- A fictional country heavily inspired by Brazil: coalition politics, a "centrão"-style party bloc, deep inequality, a powerful Congress, an active press and judiciary.
- Fictional parties based on real ideologies: a left labour party, a liberal market party, a conservative party, and a big centrão-type party that bends to whoever holds power.
- The player picks a party at the start. The party shapes starting allies and which social groups trust them. Switching parties later is possible, but voters and old allies see it as betrayal.

## Core gameplay loop

- **Turn-based.** Each turn is one week or one month, depending on the phase. The presidential campaign uses one-week turns.
- **The Desk (main screen).** News, messages, meetings, reports, proposals and dilemmas land on your office desk. You read, decide, sign and stamp.
- **"Next week" button.** You end the turn and the consequences play out.
- **The Living Map.** Zoom out to a stylized city map, later the state, country and world, where you can watch your choices play out: protests, construction, neighbourhoods rising or decaying.
- Target feeling: "just one more turn", like Civilization and Football Manager.

## The people: social groups

- There is no single popularity number. The population is split into groups such as workers, business owners, students, retirees, religious voters, the middle class and the poor periphery.
- Each group has its own concerns, opinions and **memory**. They remember what you did, so you can't buy them back overnight.
- Example: raising bus fares pleases business owners but sends students into the streets, like the 2013 protests in Brazil.

## Key characters

- **The Rival.** A politician who climbs alongside you throughout your career.
- **The Journalist.** Stubborn and keeps digging into you. Can expose anything you've hidden.
- **The Mentor.** An old party figure who teaches you the game and may betray you later.
- **Running mate.** Chosen in the presidential campaign. Can help or betray.

## Hidden morality: honest vs corrupt

- Nothing on screen asks you to choose a path, and you never see a morality meter.
- Small choices add up: one "harmless" campaign donation, then a favour, then another, until you're deep in it.
- You learn where you stand only from how people treat you.
- **Corrupt path:** easier at first, with more allies, money and votes. Every favour goes into a secret dossier that can surface at the worst moment through journalists, investigations or rivals, like Lava Jato.
- **Honest path:** considerably harder, with fewer allies, but nobody can blackmail you and your support is more loyal.

## Conspiracy system (shared mechanic)

One planning mini-game covers every scheme: hiding bribes, rigging votes, silencing enemies.

- You choose who carries it out, how they're paid and who knows about it.
- Every weak link becomes a loose thread that investigators can pull later.
- An imperfect plan leaves trails that lead back to you.
- Extreme example: once powerful (mayor or above), you can order the journalist killed. It is never a clean solution. The journalist may already have sent the files to a colleague, the hitman now owns you, and a martyr's death can turn them into a national symbol against you. It solves one problem and creates worse ones, with heavy hidden morality and corruption consequences.

## Learning system: books as a skill tree

- Reading real books unlocks real ideas, policies and moves. For example, Keynes unlocks stimulus policies, Hayek unlocks deregulation, Machiavelli unlocks backroom deals, and Hobbes's *Leviathan* is in the library too.
- Books also unlock stronger arguments in debates.

## Popularity and populism

- Popularity can be raised through social media work, populist promises and real results.
- Populism builds a hidden **expectations meter**. Popularity rises fast, but if you can't deliver, the crash is brutal.

## Realistic economics: delayed consequences

- Choices don't take effect immediately. For example, printing money makes everyone happy now, and two years later inflation explodes during your re-election campaign.
- Real concepts and thresholds include inflation, deficits, debt, unemployment, interest rates and investment.

## Cause and effect, always shown

- Crises are **never random**. Each grows out of the player's own decisions or neglect. Cut drainage and a flood comes later. Close a youth centre to fund a stadium and crime rises.
- The game **always shows the connection**, inside the world, for example through a newspaper analysis such as "Experts link flood to 2027 drainage cuts."

## Career progression

### Chapter 1: Councilman

- You start as a nobody with almost no power.
- Your tools: propose small laws, make noise on social media and build a base in one neighbourhood.
- To run for mayor you need three things: (1) your party's nomination, which means pleasing the party bosses, (2) campaign money and (3) support from at least a few social groups.
- Each requirement tempts you toward shortcuts such as dirty money or populist promises.

### Chapter 2: Mayor

- You get a real budget: buses, health, police, schools, drainage or that flashy stadium. The city map visibly changes.
- New headaches: a city council that can block you, unions that can strike, and crises that come from your past choices.

### Chapter 3: The branch

- **Governor:** executive power. You run a state, with police, schools and a large budget.
- **Federal deputy or senator in Brasília:** negotiation. Congress, alliances and horse-trading votes.
- Both paths lead to the presidency but train different skills, which adds replay value.

### Chapter 4: Presidential campaign (the climax)

- An intense phase played in one-week turns.
- Build a coalition of parties, since nobody wins alone.
- Choose a running mate, who may help or betray you.
- Choose your core message: economy, security, fighting corruption and so on.
- Rivals dig up everything from your entire career.
- **Debate mini-game (a favourite feature).** You answer questions while the audience reacts live. Each answer is judged on **facts** (wins educated voters), **emotion** (moves the masses) and **attack** (hurts rivals but backfires if you go too far). Books read earlier unlock stronger arguments.

### Chapter 5: The presidency

- There's no "become dictator" button. Authoritarianism creeps in through steps that each look reasonable: emergency decrees, packing the supreme court, pressuring the press, buying military loyalty, postponing elections "because of the crisis".
- With a congressional majority, the slide gets easier.
- Every step adds power but alarms the institutions, the opposition and foreign countries.
- Overreaching before you're strong enough can lead to impeachment or a coup against you.

### Chapter 6: The world stage

- After the presidency, the map zooms out to the whole world.
- Tools: trade deals, alliances, the UN, sanctions and, as a last resort, war.
- **As a democrat:** easy trade and allies, but war needs Congress and public support. Example: a neighbour asks for help against an invasion, Congress resists and the public fears war, so you negotiate or send aid instead.
- **As a dictator:** free to wage war, but you face sanctions and isolation and have to rely on shady partners.

## Endings

- **Game over:** your career ends, for example through arrest, impeachment, a coup or electoral defeat that leaves you without a path forward.
- **Multiple victory types (like Civilization):**
  - *Democratic victory:* finish your terms with high approval and a thriving country, and become a national hero.
  - *World victory:* lead a global alliance or become UN Secretary-General.
  - *Domination victory:* conquer or control the world as a dictator.

## Production approach

- No budget and no artists. Art, music, sound and code are all produced with AI.
- Code is written with Claude Code.
- Build order: make the **Councilman chapter first** as a small playable version, then expand.

## Tech stack

- **TypeScript + React:** the desk, documents, menus and all UI.
- **PixiJS:** the living map.
- **GSAP and/or Framer Motion:** animation and game feel.
- **Howler.js:** music and sound effects.
- Runs in the browser. It can be packaged for desktop and Steam later.

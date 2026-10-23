/**
 * Headless playtest: runs scripted strategies through the real simulation and
 * prints a week-by-week table. Use it to tune src/content/balance.ts.
 *
 *   npm run sim                   # all strategies, labour party
 *   npm run sim -- populist 30    # one strategy, 30 weeks
 *   npm run sim -- dirty 40 liberal
 */
import { lawAvailable, type SchemePicks } from "../src/chapters/councilman/actions";
import { councilmanChapter as chapter } from "../src/chapters/councilman/chapter";
import { LAW_IDS } from "../src/content/councilman/laws";
import { GROUP_IDS } from "../src/content/councilman/groups";
import { advanceTurn } from "../src/core/advanceTurn";
import { evaluate, readRef } from "../src/core/conditions";
import { allOpinions } from "../src/core/groups";
import type { Decision, GameState } from "../src/core/types";

type Strategy = {
  describe: string;
  setup?: (s: GameState) => void;
  decide: (s: GameState) => Decision[];
  /** Which choice id to pick for papers on the desk, by preference. */
  prefers?: string[];
  /** How this strategy plans conspiracies (null = walk away). */
  plan?: SchemePicks | null;
};

/** Answer every paper on the desk with the first preferred choice it offers (else the last one). */
function answerDesk(s: GameState, prefers: string[], plan: SchemePicks | null = null): Decision[] {
  return s.inbox.map((i): Decision => {
    if (i.scheme) return { kind: "scheme", itemId: i.id, scheme: i.scheme, picks: plan };
    if (!i.choices?.length) return { kind: "dismiss", itemId: i.id };
    const open = i.choices.filter((c) => !c.requires || evaluate(s, c.requires));
    const pick = prefers.find((p) => open.some((c) => c.id === p)) ?? open.at(-1)!.id;
    return { kind: "choose", itemId: i.id, choiceId: pick };
  });
}

const firstLaw = (s: GameState) => LAW_IDS.find((l) => lawAvailable(s, l));

const rotate = (s: GameState) => GROUP_IDS[s.turn % GROUP_IDS.length]!;

const STRATEGIES: Record<string, Strategy> = {
  idle: { describe: "Does nothing at all", decide: () => [] },
  honest: {
    describe: "One informative post per week, rotating groups",
    decide: (s) => [{ kind: "post", style: "informative", group: rotate(s) }],
  },
  populist: {
    describe: "Populist posts for 10 weeks, then goes quiet",
    decide: (s) => (s.turn <= 10 ? [{ kind: "post", style: "populist", group: rotate(s) }] : []),
  },
  builder: {
    describe: "Honest builder: reads Keynes, proposes a bill a week, works the hill, refuses dirty money",
    prefers: ["honest", "refuse", "independent", "keynes_jobs", "own_way", "decline", "ally"],
    decide: (s) => {
      const law = firstLaw(s);
      const d: Decision[] = [{ kind: "neighbourhood", id: "morro_esperanca" }];
      if (s.turn === 1) d.push({ kind: "read", book: "keynes" });
      else if (law) d.push({ kind: "proposeLaw", law });
      if (s.turn % 3 === 0) d.push({ kind: "post", style: "informative", group: rotate(s) });
      return d;
    },
  },
  climber: {
    describe: "Corrupt climber: takes the cash, sells votes, posts populism, rides the party machine",
    prefers: ["cash", "vote_for", "learn", "loyal", "promise", "ally"],
    plan: { intermediary: "brother_in_law", payment: "invoices", knows: "chief_of_staff" },
    decide: (s) => {
      const law = firstLaw(s);
      const d: Decision[] = [{ kind: "post", style: "populist", group: rotate(s) }];
      if (s.turn === 1) d.push({ kind: "meeting", with: "donor" }, { kind: "meeting", with: "mentor" });
      else if (s.turn === 3) d.push({ kind: "meeting", with: "donor" }, { kind: "meeting", with: "party_boss" });
      else if (law) d.push({ kind: "proposeLaw", law });
      return d;
    },
  },
  dirty: {
    describe: "Starts with two undeclared donations in the dossier",
    setup: (s) => {
      s.hidden.integrity = 45;
      s.hidden.dossier.push(
        { id: "cash", label: "Cash from Teixeira Construções", threads: 3, turn: 1, exposed: false },
        { id: "ghost", label: "Phantom employee in the office", threads: 5, turn: 1, exposed: false },
      );
    },
    decide: () => [],
  },
};

const [only, weeksArg = "30", party = "labour"] = process.argv.slice(2);
const weeks = Number(weeksArg);
const names = only ? [only] : Object.keys(STRATEGIES);

const pad = (v: string | number, n: number) => String(v).padStart(n);
const fmt = (n: number) => pad(Math.round(n), 5);

for (const name of names) {
  const strat = STRATEGIES[name];
  if (!strat) throw new Error(`Unknown strategy "${name}". Try: ${Object.keys(STRATEGIES).join(", ")}`);

  let s = chapter.createInitialState({ playerName: "Sim", party });
  strat.setup?.(s);

  console.log(`\n=== ${name.toUpperCase()} (${party}): ${strat.describe}`);
  console.log(`week | ${GROUP_IDS.map((g) => pad(g.slice(0, 5), 5)).join(" ")} |   avg | expec | integ | invest | notes`);

  for (let i = 0; i < weeks && !s.ending; i++) {
    const decisions = [...answerDesk(s, strat.prefers ?? [], strat.plan), ...strat.decide(s)];
    const { state, report } = advanceTurn(s, decisions, chapter);
    s = state;
    const ops = allOpinions(s);
    const notes = [
      ...report.consequences.map((c) => c.label),
      ...s.inbox.filter((i) => i.turn >= report.fromTurn && i.kind !== "newspaper" && !i.id.includes("@")).map((i) => `[${i.title}]`),
      ...s.inbox.filter((i) => i.turn >= report.fromTurn && i.kind === "newspaper").map((i) => `NEWS: ${i.title}`),
    ].join("; ");
    console.log(
      `${pad(s.turn, 4)} | ${GROUP_IDS.map((g) => fmt(ops[g]!)).join(" ")} | ${fmt(readRef(s, "averageOpinion"))} | ` +
        `${fmt(s.hidden.expectations)} | ${fmt(s.hidden.integrity)} | ${pad(Math.round(s.flags.investigation ?? 0), 6)} | ${notes}`,
    );
  }
  console.log(s.ending ? `>>> ENDING: ${s.ending} in week ${s.turn}` : `>>> Still standing after ${weeks} weeks`);
  console.log(
    `    funds ${s.player.funds}k | boss ${s.characters.party_boss!.relation} | laws passed ${s.flags.laws_passed ?? 0}, ` +
      `rejected ${s.flags.laws_rejected ?? 0} | books ${s.books.finished.join(", ") || "none"} | dossier threads ${s.hidden.dossier.reduce((a, d) => a + d.threads, 0)}`,
  );
}

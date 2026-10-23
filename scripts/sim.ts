/**
 * Headless playtest: runs scripted strategies through the real simulation and
 * prints a week-by-week table. Use it to tune src/content/balance.ts.
 *
 *   npm run sim                   # all strategies, labour party
 *   npm run sim -- populist 30    # one strategy, 30 weeks
 *   npm run sim -- dirty 40 liberal
 */
import { councilmanChapter as chapter } from "../src/chapters/councilman/chapter";
import { GROUP_IDS } from "../src/content/councilman/groups";
import { advanceTurn } from "../src/core/advanceTurn";
import { readRef } from "../src/core/conditions";
import { allOpinions } from "../src/core/groups";
import type { Decision, GameState } from "../src/core/types";

type Strategy = { describe: string; setup?: (s: GameState) => void; decide: (s: GameState) => Decision[] };

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
    const { state, report } = advanceTurn(s, strat.decide(s), chapter);
    s = state;
    const ops = allOpinions(s);
    const notes = [
      ...report.consequences.map((c) => c.label),
      ...s.history.filter((h) => h.turn === s.turn && h.text.startsWith("Exposed")).map((h) => h.text),
    ].join("; ");
    console.log(
      `${pad(s.turn, 4)} | ${GROUP_IDS.map((g) => fmt(ops[g]!)).join(" ")} | ${fmt(readRef(s, "averageOpinion"))} | ` +
        `${fmt(s.hidden.expectations)} | ${fmt(s.hidden.integrity)} | ${pad(Math.round(s.flags.investigation ?? 0), 6)} | ${notes}`,
    );
  }
  console.log(s.ending ? `>>> ENDING: ${s.ending} in week ${s.turn}` : `>>> Still standing after ${weeks} weeks`);
}

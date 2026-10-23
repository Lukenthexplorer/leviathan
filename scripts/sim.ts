/**
 * Headless playtest: runs scripted strategies through the real simulation.
 * Use it to tune src/content/balance.ts.
 *
 *   npm run sim                         # election report: every strategy x every party
 *   npm run sim -- periphery            # one strategy, week-by-week table + election night
 *   npm run sim -- elite 45 liberal     # strategy, weeks, party
 */
import { lawAvailable, lawCost, lawVoteScore, projectCooldown, type SchemePicks } from "../src/chapters/councilman/actions";
import { endorserAvailable, pathStatus, voteBuyingAvailable } from "../src/chapters/councilman/campaign";
import { councilmanChapter as chapter } from "../src/chapters/councilman/chapter";
import { PLAYER, electionUnits, unitShares } from "../src/chapters/councilman/election";
import { BALANCE } from "../src/content/balance";
import { ENDORSER_IDS } from "../src/content/councilman/endorsers";
import { GROUP_IDS, type GroupId } from "../src/content/councilman/groups";
import { LAWS, LAW_IDS, type LawId } from "../src/content/councilman/laws";
import { NEIGHBOURHOODS, NEIGHBOURHOOD_IDS, type NeighbourhoodId } from "../src/content/councilman/neighbourhoods";
import { PARTY_IDS } from "../src/content/councilman/parties";
import { REGION_IDS } from "../src/content/councilman/regions";
import type { LawDef } from "../src/content/types";
import { advanceTurn } from "../src/core/advanceTurn";
import { evaluate, readRef } from "../src/core/conditions";
import { allOpinions } from "../src/core/groups";
import type { Decision, GameState, PathId } from "../src/core/types";

type Strategy = {
  describe: string;
  /** Neighbourhoods this player works and campaigns in. */
  home: NeighbourhoodId[];
  /** Groups this player courts with media and laws. */
  courts: GroupId[];
  /** Choice ids to pick on desk papers, by preference. */
  prefers: string[];
  /** Conspiracy plans by scheme id (missing = walk away). */
  plans?: Record<string, SchemePicks>;
  /** Preferred path (falls back to the most ambitious open one). */
  path?: PathId;
  populist?: boolean;
  corrupt?: boolean;
  books?: string[];
};

const STRATEGIES: Record<string, Strategy> = {
  periphery: {
    describe: "Honesto da periferia: Morro e Vila Operária, Keynes, saneamento, Dona Lurdes",
    home: ["morro_esperanca", "vila_operaria"],
    courts: ["periphery", "workers", "religious"],
    prefers: ["honest", "refuse", "keynes_jobs", "grant", "own_way", "decline", "ally", "attend", "loyal"],
    books: ["keynes", "faoro"],
  },
  elite: {
    describe: "Elite: Centro e Jardim Atlântico, viaduto e revitalização, Associação Comercial",
    home: ["jardim_atlantico", "centro", "sao_bento"],
    courts: ["business", "retirees", "religious"],
    prefers: ["declared", "hayek_pitch", "loyal", "learn", "attend", "grant", "ally"],
    books: ["hayek"],
  },
  populist: {
    describe: "Populista: carro de som, promessas para todos, nenhum livro",
    home: ["vila_operaria", "morro_esperanca", "centro"],
    courts: ["periphery", "workers", "students", "retirees"],
    prefers: ["promise", "loyal", "attend", "ally", "grant"],
    populist: true,
  },
  shady: {
    describe: "Corrupto moderado: aceita o dinheiro do Teixeira (bem escondido) e uma oferta; o resto, limpo",
    home: ["vila_operaria", "centro", "morro_esperanca"],
    courts: ["workers", "business", "periphery"],
    prefers: ["cash", "decline", "learn", "loyal", "attend", "school_lunch_contract", "ally"],
    plans: { teixeira_donation: { intermediary: "doleiro", payment: "cash", knows: "otavio" } },
    corrupt: true,
  },
  corrupt: {
    describe: "Corrupto: dinheiro do Teixeira, ofertas, cabos sem recibo, compra de votos",
    home: ["vila_operaria", "centro", "morro_esperanca"],
    courts: ["workers", "business", "periphery"],
    prefers: ["cash", "vote_for", "learn", "loyal", "hire", "attend", "emergency_paving", "school_lunch_contract", "morro_rezoning", "ally"],
    plans: {
      teixeira_donation: { intermediary: "doleiro", payment: "cash", knows: "otavio" },
      vote_buying: { who: "leader", what: "food", knows: "alone" },
    },
    corrupt: true,
  },
};

// ------------------------------------------------------------------ decisions

function answerDesk(s: GameState, st: Strategy): Decision[] {
  return s.inbox.map((i): Decision => {
    if (i.scheme) return { kind: "scheme", itemId: i.id, scheme: i.scheme, picks: st.plans?.[i.scheme] ?? null };
    if (!i.choices?.length) return { kind: "dismiss", itemId: i.id };
    const open = i.choices.filter((c) => !c.requires || evaluate(s, c.requires));
    const pathPrefs = i.id === "path_decision" ? [...(st.path ? [st.path] : []), "mayor", "deputy", "council"] : [];
    const pick = ["facts", ...pathPrefs, ...st.prefers].find((p) => open.some((c) => c.id === p)) ?? open.at(-1)!.id;
    return { kind: "choose", itemId: i.id, choiceId: pick };
  });
}

/** A bill that pleases the groups this strategy courts (or, if corrupt, an offer), lobbying just enough to pass. */
function pickLaw(s: GameState, st: Strategy): Decision | null {
  const helps = (l: LawId) => {
    const ops = (LAWS[l] as LawDef).onPass.filter((e) => e.type === "opinion") as { group: string; delta: number }[];
    return ops.some((e) => st.courts.includes(e.group as GroupId) && e.delta > 0) && !ops.some((e) => st.courts.slice(0, 2).includes(e.group as GroupId) && e.delta < 0);
  };
  const offers = LAW_IDS.filter((l) => (LAWS[l] as LawDef).offer && lawAvailable(s, l));
  const regular = LAW_IDS.filter((l) => !(LAWS[l] as LawDef).offer && lawAvailable(s, l) && helps(l));
  for (const law of st.corrupt ? [...offers, ...regular] : regular) {
    for (let lobby = 0; lobby <= BALANCE.laws.maxLobbyLevel; lobby++) {
      if (s.player.capital < lawCost(law, lobby)) break;
      if (lawVoteScore(s, law, lobby).passes) return { kind: "proposeLaw", law, lobby };
    }
  }
  return null;
}

/** Weeks 1-32: govern. */
function governWeek(s: GameState, st: Strategy): Decision[] {
  const d: Decision[] = [];
  const book = st.books?.find((b) => !s.books.finished.includes(b));
  if (book && !s.books.reading) d.push({ kind: "read", book: book as never });
  const law = pickLaw(s, st);
  if (law) d.push(law);
  const home = st.home[s.turn % st.home.length]!;
  if (s.turn % 4 === 0 && s.player.funds >= 20 && projectCooldown(s, home) === 0) d.push({ kind: "project", project: "nb_community_center", nb: home });
  else d.push({ kind: "neighbourhood", id: home });
  if (s.turn === 2) d.push({ kind: "meeting", with: st.corrupt ? "donor" : "community_leader" });
  else if (s.turn % 5 === 0) d.push({ kind: "meeting", with: "party_boss" });
  else if (s.turn % 2 === 0) d.push({ kind: "fundraise" });
  else d.push({ kind: "media", style: st.populist ? "populist" : "informative", group: st.courts[s.turn % st.courts.length]! });
  return d.slice(0, 3);
}

/** Weeks 33-40: campaign where the roots are. */
function campaignWeek(s: GameState, st: Strategy): Decision[] {
  const d: Decision[] = [];
  let funds = s.player.funds;
  const spend = (cost: number, dec: Decision) => {
    if (funds >= cost && d.length < 3) {
      funds -= cost;
      d.push(dec);
    }
  };
  const endorser = ENDORSER_IDS.find((e) => endorserAvailable(s, e) && !s.campaign!.endorsements.includes(e));
  if (endorser && s.player.capital >= BALANCE.campaign.endorsementCapital) d.push({ kind: "endorsement", who: endorser });
  const home = st.home[s.turn % st.home.length]!;
  if (s.campaign!.path === "deputy") {
    // The interior decides a state race: travel where you're weakest.
    const weakest = REGION_IDS.slice().sort((a, b) => (s.campaign!.presence[a] ?? 0) - (s.campaign!.presence[b] ?? 0))[0]!;
    spend(BALANCE.campaign.interiorTripCost, { kind: "interiorTrip", region: weakest });
  }
  if (st.corrupt && voteBuyingAvailable(s) && !s.flags.bought_votes && !s.inbox.some((i) => i.scheme)) spend(BALANCE.campaign.voteBuyingCost, { kind: "buyVotes", nb: home });
  spend(BALANCE.campaign.rallyCost, { kind: "rally", nb: home });
  spend(st.corrupt ? BALANCE.campaign.cabosCashCost : BALANCE.campaign.cabosCost, { kind: "cabos", nb: st.home[(s.turn + 1) % st.home.length]!, cash: st.corrupt });
  if (st.populist) spend(BALANCE.campaign.soundTruckCost, { kind: "soundTruck", nb: st.home[(s.turn + 2) % st.home.length]! });
  spend(BALANCE.campaign.paidMediaCost, { kind: "media", style: "informative", group: st.courts[s.turn % st.courts.length]!, paid: true });
  if (d.length < 3) d.push({ kind: "fundraise" });
  return d;
}

function play(name: string, party: string, weeks: number, onWeek?: (s: GameState, notes: string) => void): GameState {
  const st = STRATEGIES[name];
  if (!st) throw new Error(`Unknown strategy "${name}". Try: ${Object.keys(STRATEGIES).join(", ")}`);
  let s = chapter.createInitialState({ playerName: "Sim", party });
  for (let i = 0; i < weeks && !s.ending; i++) {
    const decisions = [...answerDesk(s, st), ...(s.campaign ? campaignWeek(s, st) : governWeek(s, st))];
    let r;
    try {
      r = advanceTurn(s, decisions, chapter);
    } catch {
      // A strategy can ask for something the rules refuse (out of money, cooldown): drop its own actions that week.
      r = advanceTurn(s, answerDesk(s, st), chapter);
    }
    s = r.state;
    onWeek?.(s, [...r.report.consequences.map((c) => c.label), ...r.report.exposed.map((d) => `EXPOSTO: ${d.label}`)].join("; "));
  }
  return s;
}

// ------------------------------------------------------------------ reports

const pad = (v: string | number, n: number) => String(v).padStart(n);
const pct = (v: number, total: number) => Math.round((v / total) * 1000) / 10;

/** One line per run: path, result, player's share at 50% and 100% of the count, lead changes. */
function electionLine(s: GameState): string {
  const e = s.election;
  if (!e) return `ended early: ${s.ending} (week ${s.turn})`;
  const sum: Record<string, number> = {};
  let leader = "";
  let changes = 0;
  let atHalf = 0;
  for (const b of e.batches) {
    for (const [id, v] of Object.entries(b.votes)) sum[id] = (sum[id] ?? 0) + v;
    const valid = Object.values(sum).reduce((a, c) => a + c, 0);
    const top = Object.entries(sum).sort((a, c) => c[1] - a[1])[0]![0];
    if (leader && top !== leader) changes++;
    leader = top;
    if (!atHalf && b.cumulativePct >= 50) atHalf = pct(sum[PLAYER]!, valid);
  }
  const valid = Object.values(e.final).reduce((a, c) => a + c, 0);
  const won = e.elected.includes(PLAYER);
  const r2 = e.runoff ? ` | 2º turno vs ${e.runoff.candidates.find((c) => c !== PLAYER) ?? "?"}: ${e.runoff.candidates.includes(PLAYER) ? pad(pct(e.runoff.final[PLAYER]!, Object.values(e.runoff.final).reduce((a, c) => a + c, 0)), 4) + "%" : "fora"}` : "";
  const rank = Object.entries(e.final).sort((a, c) => c[1] - a[1]).findIndex(([id]) => id === PLAYER) + 1;
  return `${e.path.padEnd(7)} ${won ? "WON " : "lost"} ${rank}º  ${pad(pct(e.final[PLAYER]!, valid), 4)}% (at 50%: ${pad(atHalf, 4)}%)  lead changes ${changes}${r2}  | ${s.ending}`;
}

const [only, weeksArg = "45", partyArg] = process.argv.slice(2);

if (!only) {
  console.log("ELECTION REPORT (every strategy x party)\n");
  for (const name of Object.keys(STRATEGIES)) {
    console.log(`${name}: ${STRATEGIES[name]!.describe}`);
    for (const party of PARTY_IDS) {
      const s = play(name, party, Number(weeksArg));
      const open = pathStatus(s).filter((p) => p.open).map((p) => p.path).join("/");
      console.log(`  ${party.padEnd(12)} ${electionLine(s)}  [open: ${open}, threads ${readRef(s, "dossierThreads")}, exposed ${readRef(s, "exposedThreads")}]`);
    }
  }
} else {
  const party = partyArg ?? "labour";
  console.log(`=== ${only.toUpperCase()} (${party}): ${STRATEGIES[only]?.describe}`);
  console.log(`week | ${GROUP_IDS.map((g) => pad(g.slice(0, 5), 5)).join(" ")} |   avg | expec | integ | invest | poll | notes`);
  const s = play(only, party, Number(weeksArg), (st, notes) => {
    const ops = allOpinions(st);
    const poll = st.campaign?.polls.at(-1)?.shares[PLAYER];
    console.log(
      `${pad(st.turn, 4)} | ${GROUP_IDS.map((g) => pad(Math.round(ops[g]!), 5)).join(" ")} | ${pad(Math.round(readRef(st, "averageOpinion")), 5)} | ` +
        `${pad(Math.round(st.hidden.expectations), 5)} | ${pad(st.hidden.integrity, 5)} | ${pad(Math.round(st.flags.investigation ?? 0), 6)} | ${pad(poll ?? "", 4)} | ${notes.slice(0, 110)}`,
    );
  });
  console.log(`\n>>> ${electionLine(s)}`);
  if (s.campaign) {
    // Where the votes came from: each unit's shares (%).
    for (const u of electionUnits(s.campaign.path)) {
      const sh = unitShares(s, s.campaign.path, u);
      console.log(`    ${u.padEnd(21)} ${Object.entries(sh).map(([id, v]) => `${id.slice(0, 7).padEnd(7)} ${pad(Math.round(v * 100), 3)}%`).join("  ")}`);
    }
  }
  if (s.election) {
    for (const u of NEIGHBOURHOOD_IDS) {
      const c = s.election.causes.filter((x) => x.unitId === u).map((x) => x.text.replace("{{player}}", "Sim")).join(" / ");
      if (c) console.log(`    ${NEIGHBOURHOODS[u].name}: ${c}`);
    }
  }
}

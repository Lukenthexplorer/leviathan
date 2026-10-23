import { BALANCE } from "../../content/balance";
import { CANDIDATES, OPPONENTS, type CandidateId } from "../../content/councilman/candidates";
import { ENDORSERS, type EndorserId } from "../../content/councilman/endorsers";
import { GROUPS, GROUP_IDS, type GroupId } from "../../content/councilman/groups";
import { LAWS, type LawId } from "../../content/councilman/laws";
import { NEIGHBOURHOODS, NEIGHBOURHOOD_IDS, type NeighbourhoodId } from "../../content/councilman/neighbourhoods";
import { PARTIES, type PartyId } from "../../content/councilman/parties";
import { REGIONS, type RegionId } from "../../content/councilman/regions";
import type { EndorserDef, LawDef } from "../../content/types";
import { evaluate } from "../../core/conditions";
import { allOpinions, opinionOf } from "../../core/groups";
import { lowerFirst } from "../../core/text";
import type { Attack, Cause, Condition, DeskChoice, Effect, GameState, PathId } from "../../core/types";

/**
 * End of term: the three paths, the campaign actions and the weekly campaign
 * rules. Like everything else, pure functions that return effects.
 */

const P = BALANCE.paths;
const K = BALANCE.campaign;
type Resolved = { effects: Effect[]; cause: Omit<Cause, "turn"> };

export const PATH_LABEL: Record<PathId, string> = {
  council: "Reeleição para a Câmara",
  mayor: "Prefeitura",
  deputy: "Deputado estadual",
};

export const inCampaign = (state: GameState) => state.campaign !== null;

// ------------------------------------------------------------------ paths

export interface PathStatus {
  path: PathId;
  open: boolean;
  /** In words: never the hidden number. */
  why: string;
  requires?: Condition;
}

/** Which doors are open right now, and why (or why not), in words. */
export function pathStatus(state: GameState): PathStatus[] {
  const boss = PARTIES[state.party as PartyId].boss.name;
  const backedRival = (state.flags.backed_rival ?? 0) > 0;
  const mayorReq: Condition = {
    all: [
      { ref: "relation:party_boss", op: ">=", value: P.mayorBossRelation },
      { ref: "flag:backed_rival", op: "==", value: 0 },
    ],
  };
  const deputyReq: Condition = { ref: "relation:party_boss", op: ">=", value: P.deputyBossRelation };
  const mayorOpen = evaluate(state, mayorReq);
  const deputyOpen = evaluate(state, deputyReq);
  return [
    {
      path: "council",
      open: true,
      why: backedRival
        ? "Sempre aberta. E a Renata prometeu a presidência da Câmara e o apoio dela."
        : "Sempre aberta: o partido sempre dá um número a quem já tem mandato.",
    },
    {
      path: "mayor",
      open: mayorOpen,
      requires: mayorReq,
      why: backedRival
        ? "Fechada: você prometeu apoiar a Renata."
        : mayorOpen
          ? `${boss} aceita indicar você. Mas prefeitura se ganha com muitos grupos, não com um bairro.`
          : `${boss} ainda não confia em você para a prefeitura.`,
    },
    {
      path: "deputy",
      open: deputyOpen,
      requires: deputyReq,
      why: deputyOpen
        ? "O partido tem lugar para você na chapa estadual. Lá fora, a máquina do partido e os aliados do interior pesam mais."
        : `${boss} não quer você na chapa estadual.`,
    },
  ];
}

/** Week 28: the party says, in words, which doors look open. */
function warningLetter(state: GameState): Effect[] {
  const lines = pathStatus(state)
    .map((p) => `• ${PATH_LABEL[p.path]}: ${p.why}`)
    .join("\n");
  return [
    {
      type: "deskItem",
      item: {
        id: "paths_warning",
        kind: "letter",
        from: "party_boss",
        expression: "neutral",
        title: "A decisão está chegando",
        body:
          `Em quatro semanas o partido fecha as candidaturas. Você vai ter que escolher que eleição disputar. Do jeito que as coisas estão hoje:\n\n${lines}\n\n` +
          "Ainda dá tempo de mudar alguma coisa. Pouco.",
        turn: state.turn,
      },
    },
  ];
}

/** Week 32: one choice per path; closed paths are shown greyed out with the reason. */
function decisionPaper(state: GameState): Effect[] {
  const backedRival = (state.flags.backed_rival ?? 0) > 0;
  const choices: DeskChoice[] = pathStatus(state).map((p) => ({
    id: p.path,
    label: { council: "Disputar a reeleição", mayor: "Disputar a prefeitura", deputy: "Disputar uma vaga de deputado estadual" }[p.path],
    ...(p.requires ? { requires: p.requires, lockedText: p.why } : {}),
    effects: [
      { type: "choosePath", path: p.path },
      { type: "flag", key: `path_${p.path}`, set: 1 },
      { type: "log", text: `Candidatura: ${PATH_LABEL[p.path]}` },
      // The kingmaker deal pays off in the council race.
      ...(p.path === "council" && backedRival
        ? ([{ type: "capital", delta: P.kingmakerCapital }, { type: "endorse", who: "renata" }] as Effect[])
        : []),
    ],
  }));
  return [
    { type: "flag", key: "path_offered", set: 1 },
    {
      type: "deskItem",
      item: {
        id: "path_decision",
        kind: "letter",
        from: "party_boss",
        expression: "neutral",
        title: "Decisão de candidatura",
        body:
          "As candidaturas fecham esta semana. A campanha começa na próxima, e a eleição é em oito semanas. " +
          "Durante a campanha a Câmara entra em recesso: nada de projetos de lei. Daqui pra frente, é rua, palanque e voto.\n\nQual eleição você vai disputar?",
        choices,
        turn: state.turn,
      },
    },
  ];
}

// ------------------------------------------------------------------ campaign actions

/** Units where the player campaigns: Porto Ferro's neighbourhoods, plus the state's regions for deputy. */
export function campaignUnits(state: GameState): string[] {
  return state.campaign?.path === "deputy" ? [...NEIGHBOURHOOD_IDS, ...Object.keys(REGIONS)] : [...NEIGHBOURHOOD_IDS];
}

function requireCampaign(state: GameState, what: string): void {
  if (!state.campaign) throw new Error(`${what} só durante a campanha`);
}

function requireFunds(state: GameState, cost: number, what: string): void {
  if (state.player.funds < cost) throw new Error(`Dinheiro insuficiente: ${what} custa ${cost} mil`);
}

export function rallyCost(state: GameState, nb: NeighbourhoodId): number {
  return state.flags[`community_center_${nb}`] ? K.rallyCostAtCentre : K.rallyCost;
}

export function resolveRally(state: GameState, nb: NeighbourhoodId): Resolved {
  requireCampaign(state, "Comício");
  const cost = rallyCost(state, nb);
  requireFunds(state, cost, "o comício");
  const name = NEIGHBOURHOODS[nb].name;
  const base = state.neighbourhoods[nb]?.base ?? 0;
  const empty = base < K.rallyMinBase;
  return {
    cause: { kind: "neighbourhood", id: `rally_${nb}`, label: `Comício em ${name}` },
    effects: [
      { type: "funds", delta: -cost },
      empty
        ? { type: "presence", unit: nb, delta: K.emptyRallyPresence }
        : { type: "presence", unit: nb, delta: K.rallyPresence },
      ...(empty
        ? ([
            {
              type: "deskItem",
              item: {
                id: `news_empty_rally_${nb}@${state.turn}`,
                kind: "newspaper",
                title: `COMÍCIO DE {{PLAYER}} EM ${name.toUpperCase()}: MAIS CADEIRA QUE GENTE`,
                body:
                  `O palanque estava montado, o som estava alto, e a praça estava vazia. Em ${name}, onde {{g:o candidato/a candidata}} ` +
                  "nunca apareceu antes da campanha, os moradores preferiram a novela. \"Quem é?\", perguntou um senhor no bar da esquina.",
                turn: 0,
              },
            },
          ] as Effect[])
        : ([{ type: "neighbourhood", id: nb, addMarker: "rally" }] as Effect[])),
    ],
  };
}

export function resolveSoundTruck(state: GameState, nb: NeighbourhoodId): Resolved {
  requireCampaign(state, "Carro de som");
  requireFunds(state, K.soundTruckCost, "o carro de som");
  // Old ears and quiet streets: the retirees of São Bento complain the most.
  const noise = nb === "sao_bento" ? -2 : -0.5;
  return {
    cause: { kind: "media", id: `sound_truck_${nb}`, label: `Carro de som em ${NEIGHBOURHOODS[nb].name}` },
    effects: [
      { type: "funds", delta: -K.soundTruckCost },
      { type: "presence", unit: nb, delta: K.soundTruckPresence },
      { type: "expectations", delta: K.soundTruckExpectations },
      { type: "opinion", group: "retirees", delta: noise, label: "Barulho do carro de som" },
    ],
  };
}

export function cabosCost(cash: boolean): number {
  return cash ? K.cabosCashCost : K.cabosCost;
}

export function resolveCabos(state: GameState, nb: NeighbourhoodId, cash: boolean): Resolved {
  requireCampaign(state, "Cabos eleitorais");
  const cost = cabosCost(cash);
  requireFunds(state, cost, "contratar cabos");
  const name = NEIGHBOURHOODS[nb].name;
  // Paying in cash with no receipt is cheaper. It's also a loose thread.
  const trail: Effect[] = !cash
    ? []
    : state.hidden.dossier.some((d) => d.id === "cabos_cash")
      ? [{ type: "thread", id: "cabos_cash", add: 1 }]
      : [{ type: "dossier", id: "cabos_cash", label: "Cabos eleitorais pagos em dinheiro, sem recibo", threads: 1 }];
  return {
    cause: { kind: "neighbourhood", id: `cabos_${nb}`, label: `Contratou cabos eleitorais em ${name}` },
    effects: [{ type: "funds", delta: -cost }, { type: "cabos", unit: nb, add: 1 }, ...trail],
  };
}

export function endorserAvailable(state: GameState, who: EndorserId): boolean {
  return evaluate(state, (ENDORSERS[who] as EndorserDef).requires);
}

export function resolveEndorsement(state: GameState, who: EndorserId): Resolved {
  requireCampaign(state, "Pedir apoio");
  const e: EndorserDef = ENDORSERS[who];
  if (state.campaign!.endorsements.includes(who)) throw new Error(`${e.name} já declarou apoio`);
  if (!endorserAvailable(state, who)) throw new Error(e.lockedText);
  if (state.player.capital < K.endorsementCapital) throw new Error(`Capital político insuficiente para pedir o apoio de ${e.name}`);
  return {
    cause: { kind: "meeting", id: `endorse_${who}`, label: `Recebeu o apoio de ${e.name}` },
    effects: [
      { type: "capital", delta: -K.endorsementCapital },
      { type: "endorse", who },
      { type: "expectations", delta: K.endorsementExpectations },
      ...e.units.map((u): Effect => ({ type: "presence", unit: u, delta: K.endorsementPresence })),
      { type: "log", text: `${e.name} declara apoio. Em troca: ${e.promise}` },
    ],
  };
}

export function resolveInteriorTrip(state: GameState, region: RegionId): Resolved {
  requireCampaign(state, "Viagem ao interior");
  if (state.campaign!.path !== "deputy") throw new Error("Viagem ao interior só na campanha para deputado");
  requireFunds(state, K.interiorTripCost, "a viagem");
  return {
    cause: { kind: "neighbourhood", id: `trip_${region}`, label: `Viajou por ${REGIONS[region].name}` },
    effects: [
      { type: "funds", delta: -K.interiorTripCost },
      { type: "presence", unit: region, delta: K.interiorTripPresence },
      // A week away: Porto Ferro notices.
      ...NEIGHBOURHOOD_IDS.map((nb): Effect => ({ type: "presence", unit: nb, delta: -K.interiorTripHomeLoss })),
    ],
  };
}

/** Neighbourhoods a passed law helped (where the groups it pleased live). */
export function lawHelpedUnits(id: LawId): NeighbourhoodId[] {
  const law: LawDef = LAWS[id];
  const pleased = new Set(law.onPass.filter((e) => e.type === "opinion" && e.delta > 0).map((e) => (e.type === "opinion" ? e.group : "")));
  return NEIGHBOURHOOD_IDS.filter((nb) =>
    Object.entries(NEIGHBOURHOODS[nb].residents).some(([g, share]) => pleased.has(g) && share >= 0.2),
  );
}

export function resolveRecordAd(state: GameState, id: LawId): Resolved {
  requireCampaign(state, "Prestação de contas");
  if (state.laws[id] !== "passed") throw new Error("Só dá para mostrar leis aprovadas");
  if (state.flags[`record_ad_${id}`]) throw new Error("Essa lei já foi tema de propaganda");
  requireFunds(state, K.paidMediaCost, "a propaganda");
  const title = LAWS[id].title;
  return {
    cause: { kind: "media", id: `record_ad_${id}`, label: `Propaganda de prestação de contas: ${title}` },
    effects: [
      { type: "funds", delta: -K.paidMediaCost },
      { type: "flag", key: `record_ad_${id}`, set: 1 },
      ...lawHelpedUnits(id).map((u): Effect => ({ type: "presence", unit: u, delta: K.recordAdPresence })),
    ],
  };
}

/** Only for those who already compromised: the old way of winning a neighbourhood. */
export const voteBuyingAvailable = (state: GameState) => state.hidden.integrity <= BALANCE.corruptOfferIntegrity;

export function resolveBuyVotes(state: GameState, nb: NeighbourhoodId): Resolved {
  requireCampaign(state, "Isso");
  if (!voteBuyingAvailable(state)) throw new Error("Não é uma opção para você");
  requireFunds(state, K.voteBuyingCost, "o plano");
  if (state.inbox.some((i) => i.scheme === "vote_buying")) throw new Error("Já existe um plano na mesa");
  const name = NEIGHBOURHOODS[nb].name;
  return {
    cause: { kind: "scheme", id: `vote_buying_plan_${nb}`, label: `Pensou em resolver ${name} do jeito antigo` },
    effects: [
      {
        type: "deskItem",
        item: {
          id: `plan_vote_buying_${nb}`,
          kind: "scheme",
          scheme: "vote_buying",
          place: nb,
          title: `Plano: ${name}`,
          body: `Faltam semanas. ${name} ainda está dividido.`,
          turn: 0,
        },
      },
    ],
  };
}

// ------------------------------------------------------------------ opponents attack your record

interface AttackMaterial {
  key: string;
  text: string;
  units: string[];
  /** Would "rebater com fatos" work? Decided now, from the record. Never random. */
  factsWork: boolean;
}

const unitsOf = (group: string) =>
  NEIGHBOURHOOD_IDS.filter((nb) => ((NEIGHBOURHOODS[nb].residents as Record<string, number>)[group] ?? 0) >= 0.2);

const readEconomics = (state: GameState) => ["keynes", "hayek", "faoro"].some((b) => state.books.finished.includes(b));

/** The strongest unused item in the player's record, as attack material. */
export function attackMaterial(state: GameState): AttackMaterial {
  const used = new Set(state.campaign?.attacks.map((a) => a.key) ?? []);
  const options: (AttackMaterial & { weight: number })[] = [];

  // 1. Scandals the press already published.
  for (const d of state.hidden.dossier.filter((x) => x.exposed)) {
    options.push({
      key: `dossier:${d.id}`,
      weight: 100 + d.threads * 10,
      text: `"${d.headline ?? d.label}." É esse tipo de político que Porto Ferro quer?`,
      units: [...NEIGHBOURHOOD_IDS],
      factsWork: (state.flags.confess ?? 0) >= 2,
    });
  }

  // 2. Laws whose consequences hurt a group (the deepest wound first).
  const ops = allOpinions(state);
  for (const g of GROUP_IDS) {
    for (const m of state.groups[g]?.memories ?? []) {
      if (m.impact >= 0 || m.cause.kind !== "law") continue;
      const title = (LAWS as Record<string, LawDef>)[m.cause.id]?.title ?? lowerFirst(m.cause.label);
      options.push({
        key: `law:${m.cause.id}:${g}`,
        weight: 50 - m.impact,
        text: `{{player}} aprovou o projeto ${title}. E quem pagou a conta? ${GROUPS[g].the.charAt(0).toUpperCase()}${GROUPS[g].the.slice(1)}.`,
        units: unitsOf(g),
        factsWork: readEconomics(state) || (ops[g] ?? 0) >= 10,
      });
    }
  }

  // 3. Broken promises.
  if (state.hidden.expectations > BALANCE.expectations.tolerance) {
    options.push({
      key: "promises",
      weight: 40 + state.hidden.expectations,
      text: "{{player}} prometeu tudo a todos. Cadê? Promessa não enche barriga.",
      units: [...NEIGHBOURHOOD_IDS],
      factsWork: (state.flags.laws_passed ?? 0) >= 6,
    });
  }

  // 4. Nothing to throw: inexperience.
  options.push({
    key: "inexperience",
    weight: 1,
    text: "{{player}} mal chegou na Câmara e já quer mais. Falta experiência, sobra ambição.",
    units: [...NEIGHBOURHOOD_IDS],
    factsWork: (state.flags.laws_passed ?? 0) >= 3,
  });

  const fresh = options.filter((o) => !used.has(o.key)).sort((a, b) => b.weight - a.weight);
  return fresh[0] ?? { ...options.at(-1)!, key: `inexperience@${state.turn}` };
}

/** One attack a week, opponents taking turns. It lands on the desk as a paper to answer. */
function attackRule(state: GameState): Effect[] {
  const c = state.campaign!;
  const opponents = OPPONENTS[c.path];
  const from: CandidateId = opponents[(state.turn - K.startWeek) % opponents.length]!;
  const opp = CANDIDATES[from];
  const m = attackMaterial(state);
  const attack: Attack = { key: m.key, from, units: m.units, status: "open", turn: state.turn };
  const id = `attack_${state.turn}`;
  const P0 = K.factsPresence;
  return [
    { type: "attack", attack },
    {
      type: "deskItem",
      item: {
        id,
        kind: "attack",
        title: `${opp.name} ${opp.attackVerb}`,
        body: `"${m.text}"`,
        choices: [
          {
            id: "facts",
            label: "Rebater com fatos",
            effects: m.factsWork
              ? [{ type: "attackStatus", key: m.key, status: "answered" }, ...m.units.map((u): Effect => ({ type: "presence", unit: u, delta: P0 }))]
              : [
                  { type: "attackStatus", key: m.key, status: "ignored" },
                  { type: "log", text: `A resposta a ${opp.name} não convenceu ninguém` },
                ],
          },
          {
            id: "counter",
            label: `Contra-atacar ${opp.name}`,
            effects: [
              { type: "attackStatus", key: m.key, status: "answered" },
              { type: "opponentHit", candidate: from, delta: K.counterOpponentHit },
              { type: "opinion", group: "retirees", delta: K.counterBacklash, label: "Baixaria na campanha" },
              { type: "opinion", group: "religious", delta: K.counterBacklash, label: "Baixaria na campanha" },
            ],
          },
          { id: "ignore", label: "Ignorar", effects: [{ type: "attackStatus", key: m.key, status: "ignored" }] },
        ],
        turn: state.turn,
      },
    },
  ];
}

// ------------------------------------------------------------------ weekly campaign rule

export function campaignRule(state: GameState): Effect[] {
  const effects: Effect[] = [];

  if (state.turn === K.warningWeek) effects.push(...warningLetter(state));
  if (state.turn >= K.decisionWeek && !state.campaign && !state.flags.path_offered) effects.push(...decisionPaper(state));

  // Nobody answered the decision paper: the party signs you up for re-election.
  if (state.turn >= K.startWeek && !state.campaign) {
    effects.push(
      { type: "removeDeskItem", id: "path_decision" },
      { type: "choosePath", path: "council" },
      { type: "flag", key: "path_council", set: 1 },
      {
        type: "deskItem",
        item: {
          id: "auto_council",
          kind: "letter",
          from: "party_boss",
          title: "O partido decidiu por você",
          body: "Você não respondeu a tempo. O partido inscreveu seu nome para a reeleição. Boa sorte nas ruas.",
          turn: state.turn,
        },
      },
    );
    return effects;
  }

  const c = state.campaign;
  if (!c || state.turn < K.startWeek || state.turn > K.endWeek) return effects;

  for (const unit of campaignUnits(state)) {
    // People forget rallies; canvassers keep knocking.
    const now = c.presence[unit] ?? 0;
    const fade = Math.round(now * K.presenceDecay * 10) / 10;
    const grow = (c.cabos[unit] ?? 0) * K.cabosWeeklyPresence;
    if (grow - fade !== 0) effects.push({ type: "presence", unit, delta: Math.round((grow - fade) * 10) / 10 });
  }
  // Attacks left unanswered keep costing where they hit.
  for (const a of c.attacks.filter((x) => x.status !== "answered")) {
    for (const u of a.units) effects.push({ type: "presence", unit: u, delta: -K.attackPressure });
  }
  // Spending far beyond the declared clean income: the press notices.
  const spent = state.flags.spent_total ?? 0;
  const clean = state.flags.income_clean ?? 0;
  if (spent > clean * K.spendSuspicionRatio) {
    effects.push({ type: "flag", key: "investigation", add: K.spendSuspicionInvestigation });
    if (!state.flags.spend_noticed) {
      effects.push({ type: "flag", key: "spend_noticed", set: 1 }, {
        type: "deskItem",
        item: {
          id: "spend_noticed",
          kind: "phone",
          from: "journalist",
          expression: "suspicious",
          title: "Helena Vaz faz contas",
          body:
            "\"{{g:Vereador/Vereadora}}, somei o que sua campanha gastou: comício, carro de som, cabo eleitoral. E somei o que você declarou " +
            "de arrecadação. As duas contas não fecham. De onde veio a diferença?\"",
          turn: state.turn,
        },
      });
    }
  }
  if (state.turn <= K.endWeek) effects.push(...attackRule(state));
  return effects;
}

/** Media in the campaign also builds presence where the targeted group lives. */
export function mediaPresence(state: GameState, group: GroupId, paid: boolean): Effect[] {
  if (!state.campaign) return [];
  const amount = K.mediaPresence * (paid ? 2 : 1);
  return NEIGHBOURHOOD_IDS.flatMap((nb): Effect[] => {
    const share = (NEIGHBOURHOODS[nb].residents as Record<string, number>)[group] ?? 0;
    return share > 0 ? [{ type: "presence", unit: nb, delta: Math.round(amount * share * 10) / 10 }] : [];
  });
}

/** For the Caminhos card: how many groups are with you, in words for the mayor race. */
export function supportingGroups(state: GameState): GroupId[] {
  return GROUP_IDS.filter((g) => opinionOf(state, g) >= P.groupSupportThreshold);
}

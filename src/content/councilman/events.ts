import type { EventDef } from "../../core/chapter";
import { flag, funds, integrity, opinion, relation } from "../helpers";

/**
 * Events: things that happen TO the player. Every trigger is a condition on
 * the state, never chance. Variants change a character's words and face
 * according to hidden variables: this is how hidden morality leaks out.
 *
 * Templates ({{worst:students}}, {{date:post_populist}}...) let newspapers
 * name the player's own earlier decision as the cause. See core/text.ts.
 */
export const EVENTS: EventDef[] = [
  // =============================================================== the Mentor
  {
    id: "mentor_checkin",
    trigger: { ref: "turn", op: ">=", value: 4 },
    item: {
      id: "mentor_checkin",
      kind: "letter",
      from: "mentor",
      expression: "neutral",
      title: "A note from Otávio",
      body:
        "Kid, a word of advice. You're making friends with the wrong people: voters. Voters forget. " +
        "The party remembers. Come and see me when you're ready to learn how things are really done.",
      choices: [
        { id: "thanks", label: "Thank him for the advice", effects: [relation("mentor", 4)] },
        { id: "nomination", label: "Ask what it takes to get the nomination", effects: [relation("mentor", 2), flag("mentor_explained")] },
      ],
    },
    variants: [
      {
        when: { ref: "integrity", op: "<", value: 55 },
        expression: "pleased",
        body:
          "Kid! Teixeira tells me you're a reasonable person. I always knew you had it in you. " +
          "Stick with me and the nomination is a formality. We take care of our own.",
      },
    ],
  },
  {
    id: "mentor_favour",
    trigger: { all: [{ ref: "turn", op: ">=", value: 9 }, { ref: "relation:mentor", op: ">=", value: 20 }] },
    item: {
      id: "mentor_favour",
      kind: "letter",
      from: "mentor",
      expression: "pleased",
      title: "Otávio's nephew",
      body:
        "My sister's boy, Juninho, needs a job. Nothing heavy. A position in your office, a salary, " +
        "he doesn't even need to come in on Fridays. Or Mondays. You'd be doing an old friend a great kindness.",
      choices: [
        {
          id: "hire",
          label: "Put Juninho on the payroll",
          effects: [
            relation("mentor", 15),
            integrity(-8),
            flag("hired_nephew"),
            { type: "dossier", id: "nephew_payroll", label: "Otávio's nephew on the office payroll", threads: 2 },
          ],
        },
        {
          id: "see_through",
          label: "\"I know exactly what this is, Otávio.\"",
          requires: { bookFinished: "machiavelli" },
          effects: [relation("mentor", -5), relation("party_boss", 5), flag("mentor_respects")],
        },
        { id: "refuse", label: "Refuse, as kindly as you can", effects: [relation("mentor", -15), integrity(2)] },
      ],
    },
  },
  {
    id: "mentor_drifts",
    trigger: { all: [{ ref: "turn", op: ">=", value: 12 }, { ref: "relation:mentor", op: "<=", value: -10 }] },
    onFire: [relation("party_boss", -8), relation("rival", 5)],
    item: {
      id: "mentor_drifts",
      kind: "report",
      title: "Corridor gossip",
      body:
        "Your aide heard it at the coffee machine: Otávio Brandão has been telling anyone who'll listen " +
        "that Renata Saldanha is \"the future of the party\". The party boss was in the room.",
    },
  },

  // =============================================================== the Rival
  {
    id: "rival_credit",
    trigger: {
      all: [{ ref: "flag:laws_passed", op: ">=", value: 1 }, { ref: "turn", op: ">=", value: 5 }, { ref: "relation:rival", op: "<", value: 15 }],
    },
    item: {
      id: "rival_credit",
      kind: "phone",
      from: "rival",
      expression: "pleased",
      title: "Renata is on the radio",
      body:
        "Your aide turns up the radio. Renata Saldanha is explaining, warmly and at length, " +
        "how she fought for the bill you wrote. The host calls her \"the councillor who gets things done\".",
      choices: [
        {
          id: "confront",
          label: "Call the station and set the record straight",
          effects: [relation("rival", -15), opinion("students", 2, "Defended own work"), relation("party_boss", -3)],
        },
        { id: "let_go", label: "Let it go. There will be other bills.", effects: [relation("rival", 5), flag("let_rival_credit")] },
        {
          id: "leak",
          label: "Leak what you know about her campaign money",
          requires: { ref: "flag:rival_dirt", op: ">=", value: 1 },
          effects: [relation("rival", -25), integrity(-5), relation("journalist", 10), flag("leaked_rival")],
        },
      ],
    },
  },
  {
    id: "rival_pact",
    trigger: { all: [{ ref: "flag:rival_ally", op: ">=", value: 1 }, { ref: "turn", op: ">=", value: 12 }] },
    item: {
      id: "rival_pact",
      kind: "letter",
      from: "rival",
      expression: "neutral",
      title: "A proposal from Renata",
      body:
        "\"Let's be adults. Only one of us gets the nomination this time. Back me, and when I'm mayor " +
        "you'll be the president of this council. Next time, it's your turn. I keep my word.\"",
      choices: [
        { id: "accept", label: "Shake her hand", effects: [relation("rival", 15), relation("party_boss", -6), flag("backed_rival")] },
        { id: "decline", label: "\"May the best candidate win.\"", effects: [relation("rival", -12)] },
      ],
    },
  },
  {
    id: "rival_tipoff",
    trigger: { all: [{ ref: "relation:rival", op: "<=", value: -20 }, { ref: "unexposedThreads", op: ">=", value: 1 }] },
    onFire: [{ type: "flag", key: "investigation", add: 35 }, flag("rival_leaked_you")],
    item: {
      id: "rival_tipoff",
      kind: "phone",
      from: "journalist",
      expression: "suspicious",
      title: "Helena Vaz is on the line",
      body:
        "\"Councillor. Someone left an envelope at the newspaper this morning. No name. " +
        "Very interesting papers about your finances. Would you like to comment before I start making calls?\"",
      choices: [
        { id: "no_comment", label: "\"No comment.\"", effects: [relation("journalist", -5)] },
        { id: "who", label: "\"Ask Renata Saldanha where she got them.\"", effects: [relation("journalist", -2), relation("rival", -10)] },
      ],
    },
  },

  // =============================================================== the Journalist
  {
    id: "journalist_profile",
    trigger: { ref: "turn", op: ">=", value: 3 },
    item: {
      id: "journalist_profile",
      kind: "letter",
      from: "journalist",
      expression: "neutral",
      title: "Interview request: Correio de Porto Ferro",
      body:
        "Councillor, the Correio is profiling the new members of the Câmara. Who you are, what you believe, " +
        "who paid for your campaign. The usual. Thirty minutes of your time? — Helena Vaz",
      choices: [
        {
          id: "grant",
          label: "Grant the interview",
          effects: [relation("journalist", 10), opinion("students", 2, "A thoughtful interview"), opinion("retirees", 2, "A thoughtful interview")],
        },
        { id: "decline", label: "Too busy, sorry", effects: [relation("journalist", -8)] },
        {
          id: "off_record",
          label: "Off the record: point her at Renata's donors",
          requires: { ref: "flag:rival_dirt", op: ">=", value: 1 },
          effects: [relation("journalist", 12), relation("rival", -15), flag("leaked_rival")],
        },
      ],
    },
    variants: [
      {
        when: { ref: "unexposedThreads", op: ">=", value: 1 },
        expression: "suspicious",
        body:
          "Councillor, the Correio is profiling the new members of the Câmara. I'm particularly interested in " +
          "your campaign finances. Construction money, mostly, I hear. Thirty minutes? I'd hate to write it without your side. — H. Vaz",
      },
    ],
  },
  {
    id: "journalist_sniffing",
    trigger: { all: [{ ref: "flag:investigation", op: ">=", value: 40 }, { ref: "unexposedThreads", op: ">=", value: 1 }] },
    item: {
      id: "journalist_sniffing",
      kind: "phone",
      from: "journalist",
      expression: "suspicious",
      title: "Helena Vaz, again",
      body:
        "\"I'm following some money, councillor. It keeps walking past your office. " +
        "I'll publish when I can prove it. You could save us both some time.\"",
      choices: [
        { id: "deny", label: "Deny everything", effects: [relation("journalist", -10), flag("lied_to_press")] },
        { id: "confess", label: "Come clean. Tell her everything.", effects: [relation("journalist", 15), flag("confess")] },
        { id: "threaten", label: "Mention your lawyers. And her editor's debts.", effects: [relation("journalist", -25), integrity(-5), flag("threatened_press")] },
      ],
    },
  },
  {
    id: "journalist_ally",
    trigger: {
      all: [
        { ref: "turn", op: ">=", value: 8 },
        { ref: "relation:journalist", op: ">=", value: 15 },
        { ref: "dossierThreads", op: "==", value: 0 },
        { ref: "integrity", op: ">=", value: 60 },
      ],
    },
    onFire: [flag("rival_dirt")],
    item: {
      id: "journalist_ally",
      kind: "phone",
      from: "journalist",
      expression: "pleased",
      title: "A tip from Helena",
      body:
        "\"You're one of the few in that building I haven't got a file on. So, a favour between honest people: " +
        "look at who paid for Renata Saldanha's leaflets. Teixeira Construções. You didn't hear it from me.\"",
      choices: [{ id: "thanks", label: "\"I owe you one, Helena.\"", effects: [relation("journalist", 5)] }],
    },
  },

  // =============================================================== the Party
  {
    id: "boss_warning",
    trigger: { ref: "relation:party_boss", op: "<=", value: -25 },
    item: {
      id: "boss_warning",
      kind: "letter",
      from: "party_boss",
      expression: "angry",
      title: "Last warning",
      body:
        "The party gave you a seat. The party can give it to somebody else. " +
        "Next time you embarrass us, you'll read about your expulsion in the Correio.",
      choices: [
        { id: "apologise", label: "Apologise and promise to vote the line", effects: [relation("party_boss", 15), flag("party_line"), integrity(-2)] },
        { id: "firm", label: "Stand your ground", effects: [relation("party_boss", -8), opinion("students", 3, "Stood up to the party machine")] },
      ],
    },
  },
  {
    id: "boss_fundraiser",
    trigger: { all: [{ ref: "turn", op: ">=", value: 8 }, { ref: "relation:party_boss", op: ">=", value: 20 }] },
    item: {
      id: "boss_fundraiser",
      kind: "letter",
      from: "party_boss",
      expression: "pleased",
      title: "Invitation: party fundraising dinner",
      body: "Black tie. Three hundred guests, all of them with cheque books. Your table is near the front. That means something.",
      choices: [
        { id: "attend", label: "Attend and work the room", effects: [funds(12), relation("party_boss", 4)] },
        { id: "skip", label: "Send your apologies", effects: [relation("party_boss", -3)] },
      ],
    },
  },

  // =============================================================== weak links breaking (conspiracy)
  {
    id: "mentor_leak",
    trigger: { all: [{ ref: "flag:mentor_knows", op: ">=", value: 1 }, { ref: "relation:mentor", op: "<=", value: -10 }, { ref: "exposed:teixeira_cash", op: "==", value: 0 }] },
    onFire: [{ type: "flag", key: "investigation", add: 40 }, { type: "thread", id: "teixeira_cash", add: 2 }],
    item: {
      id: "mentor_leak",
      kind: "report",
      title: "Seen at Bar Brasil",
      body:
        "Your aide saw Otávio Brandão having a long lunch with Helena Vaz yesterday. He was doing most of the talking. " +
        "He knows exactly how Teixeira's money reached you.",
    },
  },
  {
    id: "church_scandal",
    trigger: { all: [{ ref: "flag:laundered_church", op: ">=", value: 1 }, { ref: "exposed:teixeira_cash", op: "==", value: 1 }] },
    onFire: [{ type: "neighbourhood", id: "sao_bento", mood: -15, addMarker: "protest" }, opinion("religious", -15, "Used a soup kitchen to launder money")],
    item: {
      id: "church_scandal",
      kind: "newspaper",
      title: "SOUP KITCHEN USED TO LAUNDER CAMPAIGN MONEY",
      body:
        "Pastor Gilmar Rocha wept as he told the Correio that his charity had been \"used like a laundromat\" by councillor {{player}}. " +
        "Worshippers in São Bento gathered outside the cathedral last night. \"We fed the hungry with stolen money,\" said one volunteer.",
    },
  },

  // =============================================================== crises (newspapers)
  {
    id: "crisis_students",
    trigger: { ref: "opinion:students", op: "<=", value: -15 },
    onFire: [
      { type: "neighbourhood", id: "cidade_universitaria", mood: -10, addMarker: "protest" },
      { type: "neighbourhood", id: "centro", addMarker: "protest" },
    ],
    item: {
      id: "crisis_students",
      kind: "newspaper",
      title: "STUDENTS MARCH ON THE CÂMARA",
      body:
        "Thousands of students marched from Cidade Universitária to the steps of the City Council yesterday, " +
        "chanting the name of councillor {{player}}. Organisers named {{worst:students}} as the last straw. " +
        "\"We remember,\" read one banner.",
    },
  },
  {
    id: "crisis_periphery",
    trigger: { ref: "opinion:periphery", op: "<=", value: -15 },
    onFire: [{ type: "neighbourhood", id: "morro_esperanca", mood: -10, addMarker: "protest" }],
    item: {
      id: "crisis_periphery",
      kind: "newspaper",
      title: "BURNING TYRES BLOCK AVENIDA: THE HILL IS ANGRY",
      body:
        "Residents of Morro da Esperança blocked the main avenue for six hours. Community leaders told the Correio " +
        "the anger goes back to {{worst:periphery}}. \"They only come up the hill to take photographs.\"",
    },
  },
  {
    id: "crisis_business",
    trigger: { ref: "opinion:business", op: "<=", value: -35 },
    onFire: [relation("donor", -10)],
    item: {
      id: "crisis_business",
      kind: "newspaper",
      title: "COMMERCIAL ASSOCIATION CLOSES ITS DOORS TO {{PLAYER}}",
      body:
        "Porto Ferro's Commercial Association has voted to refuse all meetings with councillor {{player}}. " +
        "Its president cited {{worst:business}}: \"Every shop on Rua Direita has paid for that decision.\"",
    },
  },
  {
    id: "crisis_religious",
    trigger: { ref: "opinion:religious", op: "<=", value: -20 },
    item: {
      id: "crisis_religious",
      kind: "newspaper",
      title: "FROM THE PULPIT, A WARNING ABOUT THE COUNCILLOR",
      body:
        "On Sunday, pastors in four churches asked their congregations to \"pray for the conscience\" of councillor {{player}}. " +
        "Several mentioned {{worst:religious}}.",
    },
  },
  {
    id: "crisis_retirees",
    trigger: { ref: "opinion:retirees", op: "<=", value: -20 },
    item: {
      id: "crisis_retirees",
      kind: "newspaper",
      title: "LETTERS: \"I VOTED FOR THIS COUNCILLOR. NEVER AGAIN.\"",
      body:
        "This week the Correio received 143 letters from pensioners about councillor {{player}}, most of them about " +
        "{{worst:retirees}}. We publish a selection on page 6. None are kind.",
    },
  },
  {
    id: "crisis_workers",
    trigger: { ref: "opinion:workers", op: "<=", value: -15 },
    onFire: [{ type: "neighbourhood", id: "vila_operaria", mood: -8, addMarker: "protest" }],
    item: {
      id: "crisis_workers",
      kind: "newspaper",
      title: "STEELWORKERS' UNION: {{PLAYER}} IS 'NOT WELCOME' IN VILA OPERÁRIA",
      body:
        "The union assembly voted unanimously to declare councillor {{player}} unwelcome at the factory gates, " +
        "citing {{worst:workers}}.",
    },
  },
  {
    id: "promises_crash",
    trigger: { ref: "flag:weeks_over_expectations", op: ">=", value: 4 },
    item: {
      id: "promises_crash",
      kind: "newspaper",
      title: "THE COUNCILLOR WHO PROMISED TOO MUCH",
      body:
        "Since {{date:post_populist}}, councillor {{player}} has posted {{flag:posts_populist}} viral videos full of promises. " +
        "The Correio went looking for the results. We found very few. Readers who once shared the videos are now sharing something else: their disappointment.",
    },
  },
  {
    id: "rising_star",
    trigger: { all: [{ ref: "averageOpinion", op: ">=", value: 25 }, { ref: "turn", op: ">=", value: 6 }] },
    onFire: [relation("party_boss", 5)],
    item: {
      id: "rising_star",
      kind: "newspaper",
      title: "A RISING STAR IN THE CÂMARA?",
      body:
        "Barely months into the job, councillor {{player}} is the name on everyone's lips in Porto Ferro. " +
        "Party insiders, speaking anonymously, did not rule out bigger ambitions.",
    },
  },
];

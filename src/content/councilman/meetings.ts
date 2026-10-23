import { expectations, flag, funds, integrity, opinion, relation } from "../helpers";
import type { MeetingDef } from "../types";

/**
 * Meetings the player can request. For each character, the FIRST meeting whose
 * `when` holds (and that hasn't happened yet, unless repeatable) is the one that
 * lands on the desk. Order matters: put special meetings before small talk.
 *
 * Nothing here says "corrupt" or "honest". The temptation is just... an offer.
 */
export const MEETINGS: MeetingDef[] = [
  // ------------------------------------------------------------ donor
  {
    id: "donor_first_offer",
    with: "donor",
    title: "Lunch with Augusto Teixeira",
    body:
      "Teixeira orders for both of you without asking. \"Campaigns are expensive, councilman. I like to help young people with a future. " +
      "My accountant can make a contribution... discreet. Or official, if you prefer paperwork.\"",
    choices: [
      {
        id: "cash",
        label: "Accept the discreet contribution",
        effects: [
          funds(40),
          integrity(-12),
          relation("donor", 20),
          flag("took_dirty_money"),
          { type: "dossier", id: "teixeira_cash", label: "Undeclared cash from Teixeira Construções", threads: 3 },
        ],
      },
      {
        id: "declared",
        label: "Accept, but declare it officially",
        effects: [funds(15), integrity(-2), relation("donor", 5), flag("owes_teixeira")],
      },
      {
        id: "hayek_pitch",
        label: "Talk market reform instead of money",
        requires: { bookFinished: "hayek" },
        effects: [relation("donor", 10), funds(10), opinion("business", 4, "Business-friendly vision")],
      },
      { id: "refuse", label: "Politely refuse", effects: [relation("donor", -15), integrity(3)] },
    ],
  },
  {
    id: "donor_favour",
    with: "donor",
    when: { any: [{ ref: "flag:took_dirty_money", op: ">=", value: 1 }, { ref: "flag:owes_teixeira", op: ">=", value: 1 }] },
    title: "Teixeira calls in a favour",
    body:
      "\"The ring road contract goes to the council next month. My company is the best qualified, obviously. " +
      "I'd hate for a friend to vote against a friend.\"",
    choices: [
      {
        id: "vote_for",
        label: "Promise your vote",
        effects: [
          funds(20),
          integrity(-10),
          relation("donor", 15),
          { type: "dossier", id: "ring_road_vote", label: "Sold vote on the ring road contract", threads: 2 },
        ],
      },
      { id: "decline", label: "Say you'll judge it on merit", effects: [relation("donor", -25), integrity(4)] },
    ],
  },
  {
    id: "donor_smalltalk",
    with: "donor",
    repeatable: true,
    title: "Coffee with Teixeira",
    body: "Teixeira talks about his grandchildren, his yacht, and how much the city owes builders like him.",
    choices: [{ id: "listen", label: "Listen politely", effects: [relation("donor", 3)] }],
  },

  // ------------------------------------------------------------ party boss
  {
    id: "boss_loyalty",
    with: "party_boss",
    title: "A summons from party headquarters",
    body: "\"New councillors either learn to vote with the bench, or they learn to be lonely. Which kind are you?\"",
    choices: [
      { id: "loyal", label: "Pledge to follow the party line", effects: [relation("party_boss", 12), flag("party_line")] },
      {
        id: "independent",
        label: "Say you'll vote your conscience",
        effects: [relation("party_boss", -8), integrity(2), opinion("students", 3, "Stood up to party bosses")],
      },
    ],
  },
  {
    id: "boss_smalltalk",
    with: "party_boss",
    repeatable: true,
    title: "Report to party headquarters",
    body: "You walk the boss through your week. They listen, take notes, and say nothing you can quote.",
    choices: [{ id: "report", label: "Show your loyalty", effects: [relation("party_boss", 4)] }],
  },

  // ------------------------------------------------------------ mentor
  {
    id: "mentor_lessons",
    with: "mentor",
    title: "Otávio's lesson",
    body:
      "Otávio pours two cachaças. \"The plenary is theatre, kid. Votes are decided in corridors. " +
      "I can introduce you to the people who count. Everybody owes everybody in that building.\"",
    choices: [
      {
        id: "learn",
        label: "Teach me how the council really works",
        effects: [relation("mentor", 8), flag("council_favours"), integrity(-3)],
      },
      {
        id: "ask_price",
        label: "And what do you get out of it, Otávio?",
        requires: { bookFinished: "machiavelli" },
        effects: [relation("mentor", -4), flag("knows_mentor_agenda"), flag("council_favours")],
      },
      { id: "own_way", label: "I'll do things my own way", effects: [relation("mentor", -6), integrity(2)] },
    ],
  },
  {
    id: "mentor_smalltalk",
    with: "mentor",
    repeatable: true,
    title: "Dinner with Otávio",
    body: "Otávio tells war stories from the '80s council. Half of them are probably true.",
    choices: [{ id: "listen", label: "Laugh at the right moments", effects: [relation("mentor", 4)] }],
  },

  // ------------------------------------------------------------ community leader
  {
    id: "leader_hill",
    with: "community_leader",
    title: "Up the hill with Dona Lurdes",
    body:
      "Dona Lurdes walks you past open sewers. \"Every four years someone comes up here and promises sanitation. " +
      "What are you going to promise me, councilman?\"",
    choices: [
      {
        id: "promise",
        label: "Promise sanitation within a year",
        effects: [expectations(12), opinion("periphery", 8, "Promised sanitation"), relation("community_leader", 12), flag("promised_sanitation")],
      },
      {
        id: "honest",
        label: "\"I can't promise. But I'll fight for it.\"",
        effects: [relation("community_leader", 5), opinion("periphery", 2, "Spoke honestly on the hill")],
      },
      {
        id: "keynes_jobs",
        label: "Propose hiring locals for public works",
        requires: { bookFinished: "keynes" },
        effects: [relation("community_leader", 14), opinion("periphery", 5, "Jobs for the hill"), opinion("workers", 2, "Jobs plan")],
      },
    ],
  },
  {
    id: "leader_smalltalk",
    with: "community_leader",
    repeatable: true,
    title: "Residents' association meeting",
    body: "Folding chairs, warm soda and a long list of complaints. Dona Lurdes watches how you listen.",
    choices: [{ id: "listen", label: "Take notes on every complaint", effects: [relation("community_leader", 4), opinion("periphery", 1, "Listened")] }],
  },

  // ------------------------------------------------------------ rival
  {
    id: "rival_coffee",
    with: "rival",
    title: "Coffee with Renata Saldanha",
    body: "Renata stirs her coffee slowly. \"We're the only two people under forty in that building. We could help each other. Or not.\"",
    choices: [
      { id: "ally", label: "Propose an alliance", effects: [relation("rival", 10), flag("rival_ally")] },
      {
        id: "probe",
        label: "Steer the talk to her campaign finances",
        requires: { bookFinished: "machiavelli" },
        effects: [relation("rival", -6), flag("rival_dirt")],
      },
      { id: "cold", label: "Keep it cordial and distant", effects: [] },
    ],
  },
  {
    id: "rival_smalltalk",
    with: "rival",
    repeatable: true,
    title: "Corridor chat with Renata",
    body: "Renata is friendly. Too friendly, maybe.",
    choices: [{ id: "chat", label: "Exchange council gossip", effects: [relation("rival", 3)] }],
  },
];

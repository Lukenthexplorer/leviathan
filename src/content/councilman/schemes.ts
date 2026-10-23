import { flag, funds, integrity, log, newspaper, opinion, relation } from "../helpers";
import type { SchemeDef } from "../types";

/**
 * Conspiracies. Every choice is a trade-off between cost, convenience and
 * loose threads, and some weak links break much later, by themselves.
 */
export const SCHEMES = {
  teixeira_donation: {
    title: "Teixeira's money",
    briefing:
      "Augusto Teixeira's accountant will have 40 thousand ready by Friday. Undeclared, of course. " +
      "The money has to reach your campaign without touching your name. Who carries it, how it travels, and who knows: that's up to you.",
    dossierId: "teixeira_cash",
    dossierLabel: "Undeclared Teixeira Construções cash {intermediary}, {payment}",
    headline: "THE COUNCILLOR AND THE CONTRACTOR'S CASH",
    effects: [funds(40), integrity(-12), flag("hid_donation"), log("Hid an illegal donation from Teixeira Construções")],
    slots: [
      {
        id: "intermediary",
        question: "Who carries the money?",
        options: [
          {
            id: "brother_in_law",
            label: "Your brother-in-law, Tonho",
            description: "Family. Owes you a favour. Loves a barbecue, a beer and an audience.",
            weakness: "Talks when he drinks. And he will want to spend some of it.",
            threads: 2,
            phrase: "carried by the councillor's brother-in-law",
            effects: [
              {
                type: "schedule",
                inTurns: 8,
                label: "Tonho shows off a brand-new pickup truck",
                effects: [{ type: "thread", id: "teixeira_cash", add: 1 }, log("The neighbours ask how Tonho paid for a new truck")],
              },
            ],
          },
          {
            id: "doleiro",
            label: "Beto Câmbio, a doleiro",
            description: "A black-market money changer who moves cash for half the politicians in the state. Takes 15%.",
            weakness: "If the Federal Police ever catch him, he keeps very detailed notebooks.",
            threads: 1,
            phrase: "moved by a black-market money changer",
            effects: [
              funds(-6),
              {
                type: "schedule",
                inTurns: 14,
                label: "Federal Police arrest the doleiro Beto Câmbio",
                effects: [
                  { type: "thread", id: "teixeira_cash", add: 3 },
                  flag("doleiro_arrested"),
                  newspaper(
                    "news_doleiro",
                    "FEDERAL POLICE ARREST MONEY CHANGER 'BETO CÂMBIO'",
                    "In a dawn raid, federal agents arrested Roberto 'Beto Câmbio' Assis, suspected of moving millions in political cash. " +
                      "Investigators seized notebooks full of initials and dates. Sources say he is negotiating a plea deal.",
                  ),
                ],
              },
            ],
          },
          {
            id: "party_accountant",
            label: "The party's accountant",
            description: "Has done this a hundred times. Clean, professional, and the party will know.",
            weakness: "The party now owns a piece of you, and the party has long memory.",
            threads: 1,
            phrase: "handled by the party's own accountant",
            requires: { ref: "relation:party_boss", op: ">=", value: 10 },
            effects: [relation("party_boss", 8), flag("party_knows")],
          },
          {
            id: "yourself",
            label: "You, personally",
            description: "No middlemen. A parking garage, a sports bag, ten minutes.",
            weakness: "Security cameras. Doormen. Your own face.",
            threads: 3,
            phrase: "collected personally by the councillor",
          },
        ],
      },
      {
        id: "payment",
        question: "How does the money travel?",
        options: [
          {
            id: "cash",
            label: "Cash in a sports bag",
            description: "No bank, no records.",
            weakness: "Cash needs hands, and hands remember.",
            threads: 1,
            phrase: "in a sports bag full of cash",
          },
          {
            id: "invoices",
            label: "Fake consulting invoices",
            description: "Teixeira pays your 'consultancy' for studies nobody will ever write.",
            weakness: "Paper trails last forever, and auditors love paper.",
            threads: 2,
            phrase: "disguised as fake consulting invoices",
          },
          {
            id: "church",
            label: "A gift to a church charity",
            description: "Pastor Gilmar's soup kitchen receives a generous donation, then 'lends' your campaign vans and volunteers.",
            weakness: "If it ever comes out, the faithful will feel used.",
            threads: 1,
            phrase: "laundered through a church soup kitchen",
            effects: [flag("laundered_church")],
          },
          {
            id: "smurfing",
            label: "Fifty small donations",
            description: "Teixeira's employees each 'donate' a little, legally, with his money.",
            weakness: "Fifty people know they were used. Fifty.",
            threads: 3,
            phrase: "split into fifty fake small donations",
          },
        ],
      },
      {
        id: "knows",
        question: "Who knows?",
        options: [
          {
            id: "alone",
            label: "Nobody but you",
            description: "You handle every detail yourself.",
            weakness: "Every detail carries your fingerprints.",
            threads: 1,
            phrase: "with no one else involved",
          },
          {
            id: "chief_of_staff",
            label: "Marta, your chief of staff",
            description: "Loyal, discreet, underpaid. She'll want a bonus.",
            weakness: "Loyalty has a price, and now you've set it.",
            threads: 1,
            phrase: "with the help of the councillor's chief of staff",
            effects: [funds(-3)],
          },
          {
            id: "otavio",
            label: "Otávio",
            description: "He arranged the lunch. He'd find out anyway, and he likes to be useful.",
            weakness: "If Otávio ever turns on you, so does this secret.",
            threads: 0,
            phrase: "with the knowledge of a party veteran",
            effects: [relation("mentor", 10), flag("mentor_knows")],
          },
        ],
      },
    ],
    abort: {
      label: "Walk away. Tell Teixeira to keep his money.",
      effects: [relation("donor", -20), integrity(3), flag("backed_out_of_scheme"), opinion("business", -2, "Snubbed a big donor")],
    },
  },
} as const satisfies Record<string, SchemeDef>;

export type SchemeId = keyof typeof SCHEMES;

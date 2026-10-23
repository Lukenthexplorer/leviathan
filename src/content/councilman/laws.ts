import { log, newspaper, opinion } from "../helpers";
import type { LawDef } from "../types";

/**
 * Local bills a councilman can propose. Every law helps someone and costs
 * someone, and most have a consequence that arrives weeks later.
 */
export const LAWS = {
  bus_fare_freeze: {
    title: "Bus Fare Freeze",
    summary: "Freeze city bus fares for two years. The bus companies will want compensation.",
    topics: ["transport", "wages"],
    councilSupport: 45,
    onPass: [
      opinion("students", 8, "Froze bus fares"),
      opinion("workers", 6, "Froze bus fares"),
      opinion("periphery", 6, "Froze bus fares"),
      opinion("business", -6, "Froze bus fares without compensation"),
    ],
    followUps: [
      {
        inTurns: 6,
        label: "Bus companies cut night routes after the fare freeze",
        effects: [
          opinion("periphery", -6, "Night buses cut"),
          opinion("workers", -4, "Night buses cut"),
          { type: "neighbourhood", id: "morro_esperanca", mood: -6 },
          newspaper(
            "news_night_buses",
            "NIGHT BUSES CUT: OPERATORS BLAME THE FARE FREEZE",
            "Three night routes to the hillside communities were cancelled yesterday. The bus operators' syndicate says the fare freeze " +
              "approved in {{date:bus_fare_freeze}} left them \"no choice\". Night-shift workers now face a two-hour walk home.",
          ),
        ],
      },
    ],
    delivers: 12,
  },

  hillside_sanitation: {
    title: "Sanitation for Morro da Esperança",
    summary: "Run sewage and clean water up the hill. Expensive, slow, and nobody downtown will notice.",
    topics: ["sanitation", "housing", "construction"],
    councilSupport: 40,
    onPass: [opinion("periphery", 10, "Fought for hillside sanitation"), opinion("business", -3, "More public spending")],
    followUps: [
      {
        inTurns: 4,
        label: "Sanitation works begin on Morro da Esperança",
        effects: [{ type: "neighbourhood", id: "morro_esperanca", mood: 8, addMarker: "construction" }],
      },
      {
        inTurns: 12,
        label: "Health post reports fewer child illnesses on the hill",
        effects: [
          { type: "neighbourhood", id: "morro_esperanca", mood: 12, removeMarker: "construction" },
          opinion("periphery", 8, "Clean water arrived"),
          opinion("religious", 3, "Clean water arrived"),
          log("Clean water reaches Morro da Esperança"),
          newspaper(
            "news_clean_water",
            "CLEAN WATER REACHES MORRO DA ESPERANÇA",
            "For the first time in its history, the hill has running water and sewage. The health post reports child illnesses down by a third. " +
              "The works began with a bill proposed by councillor {{player}} in {{date:hillside_sanitation}}.",
          ),
        ],
      },
    ],
    delivers: 15,
  },

  night_safety_patrols: {
    title: "Night Safety Patrols",
    summary: "More municipal guards on the streets at night, with stop-and-search powers.",
    topics: ["safety"],
    councilSupport: 60,
    onPass: [
      opinion("retirees", 8, "More patrols at night"),
      opinion("business", 6, "More patrols at night"),
      opinion("religious", 4, "More patrols at night"),
      opinion("students", -6, "Stop-and-search powers"),
    ],
    followUps: [
      {
        inTurns: 5,
        label: "Complaints of police harassment on the hill after new patrols",
        effects: [
          opinion("periphery", -8, "Harassed by the new patrols"),
          { type: "neighbourhood", id: "morro_esperanca", mood: -10, addMarker: "police" },
          newspaper(
            "news_patrols",
            "\"THEY STOP US FOR BEING YOUNG\": PATROLS ACCUSED OF HARASSMENT",
            "Residents of Morro da Esperança describe nightly searches by the new municipal guards created in {{date:night_safety_patrols}}. " +
              "The patrols were meant for downtown. They seem to spend their nights on the hill.",
          ),
        ],
      },
    ],
    delivers: 8,
  },

  university_culture_fund: {
    title: "Student Culture Fund",
    summary: "Grants for theatre, music and student collectives in Cidade Universitária.",
    topics: ["culture", "education"],
    councilSupport: 45,
    onPass: [opinion("students", 10, "Funded student culture"), opinion("religious", -4, "Public money for 'degenerate' art")],
    followUps: [
      {
        inTurns: 6,
        label: "Street festival fills Cidade Universitária",
        effects: [{ type: "neighbourhood", id: "cidade_universitaria", mood: 10, addMarker: "rally" }],
      },
    ],
    delivers: 6,
  },

  pharmacy_discount: {
    title: "Pensioner Pharmacy Discount",
    summary: "Municipal discount on medicines for pensioners. Popular, and not cheap.",
    topics: ["health", "pensions"],
    councilSupport: 55,
    onPass: [opinion("retirees", 10, "Cheaper medicine"), opinion("religious", 2, "Care for the elderly")],
    followUps: [
      {
        inTurns: 10,
        label: "City auditors find a hole in the health budget after the pharmacy discount",
        effects: [
          opinion("business", -5, "Budget hole from the pharmacy discount"),
          log("Health budget overruns"),
          newspaper(
            "news_pharmacy_hole",
            "AUDITORS FIND A HOLE IN THE HEALTH BUDGET",
            "The pensioner pharmacy discount approved in {{date:pharmacy_discount}} has cost three times its estimate. " +
              "Business leaders ask who will pay. \"Us, as always,\" said one shopkeeper.",
          ),
        ],
      },
    ],
    delivers: 10,
  },

  church_tax_exemption: {
    title: "Church Property Tax Exemption",
    summary: "Exempt places of worship and their social projects from municipal property tax.",
    topics: ["family", "charity"],
    councilSupport: 55,
    onPass: [opinion("religious", 12, "Exempted churches from tax"), opinion("students", -5, "Tax breaks for churches")],
    delivers: 6,
  },

  downtown_tax_cut: {
    title: "Downtown Business Tax Cut",
    summary: "Cut the municipal service tax for small businesses in Centro, to fight empty shopfronts.",
    topics: ["taxes", "deregulation"],
    councilSupport: 50,
    requires: { bookFinished: "hayek" },
    onPass: [
      opinion("business", 12, "Cut business taxes"),
      opinion("workers", -3, "Tax cuts for the bosses"),
      opinion("periphery", -3, "Tax cuts for the bosses"),
    ],
    followUps: [
      {
        inTurns: 8,
        label: "New shops open in Centro after the tax cut",
        effects: [
          { type: "neighbourhood", id: "centro", mood: 10 },
          opinion("workers", 5, "New jobs downtown"),
          log("Shopfronts reopen in Centro"),
        ],
      },
    ],
    delivers: 8,
  },

  public_works_jobs: {
    title: "Public Works Jobs Programme",
    summary: "Hire the unemployed to repair roads and squares. Spend now, grow later.",
    topics: ["jobs", "construction", "wages"],
    councilSupport: 45,
    requires: { bookFinished: "keynes" },
    onPass: [opinion("workers", 10, "Created public works jobs"), opinion("periphery", 6, "Created public works jobs")],
    followUps: [
      {
        inTurns: 5,
        label: "Road crews at work in Vila Operária",
        effects: [{ type: "neighbourhood", id: "vila_operaria", mood: 10, addMarker: "construction" }],
      },
      {
        inTurns: 16,
        label: "Public works programme runs over budget",
        effects: [
          { type: "neighbourhood", id: "vila_operaria", removeMarker: "construction" },
          opinion("business", -6, "Public works overrun"),
          log("Public works go over budget"),
          newspaper(
            "news_works_overrun",
            "JOBS PROGRAMME OVER BUDGET, BUT VILA OPERÁRIA HAS NEW ROADS",
            "The public works programme launched in {{date:public_works_jobs}} is 40% over budget, the Treasury says. " +
              "Economists are split: some see waste, others a textbook Keynesian stimulus doing exactly what it promised.",
          ),
        ],
      },
    ],
    delivers: 15,
  },
} as const satisfies Record<string, LawDef>;

export type LawId = keyof typeof LAWS;
export const LAW_IDS = Object.keys(LAWS) as LawId[];

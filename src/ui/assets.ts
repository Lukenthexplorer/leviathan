/**
 * Single manifest of every asset the UI may load.
 * Components refer to assets by id (typed), never by raw path, so swapping a
 * placeholder for final art is a one-line change here.
 */

/**
 * Sound effects. A value can be one file or several variations; variations
 * play in rotation (round-robin), so repeated sounds don't feel robotic.
 * Real recordings are .mp3; .wav files are generated placeholders.
 */
export const SFX = {
  stamp_thud: "assets/audio/sfx/stamp_thud.wav",
  paper_slide: "assets/audio/sfx/paper_slide.wav",
  paper_pickup: "assets/audio/sfx/paper_pickup.wav",
  typewriter_key: "assets/audio/sfx/typewriter_key.wav",
  pen_sign: "assets/audio/sfx/pen_sign.wav",
  page_flip: "assets/audio/sfx/page_flip.wav",
  phone_ring: "assets/audio/sfx/phone_ring.wav",
  newspaper_spin: "assets/audio/sfx/newspaper_spin.wav",
  drawer_open: "assets/audio/sfx/drawer_open.wav",
  clock_tick: "assets/audio/sfx/clock_tick.wav",
  ui_hover: "assets/audio/sfx/ui_hover.wav",
  ui_click: "assets/audio/sfx/ui_click.wav",
  scandal_sting: "assets/audio/sfx/scandal_sting.wav",
  opinion_up: "assets/audio/sfx/opinion_up.wav",
  opinion_down: "assets/audio/sfx/opinion_down.wav",
  // election night (real recordings)
  tv_power_on: "assets/audio/sfx/tv_power_on.mp3",
  tv_static: "assets/audio/sfx/tv_static.mp3",
  vote_tick: ["assets/audio/sfx/vote_tick_1.mp3", "assets/audio/sfx/vote_tick_2.mp3", "assets/audio/sfx/vote_tick_3.mp3", "assets/audio/sfx/vote_tick_4.mp3"],
  lead_change: ["assets/audio/sfx/lead_change_1.mp3", "assets/audio/sfx/lead_change_2.mp3"],
  fireworks: ["assets/audio/sfx/fireworks_1.mp3", "assets/audio/sfx/fireworks_2.mp3"],
  crowd_groan: ["assets/audio/sfx/crowd_groan_1.mp3", "assets/audio/sfx/crowd_groan_2.mp3"],
  plantao_jingle: "assets/audio/sfx/plantao_jingle.mp3",
  victory_sting: "assets/audio/sfx/victory_sting.mp3",
  defeat_sting: "assets/audio/sfx/defeat_sting.mp3",
  // campaign
  sound_truck: "assets/audio/sfx/sound_truck.mp3",
  rally_crowd: "assets/audio/sfx/rally_crowd.mp3",
  cash: "assets/audio/sfx/cash.mp3",
  // still placeholders
  crowd_cheer: "assets/audio/sfx/crowd_cheer.wav",
} as const satisfies Record<string, string | readonly string[]>;
export type SfxId = keyof typeof SFX;

/**
 * Election-night radio narration, by situation, each with its variations
 * (played in rotation, never the same one twice in a row).
 */
export const NARRATION: Record<NarrationSituation, readonly string[]> = {
  opening: [
    "assets/audio/narration/radio_opening_1.mp3",
    "assets/audio/narration/radio_opening_2.mp3",
  ],
  ballots: [
    "assets/audio/narration/radio_ballots_1.mp3",
    "assets/audio/narration/radio_ballots_2.mp3",
    "assets/audio/narration/radio_ballots_3.mp3",
    "assets/audio/narration/radio_ballots_4.mp3",
    "assets/audio/narration/radio_ballots_5.mp3",
    "assets/audio/narration/radio_ballots_6.mp3",
  ],
  close_race: [
    "assets/audio/narration/radio_close_race_1.mp3",
    "assets/audio/narration/radio_close_race_2.mp3",
    "assets/audio/narration/radio_close_race_3.mp3",
    "assets/audio/narration/radio_close_race_4.mp3",
  ],
  lead_change: [
    "assets/audio/narration/radio_lead_change_1.mp3",
    "assets/audio/narration/radio_lead_change_2.mp3",
    "assets/audio/narration/radio_lead_change_3.mp3",
    "assets/audio/narration/radio_lead_change_4.mp3",
  ],
  outraged: [
    "assets/audio/narration/radio_outraged_1.mp3",
    "assets/audio/narration/radio_outraged_2.mp3",
    "assets/audio/narration/radio_outraged_3.mp3",
    "assets/audio/narration/radio_outraged_4.mp3",
  ],
  landslide: [
    "assets/audio/narration/radio_landslide_1.mp3",
    "assets/audio/narration/radio_landslide_2.mp3",
  ],
  last_ballot: ["assets/audio/narration/radio_last_ballot_1.mp3"],
  final: [
    "assets/audio/narration/radio_final_1.mp3",
    "assets/audio/narration/radio_final_2.mp3",
    "assets/audio/narration/radio_final_3.mp3",
  ],
};

import type { MusicBeds, NarrationSituation } from "./audio/rules";

/**
 * Music. One "bed" plays at a time, chosen by the moment (office weeks, the
 * campaign, election night); the layers loop on top of it all game long, their
 * volumes following the tension level. Real recordings are seamless loops.
 */
export const MUSIC_BEDS = {
  office: ["assets/audio/music/office_piano_stem.wav"],
  // Lucas preferred the generated piano + drums everywhere: the campaign and election-night
  // recordings are kept in art/source/audio/music/ but not used. A list of several files here
  // alternates them week by week.
  campaign: ["assets/audio/music/office_piano_stem.wav"],
  election: ["assets/audio/music/office_piano_stem.wav"],
} as const satisfies MusicBeds;

export const MUSIC_LAYERS = {
  tension_drums_stem: "assets/audio/music/tension_drums_stem.wav",
  city_ambience: "assets/audio/music/city_ambience.wav", // generated: Lucas preferred it to the recording
} as const;
export type LayerId = keyof typeof MUSIC_LAYERS;

/**
 * Where the screen hole is in tv_set.webp (1374x1145), in % of the image,
 * measured from its alpha channel (hole: x 186-989, y 410-965 px). The CRT
 * picture is laid out in exactly this box, behind the frame.
 */
export const TV_SCREEN = {
  left: (186 / 1374) * 100,
  top: (410 / 1145) * 100,
  width: ((989 - 186) / 1374) * 100,
  height: ((965 - 410) / 1145) * 100,
  /** Width / height of the whole TV image. */
  aspect: 1374 / 1145,
  /** Where the wooden cabinet starts and ends across the image (x 43-1333 px), in %. */
  cabinetLeft: (43 / 1374) * 100,
  cabinetRight: (1334 / 1374) * 100,
} as const;

export const DESK_ART = {
  desk_bg: "assets/desk.png", // final art: "Warm Light on Worn Mahogany"
  paper_blank: "assets/desk/paper_blank.svg",
  stamp: "assets/desk/stamp.png", // final art (used by .doc-stamp in styles.css)
  newspaper_frame: "assets/desk/newspaper_frame.svg",
  phone: "assets/desk/phone.svg",
  coffee_cup: "assets/desk/coffee_cup.png", // final art
  bills_folder: "assets/desk/bills_folder.png", // final art
  rolodex: "assets/desk/rolodex.png", // final art
  city_map_folded: "assets/desk/city_map_folded.png", // final art
  brick_phone: "assets/desk/brick_phone.png", // final art; not on the 1989 desk (cell phones reach Brazil in late 1990): kept for later chapters
  radio: "assets/desk/radio.png", // final art
  city_skyline: "assets/desk/city_skyline.png", // final art
  book_stack: "assets/desk/book_stack.png", // final art
  campaign_folder: "assets/desk/campaign_folder.svg", // placeholder: santinhos and a flag
  desk_night: "assets/desk_night.webp", // final art: same size and framing as desk.png, lit blue for election night
  lamp: "assets/desk/lamp.webp", // final art
  typewriter: "assets/desk/typewriter.webp", // final art
  rotary_phone: "assets/desk/rotary_phone.webp", // final art
  tv_set: "assets/desk/tv_set.webp", // final art: the screen is a transparent hole (TV_SCREEN)
  // Generated placeholders (scripts/gen-placeholders.ts); final art replaces them with the same name.
  poll_clipping: "assets/desk/poll_clipping.png",
  ledger: "assets/desk/ledger.png",
  calendar_page: "assets/desk/calendar_page.svg",
} as const;

/**
 * Leather desk blotter under the papers. Optional: set this to "assets/blotter.png"
 * once that file exists, and the desk shows it. Null = no blotter layer.
 */
export const BLOTTER: string | null = null;

export type Expression = "neutral" | "pleased" | "angry" | "suspicious";

/**
 * Final portraits made so far (originals live in art/source/). A character
 * with final art never shows a placeholder again: a missing expression falls
 * back to the closest one that exists, so a face never flips between styles.
 */
const FINAL_PORTRAITS: Record<string, Partial<Record<Expression, string>>> = {
  mentor: { neutral: "assets/portraits/mentor_neutral.png" },
  journalist: {
    neutral: "assets/portraits/journalist_neutral.png",
    suspicious: "assets/portraits/journalist_suspicious.png",
  },
  rival: {
    neutral: "assets/portraits/rival_neutral.png",
    pleased: "assets/portraits/rival_pleased.webp",
    angry: "assets/portraits/rival_angry.webp",
  },
  candidate_galvao: {
    neutral: "assets/portraits/cand_galvao_neutral.webp",
    pleased: "assets/portraits/cand_galvao_pleased.webp",
    angry: "assets/portraits/cand_galvao_angry.webp",
  },
  // The TV anchor: no polaroid frame, he's on screen. "Excited" is his pleased face.
  anchor_cid: {
    neutral: "assets/portraits/anchor_neutral.webp",
    pleased: "assets/portraits/anchor_excited.webp",
  },
  donor: { neutral: "assets/portraits/donor_neutral.png" },
  // Each party has its own boss. The "statesman" portrait fits the three men;
  // Cida Ramos (labour) keeps a placeholder until her own portrait exists.
  party_boss_liberal: { neutral: "assets/portraits/party_boss_statesman.png" },
  party_boss_conservative: { neutral: "assets/portraits/party_boss_statesman.png" },
  party_boss_centrao: { neutral: "assets/portraits/party_boss_statesman.png" },
  community_leader: { neutral: "assets/portraits/community_leader_neutral.png" },
};

/** Closest substitutes for each expression, in order. */
const FALLBACK: Record<Expression, Expression[]> = {
  neutral: [],
  pleased: ["neutral"],
  suspicious: ["neutral"],
  angry: ["suspicious", "neutral"],
};

export function portrait(subject: string, expression: Expression = "neutral"): string {
  const final = FINAL_PORTRAITS[subject];
  if (final) {
    for (const e of [expression, ...FALLBACK[expression]]) if (final[e]) return final[e];
    return Object.values(final)[0]!;
  }
  return `assets/portraits/${subject}_${expression}.svg`;
}

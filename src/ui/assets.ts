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
 * Election-night radio narration, by situation. Each situation takes several
 * variations; empty lists are ready for future recordings (they simply don't play).
 */
export const NARRATION: Record<NarrationSituation, readonly string[]> = {
  opening: ["assets/audio/narration/radio_opening.mp3"],
  ballots: ["assets/audio/narration/radio_ballots_1.mp3"],
  close_race: ["assets/audio/narration/radio_close_race.mp3"],
  lead_change: ["assets/audio/narration/radio_lead_change.mp3"],
  outraged: ["assets/audio/narration/radio_outraged.mp3"],
  final: ["assets/audio/narration/radio_final.mp3"],
  landslide: [],
  last_urn: [],
};

/** Music stems play together in a loop; their volumes follow the tension level. */
import type { NarrationSituation } from "./audio/rules";

export const MUSIC_STEMS = {
  office_piano_stem: "assets/audio/music/office_piano_stem.wav",
  tension_drums_stem: "assets/audio/music/tension_drums_stem.wav",
  city_ambience: "assets/audio/music/city_ambience.mp3", // seamless loop
} as const;
export type StemId = keyof typeof MUSIC_STEMS;

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
  brick_phone: "assets/desk/brick_phone.png", // final art (kept for phone calls)
  radio: "assets/desk/radio.png", // final art
  city_skyline: "assets/desk/city_skyline.png", // final art
  book_stack: "assets/desk/book_stack.png", // final art
  campaign_folder: "assets/desk/campaign_folder.svg", // placeholder: santinhos and a flag
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
  rival: { neutral: "assets/portraits/rival_neutral.png" },
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

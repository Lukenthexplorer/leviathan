/**
 * Single manifest of every asset the UI may load.
 * Components refer to assets by id (typed), never by raw path, so swapping a
 * placeholder for final art is a one-line change here.
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
} as const;
export type SfxId = keyof typeof SFX;

/** Music stems play together in a loop; their volumes follow the tension level. */
export const MUSIC_STEMS = {
  office_piano_stem: "assets/audio/music/office_piano_stem.wav",
  tension_drums_stem: "assets/audio/music/tension_drums_stem.wav",
  city_ambience: "assets/audio/music/city_ambience.wav",
} as const;
export type StemId = keyof typeof MUSIC_STEMS;

export const DESK_ART = {
  desk_bg: "assets/desk/desk_bg.svg",
  paper_blank: "assets/desk/paper_blank.svg",
  stamp_approved: "assets/desk/stamp_approved.svg",
  stamp_rejected: "assets/desk/stamp_rejected.svg",
  newspaper_frame: "assets/desk/newspaper_frame.svg",
  phone: "assets/desk/phone.svg",
  coffee_cup: "assets/desk/coffee_cup.svg",
  calendar_page: "assets/desk/calendar_page.svg",
} as const;

export type Expression = "neutral" | "pleased" | "angry" | "suspicious";

export function portrait(subject: string, expression: Expression = "neutral"): string {
  return `assets/portraits/${subject}_${expression}.svg`;
}

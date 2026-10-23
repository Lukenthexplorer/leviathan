import { NEIGHBOURHOODS, NEIGHBOURHOOD_IDS } from "../../content/councilman/neighbourhoods";
import type { GameState, MapMarker } from "../../core/types";
import { moodWord } from "../text";

/**
 * Pure translation from game state to what the map should show. No Pixi here:
 * this is the testable half of the map. The renderer only draws it.
 */
export interface DistrictView {
  id: string;
  name: string;
  /** Fill colour, from the district's mood. */
  tint: number;
  mood: number;
  moodWord: string;
  base: number;
  markers: MapMarker[];
}

export interface MapModel {
  districts: DistrictView[];
  /** Party colour, for the player's base flags. */
  partyColor: number;
}

const PARTY_COLORS: Record<string, number> = { labour: 0xa3322a, liberal: 0x2c6e86, conservative: 0x2b3d63, centrao: 0xa8842c };

const ANGRY = [0x9a, 0x3a, 0x2c];
const NEUTRAL = [0xd8, 0xcb, 0xa8]; // old paper
const HAPPY = [0x7f, 0xa0, 0x62];

/** Mood -100..100 -> colour: red when furious, paper when calm, green when thriving. */
export function moodColor(mood: number): number {
  const t = Math.max(-1, Math.min(1, mood / 100));
  const to = t < 0 ? ANGRY : HAPPY;
  const k = Math.abs(t);
  const [r, g, b] = NEUTRAL.map((c, i) => Math.round(c + (to[i]! - c) * k));
  return (r! << 16) | (g! << 8) | b!;
}

export function mapModel(state: GameState): MapModel {
  return {
    partyColor: PARTY_COLORS[state.party] ?? 0xb08d57,
    districts: NEIGHBOURHOOD_IDS.map((id) => {
      const nb = state.neighbourhoods[id]!;
      return {
        id,
        name: NEIGHBOURHOODS[id].name,
        tint: moodColor(nb.mood),
        mood: nb.mood,
        moodWord: moodWord(nb.mood),
        base: nb.base,
        markers: [...nb.markers],
      };
    }),
  };
}

export const MARKER_LABEL: Record<MapMarker, string> = {
  protest: "Protesto",
  construction: "Obras",
  police: "Policiamento",
  rally: "Festa de rua",
};

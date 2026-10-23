/**
 * Hand-drawn geography of Porto Ferro, in a virtual 1000x700 space.
 * This is presentation data (like art), so it lives with the UI, not the simulation.
 */
export type Point = [number, number];

export interface DistrictShape {
  polygon: Point[];
  /** Where the name label and markers go. */
  center: Point;
}

export const MAP_SIZE = { width: 1000, height: 700 };

export const DISTRICTS: Record<string, DistrictShape> = {
  morro_esperanca: { polygon: [[40, 40], [330, 30], [360, 200], [250, 290], [60, 260]], center: [195, 150] },
  cidade_universitaria: { polygon: [[330, 30], [700, 40], [720, 230], [560, 230], [360, 200]], center: [530, 125] },
  vila_operaria: { polygon: [[60, 260], [250, 290], [330, 420], [280, 610], [40, 630]], center: [170, 450] },
  centro: { polygon: [[250, 290], [360, 200], [560, 230], [600, 400], [480, 500], [330, 420]], center: [440, 340] },
  sao_bento: { polygon: [[560, 230], [720, 230], [900, 260], [880, 420], [740, 460], [600, 400]], center: [745, 335] },
  jardim_atlantico: {
    polygon: [[330, 420], [480, 500], [600, 400], [740, 460], [880, 420], [770, 590], [520, 640], [280, 610]],
    center: [565, 545],
  },
};

/** The Atlantic, along the southern and eastern edge. */
export const SEA: Point[] = [[0, 700], [40, 630], [280, 610], [520, 640], [770, 590], [880, 420], [900, 260], [1000, 230], [1000, 700]];

/** Main avenues, drawn as ink lines between districts. */
export const ROADS: Point[][] = [
  [[195, 150], [300, 250], [440, 340], [565, 545]],
  [[170, 450], [330, 380], [440, 340], [745, 335], [960, 300]],
  [[530, 125], [470, 230], [440, 340]],
];

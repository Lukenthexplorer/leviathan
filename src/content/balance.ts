/**
 * EVERY balance number in the game lives here. Tune the game by editing this
 * file only; simulation code should never contain magic numbers.
 */
export const BALANCE = {
  opinion: {
    min: -100,
    max: 100,
    /**
     * Each week a memory keeps this fraction of its impact.
     * Bad memories fade slower than good ones: trust is lost fast, rebuilt slowly.
     */
    positiveRetention: 0.85,
    negativeRetention: 0.93,
    /** Memories whose remaining impact is below this are forgotten (keeps saves small). */
    forgetBelow: 0.5,
  },

  hidden: {
    integrityStart: 75,
    integrityMin: 0,
    integrityMax: 100,
    expectationsStart: 0,
    expectationsMin: 0,
    expectationsMax: 100,
  },

  relation: {
    min: -100,
    max: 100,
  },

  neighbourhood: {
    moodMin: -100,
    moodMax: 100,
    baseMin: 0,
    baseMax: 100,
  },

  turn: {
    /** How many desk actions the player can take each week. */
    agendaSlots: 3,
  },
} as const;

export type Balance = typeof BALANCE;

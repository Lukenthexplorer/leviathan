/** The game's timeline. Turn 1 is the first session of the new Câmara. */
const START = Date.UTC(1989, 0, 2); // Monday 2 January 1989
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const dateOf = (turn: number) => new Date(START + (turn - 1) * 7 * 86_400_000);

/** "16 Jan 1989" */
export function weekDate(turn: number): string {
  const d = dateOf(turn);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "January 1989", for newspapers looking back. */
export function monthYear(turn: number): string {
  const d = dateOf(turn);
  return `${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

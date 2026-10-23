/** The game's timeline. Turn 1 is the first session of the new Câmara. */
const START = Date.UTC(1989, 0, 2); // Monday 2 January 1989
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MONTHS_LONG = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

const dateOf = (turn: number) => new Date(START + (turn - 1) * 7 * 86_400_000);

/** "16 jan 1989" */
export function weekDate(turn: number): string {
  const d = dateOf(turn);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "janeiro de 1989", for newspapers looking back. */
export function monthYear(turn: number): string {
  const d = dateOf(turn);
  return `${MONTHS_LONG[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}

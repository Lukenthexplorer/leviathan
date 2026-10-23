import type { BookDef } from "../types";

/** The library. Real books, real ideas, in plain words. */
export const BOOKS = {
  machiavelli: {
    title: "The Prince",
    author: "Niccolò Machiavelli",
    year: 1532,
    weeksToRead: 4,
    lesson:
      "Machiavelli wrote that a ruler should be judged by results, not intentions. It is safer to be feared than loved if you cannot be both, " +
      "and a wise prince keeps up the appearance of virtue while being ready to act otherwise. Politics, for him, is the art of keeping power.",
    unlocksText: "New options in meetings: read people's hidden motives and trade favours.",
  },
  keynes: {
    title: "The General Theory of Employment, Interest and Money",
    author: "John Maynard Keynes",
    year: 1936,
    weeksToRead: 6,
    lesson:
      "Keynes argued that in a slump, private spending collapses and unemployment can last for years. Government can fill the gap by spending, " +
      "even on borrowed money, because one person's spending is another's income (the 'multiplier'). The bill comes later.",
    unlocksText: "New law: Public Works Jobs Programme. New argument with community leaders.",
  },
  hayek: {
    title: "The Road to Serfdom",
    author: "Friedrich Hayek",
    year: 1944,
    weeksToRead: 5,
    lesson:
      "Hayek warned that central planning concentrates power and knowledge that no planner can really have. Prices carry information spread " +
      "across millions of people, so markets coordinate better than officials. Every new control, he argued, invites the next one.",
    unlocksText: "New law: Downtown Business Tax Cut. New argument with business donors.",
  },
} as const satisfies Record<string, BookDef>;

export type BookId = keyof typeof BOOKS;
export const BOOK_IDS = Object.keys(BOOKS) as BookId[];

import type { ChapterDefinition } from "../core/chapter";
import { councilmanChapter } from "./councilman/chapter";

/**
 * Every playable chapter, by id. A saved game stores only its chapterId, and
 * the UI looks the rules up here. Adding the Mayor = one new line.
 */
export const CHAPTERS: Record<string, ChapterDefinition> = {
  councilman: councilmanChapter,
};

export function chapterFor(chapterId: string): ChapterDefinition {
  const c = CHAPTERS[chapterId];
  if (!c) throw new Error(`No chapter "${chapterId}"`);
  return c;
}

import { BALANCE } from "../../content/balance";
import { GROUPS, GROUP_IDS, type GroupId } from "../../content/councilman/groups";
import type { Cause, ChapterDecision, Effect } from "../../core/types";

/**
 * The Councilman's desk actions, as typed decisions.
 * Each `resolve*` function reads the decision and returns effects + a cause.
 */

export type PostStyle = "informative" | "populist";

export interface PostDecision extends ChapterDecision {
  kind: "post";
  style: PostStyle;
  /** Which group the post speaks to. */
  group: GroupId;
}

export type CouncilmanDecision = PostDecision;

type Resolved = { effects: Effect[]; cause: Omit<Cause, "turn"> };

const S = BALANCE.social;

export function resolvePost(d: PostDecision): Resolved {
  const group = GROUPS[d.group];
  const topic = group.concerns[0];

  if (d.style === "informative") {
    return {
      cause: { kind: "post", id: `post_informative_${d.group}`, label: `Posted an explainer on ${topic}` },
      effects: [
        { type: "opinion", group: d.group, delta: S.informativeTarget, label: `Explained ${topic} plainly` },
        { type: "flag", key: "posts_informative" },
      ],
    };
  }

  // Populist: big, fast, and it raises what everyone expects of you.
  const others: Effect[] = GROUP_IDS.filter((g) => g !== d.group).map((g) => ({
    type: "opinion",
    group: g,
    delta: S.populistOthers,
    label: "Viral post",
  }));
  return {
    cause: { kind: "post", id: `post_populist_${d.group}`, label: `Promised ${group.name.toLowerCase()} the world on ${topic}` },
    effects: [
      { type: "opinion", group: d.group, delta: S.populistTarget, label: `Promised action on ${topic}` },
      ...others,
      { type: "expectations", delta: S.populistExpectations },
      { type: "flag", key: "posts_populist" },
    ],
  };
}

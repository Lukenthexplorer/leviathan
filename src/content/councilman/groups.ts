import type { GroupDef } from "../types";

export const GROUP_IDS = ["workers", "business", "students", "retirees", "religious", "periphery"] as const;
export type GroupId = (typeof GROUP_IDS)[number];

export const GROUPS = {
  workers: {
    name: "Workers",
    description: "Factory hands, bus drivers and dockers of Porto Ferro. Organised, proud, and tired of promises.",
    concerns: ["jobs", "wages", "transport"],
  },
  business: {
    name: "Business Owners",
    description: "Shopkeepers and the commercial association. They want lower taxes and less paperwork.",
    concerns: ["taxes", "regulation", "safety"],
  },
  students: {
    name: "Students",
    description: "Loud, online and quick to take to the streets. Remember the bus fare protests.",
    concerns: ["education", "transport", "culture"],
  },
  retirees: {
    name: "Retirees",
    description: "They vote every single time, and they read the newspaper. All of it.",
    concerns: ["health", "pensions", "safety"],
  },
  religious: {
    name: "Religious Voters",
    description: "Catholic parishes and fast-growing evangelical churches. Pastors carry a lot of votes.",
    concerns: ["family", "safety", "charity"],
  },
  periphery: {
    name: "Poor Periphery",
    description: "The hillside communities the city forgets until election season.",
    concerns: ["housing", "sanitation", "safety", "transport"],
  },
} as const satisfies Record<GroupId, GroupDef>;

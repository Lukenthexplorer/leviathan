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

  expectations: {
    /** The public tolerates this much unfulfilled promise before turning on you. */
    tolerance: 30,
    /** Each week, every point above tolerance costs this much opinion with every group. */
    disappointmentPerPoint: 0.1,
    /** Promises are slowly forgotten even if never delivered. */
    forgetPerWeek: 1.5,
  },

  investigation: {
    /** Investigation progress per unexposed dossier thread, per week. */
    progressPerThread: 2,
    /** Below this integrity the journalist smells something, even without threads. */
    suspicionIntegrity: 50,
    progressPerSuspicionPoint: 0.1,
    /** Hostile journalist digs faster: +1% speed per point of negative relation. */
    hostilityMultiplierPerPoint: 0.01,
    /** Progress needed to publish an exposé. */
    exposeAt: 100,
    /** Scandal damage per thread of the exposed entry. */
    scandalOpinionPerThread: -6,
    scandalBossRelationPerThread: -5,
    /** Confessing exposes everything at once, but the public is more forgiving. */
    confessionDamageFactor: 0.5,
    confessionIntegrity: 10,
  },

  /** Media appearances (radio, TV, blog, social media... the channel depends on the era). */
  media: {
    informativeTarget: 4,
    populistTarget: 10,
    populistOthers: 3,
    populistExpectations: 8,
    maxPerWeek: 1,
  },

  /** Political capital: the currency of getting laws through the Câmara. */
  capital: {
    start: 6,
    max: 20,
    /** Weekly income: the mandate itself... */
    weeklyBase: 1,
    /** ...plus this per group that supports you (opinion >= supportThreshold), rounded down to whole points... */
    perSupportingGroup: 0.5,
    supportThreshold: 20,
    /** ...plus this if the party boss trusts you (relation >= bossTrustAt). */
    bossTrustBonus: 1,
    bossTrustAt: 30,
    /** A passed law adds prestige; a defeat in plenary burns your name. */
    lawPassedPrestige: 2,
    lawRejectedLoss: -2,
  },

  laws: {
    /** A bill passes when its vote score reaches this. */
    passThreshold: 50,
    favouredTopicBonus: 6,
    opposedTopicPenalty: -12,
    /** Each point of party boss relation adds this many votes. */
    bossRelationWeight: 0.15,
    /** Lobbying ("articular"): each level costs capital and buys votes in the corridors. */
    lobbyCostPerLevel: 3,
    lobbyVotesPerLevel: 8,
    maxLobbyLevel: 2,
    /** Per "council_favours" flag (corridor deals). */
    councilFavourBonus: 8,
    rivalAllyBonus: 5,
    /** Vote happens this many Next-week presses after proposing (1 = at the end of this week). */
    weeksToVote: 1,
    /** Party boss reaction when you propose a bill on a topic they like / dislike. */
    bossFavouredReaction: 3,
    bossOpposedReaction: -8,
  },

  meetings: {
    /** Repeat small talk within this many weeks counts as "again?". */
    repeatWindowWeeks: 3,
    /** Each repeat in a row multiplies the relation gain by this (0.5 = halves it). */
    repeatDecay: 0.5,
  },

  fundraising: {
    /** A small-donor drive ("vaquinha"): base amount plus a share of your total roots across neighbourhoods. */
    base: 2,
    perRootPoint: 0.03,
  },

  neighbourhoodWork: {
    baseGain: 8,
    moodGain: 3,
    /** Opinion gain for resident groups, scaled by their share of the neighbourhood. */
    residentOpinion: 8,
    /** Each point of existing base adds this fraction to resident opinion gain (roots compound). */
    baseCompounding: 0.01,
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

  councilman: {
    startingFunds: 5,
    /** The party convention picks its mayoral candidate in this week (~9 months in). */
    conventionWeek: 40,
    /** The party only hears candidacies from this week on: the corrupt sprint has to survive until here. */
    nominationOpensWeek: 26,
    /** A warning lands on the desk this many weeks before the convention. */
    conventionWarningWeeks: 4,
    /** Goal 1: the party boss must trust you (relation >= this, "Confiança"). */
    nominationRelation: 50,
    /** Goal 2: campaign money, in thousands. */
    fundsNeeded: 60,
    /** Goal 3: this many groups must have at least this opinion of you. */
    groupsNeeded: 3,
    groupSupportThreshold: 20,
    /** Game over when total exposed dossier threads reach this. */
    arrestAtExposedThreads: 8,
    /** Game over when the party boss's relation drops to this. */
    expelledAtBossRelation: -60,
    /** Game over when the average group opinion drops to this. */
    lostSupportAtAverageOpinion: -40,
  },
} as const;

export type Balance = typeof BALANCE;

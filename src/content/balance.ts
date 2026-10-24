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

  /** At or below this hidden integrity, Teixeira starts bringing "small opportunities". */
  corruptOfferIntegrity: 55,

  meetings: {
    /** Repeat small talk within this many weeks counts as "again?". */
    repeatWindowWeeks: 3,
    /** Each repeat in a row multiplies the relation gain by this (0.5 = halves it). */
    repeatDecay: 0.5,
  },

  /** Neighbourhood projects ("Ajuda do gabinete"). */
  projects: {
    /** A neighbourhood can only receive one project every this many weeks. */
    cooldownWeeks: 6,
    /** Each project raises expectations: "o vereador resolve tudo". */
    expectationsPerProject: 3,
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
    /** Game over when total exposed dossier threads reach this. */
    arrestAtExposedThreads: 8,
    /** Game over when the party boss's relation drops to this. */
    expelledAtBossRelation: -60,
    /** Game over when the average group opinion drops to this. */
    lostSupportAtAverageOpinion: -40,
  },

  /** End of term: which race the player can run. */
  paths: {
    /** Mayor: the party's nomination. */
    mayorBossRelation: 40,
    /** State deputy: the party puts you on its slate. */
    deputyBossRelation: 20,
    /** Re-election is always open; this many of the party's council candidates get a seat. */
    councilSeatsForParty: 2,
    /** A group "is with you" at this opinion (used in words on the Caminhos card). */
    groupSupportThreshold: 20,
    /** Backing Renata: she gives you the council presidency (capital) and her endorsement. */
    kingmakerCapital: 5,
  },

  /** The vote model (chapters/councilman/election.ts). */
  election: {
    /** Player strength before anything else: a councillor is not a nobody. */
    playerBase: 22,
    /** Per point of resident-weighted group opinion (-100..100). */
    opinionWeight: 0.35,
    /** Per point of roots in the neighbourhood (0..100). */
    baseWeight: 0.25,
    /** Per point of campaign presence. */
    presenceWeight: 0.45,
    /** An endorser where their word counts. */
    endorsementBonus: 12,
    /** Per exposed dossier thread, everywhere. */
    scandalPerThread: 2.5,
    /** Per point of expectations above tolerance, everywhere. */
    brokenPromisePerPoint: 0.25,
    /** Interior regions (deputy race): the player is a stranger there. */
    regionBase: 30,
    /** Per point of the party's standing with the region's groups. */
    partyRegionWeight: 0.6,
    /** Per point of mentor relation: Otávio's friends in the interior. */
    mentorRegionWeight: 0.15,
    /** Opponents grow from the player's weaknesses. */
    opponentBrokenPromiseWeight: 0.35,
    opponentDislikeWeight: 0.35,
    /** Unknown units: an opponent's default strength. */
    opponentDefault: 20,
    /** The bigger the office, the stronger the machines you face. */
    opponentBonus: { council: 0, mayor: 30, deputy: 4 },
    /** share = score^k / sum(score^k): k > 1 rewards the stronger candidate. */
    shareExponent: 2,
    /** Scores are floored here, so nobody ever gets a negative or NaN share. */
    minScore: 2,
    /** Blank and spoiled ballots: a base share, more where the neighbourhood is angry. */
    nullBase: 0.06,
    nullVotesPerMoodPoint: 0.002,
    nullMax: 0.3,
    /** Each unit's urns are counted in batches of these sizes (sum = 1). */
    batchFractions: [0.3, 0.25, 0.25, 0.2],
    /** Under this margin (points), the race is "close": the TV slows down and the radio narrator gets busier. */
    closeRaceMargin: 3,
    /** The election-night radio narrator: when each kind of line is tried (broadcast.ts). */
    narration: {
      /** "Urnas chegando" at most every this many batches, by race. A close race talks like the mayor's. */
      ballotsEvery: { council: 6, deputy: 4, mayor: 3 },
      /** A batch that cuts the leader's margin by more than this (points) without flipping it: outraged. */
      outragedSwing: 3,
      /** ...or a batch where the player does this many points worse than their running share: outraged too. */
      outragedPlayerDrop: 12,
      /** The leader's margin (points) that counts as a landslide, once past this % of the count. Never in a council race. */
      landslideMargin: 15,
      landslideAfterPct: 50,
      /** Seconds of silence after "última urna!" before the last batch is revealed. */
      lastBallotPause: 1.5,
    },
    /** Seats: re-election needs a top-N finish among the party's candidates; deputy, among the slate. */
    councilSeats: 2,
    deputySeats: 2,
    /** Mayor: below this share of valid votes, the top two go to a second round. */
    runoffBelow: 0.5,
  },

  /** The campaign: weeks 33-40. */
  campaign: {
    warningWeek: 28,
    decisionWeek: 32,
    startWeek: 33,
    /** Election day is at the end of this week. */
    endWeek: 40,
    rallyCost: 8,
    /** Rallies at a renovated community centre are cheaper (the hall is yours). */
    rallyCostAtCentre: 4,
    rallyPresence: 12,
    /** Below these roots, nobody comes to the square. */
    rallyMinBase: 15,
    emptyRallyPresence: 2,
    soundTruckCost: 3,
    soundTruckPresence: 5,
    soundTruckExpectations: 3,
    cabosCost: 6,
    /** Paid in cash, no receipt: cheaper, and a thread in the dossier. */
    cabosCashCost: 4,
    cabosWeeklyPresence: 3,
    paidMediaCost: 5,
    /** Presence a media appearance adds where the targeted group lives (x2 if paid). */
    mediaPresence: 4,
    interiorTripCost: 10,
    interiorTripPresence: 15,
    /** Time away: every Porto Ferro neighbourhood loses this much presence. */
    interiorTripHomeLoss: 2,
    /** Each week, presence fades by this fraction (people forget rallies). */
    presenceDecay: 0.05,
    /** Each week an attack stays open or ignored, it costs this much presence in its units. */
    attackPressure: 3,
    factsPresence: 4,
    counterOpponentHit: 6,
    counterBacklash: -3,
    endorsementCapital: 2,
    endorsementExpectations: 6,
    endorsementPresence: 10,
    recordAdPresence: 6,
    /** If spending exceeds clean income by this ratio during the campaign, the press notices. */
    spendSuspicionRatio: 1.5,
    spendSuspicionInvestigation: 10,
    voteBuyingCost: 25,
    voteBuyingPresence: 30,
  },
} as const;

export type Balance = typeof BALANCE;

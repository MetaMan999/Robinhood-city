export type CivicPolicyId = "jobs-first" | "transit-flow" | "local-enterprise";

export type CivicState = {
  isMayor: boolean;
  campaigns: number;
  electionWins: number;
  approval: number;
  activePolicyId: CivicPolicyId | null;
  termStartedDay: number | null;
};

export const MAYOR_REQUIREMENTS = {
  reputation: 60,
  jobsCompleted: 8,
  assetsOwned: 2,
  clockIns: 3,
} as const;

export const CIVIC_POLICIES: Array<{
  id: CivicPolicyId;
  code: string;
  name: string;
  effect: string;
  cost: number;
}> = [
  {
    id: "jobs-first",
    code: "ORD-01",
    name: "Jobs First",
    effect: "Adds an 8% city-policy bonus to completed work.",
    cost: 30,
  },
  {
    id: "transit-flow",
    code: "ORD-02",
    name: "Transit Flow",
    effect: "Reduces congestion and raises functional vehicle value.",
    cost: 30,
  },
  {
    id: "local-enterprise",
    code: "ORD-03",
    name: "Local Enterprise",
    effect: "Raises commercial demand and productive business value.",
    cost: 30,
  },
];

export function civicTitle(reputation: number, isMayor: boolean) {
  if (isMayor) return "MAYOR";
  if (reputation >= 60) return "MAYORAL CANDIDATE";
  if (reputation >= 40) return "CITY COUNCIL";
  if (reputation >= 20) return "CIVIC LEADER";
  if (reputation >= 8) return "CONTRIBUTOR";
  return "RESIDENT";
}

export function mayorReadiness(input: {
  reputation: number;
  jobsCompleted: number;
  assetsOwned: number;
  clockIns: number;
}) {
  const checks = [
    input.reputation >= MAYOR_REQUIREMENTS.reputation,
    input.jobsCompleted >= MAYOR_REQUIREMENTS.jobsCompleted,
    input.assetsOwned >= MAYOR_REQUIREMENTS.assetsOwned,
    input.clockIns >= MAYOR_REQUIREMENTS.clockIns,
  ];
  return {
    eligible: checks.every(Boolean),
    completed: checks.filter(Boolean).length,
    total: checks.length,
    score: Math.round(
      input.reputation * 1.2 +
        input.jobsCompleted * 4 +
        input.assetsOwned * 10 +
        input.clockIns * 5,
    ),
  };
}

export const MARKET_FEE_BPS = 250;
export const RESERVE_SHARE_BPS = 6000;
export const COOPERATIVE_SHARE_BPS = 2000;
export const CITY_OPERATIONS_SHARE_BPS = 2000;
export const CLOCK_IN_WINDOW_MINUTES = 180;
export const CLOCK_IN_COOLDOWN_MINUTES = 240;

export type ValueBridgeState = {
  vaultSerial: string;
  clockIns: number;
  clockInStreak: number;
  nextClockInMinute: number;
  clockedInUntilMinute: number;
  workUnits: number;
  outputUnits: number;
  marketFeesGenerated: number;
  simulatedReserve: number;
  cooperativePool: number;
  cityOperationsPool: number;
  distributionsReceived: number;
  settlementLog: string[];
};

export type TradeQuote = {
  principal: number;
  fee: number;
  total: number;
  reserve: number;
  cooperative: number;
  cityOperations: number;
};

export type ValueReadinessStage = {
  id: string;
  label: string;
  status: "LIVE" | "REQUIRED";
  detail: string;
};

export const VALUE_READINESS: ValueReadinessStage[] = [
  {
    id: "productive-loop",
    label: "Productive game loop",
    status: "LIVE",
    detail: "Jobs create output, wages, reputation, and player progression.",
  },
  {
    id: "fee-ledger",
    label: "Transparent fee ledger",
    status: "LIVE",
    detail: "Every simulated asset trade reports principal, fees, and reserve routing.",
  },
  {
    id: "signed-identity",
    label: "Signed player identity",
    status: "REQUIRED",
    detail: "Wallet signatures and server-side ownership checks must replace local identity.",
  },
  {
    id: "audited-reserve",
    label: "Audited external reserve",
    status: "REQUIRED",
    detail: "Real redemptions need verifiable funds, custody, controls, and public accounting.",
  },
  {
    id: "compliant-settlement",
    label: "Compliant settlement",
    status: "REQUIRED",
    detail: "Legal, tax, sanctions, securities, payments, and jurisdiction reviews are required.",
  },
];

export function makeVaultSerial(seed: number) {
  return `RHO-VLT-${Math.max(1, seed).toString(36).toUpperCase().padStart(6, "0")}`;
}

export function quoteTrade(principal: number): TradeQuote {
  const safePrincipal = Math.max(0, Math.round(principal));
  const fee = Math.max(1, Math.round((safePrincipal * MARKET_FEE_BPS) / 10_000));
  const reserve = Math.round((fee * RESERVE_SHARE_BPS) / 10_000);
  const cooperative = Math.round((fee * COOPERATIVE_SHARE_BPS) / 10_000);
  const cityOperations = Math.max(0, fee - reserve - cooperative);
  return {
    principal: safePrincipal,
    fee,
    total: safePrincipal + fee,
    reserve,
    cooperative,
    cityOperations,
  };
}

export function productivePower(input: {
  workUnits: number;
  outputUnits: number;
  assets: number;
  reputation: number;
  clockInStreak: number;
}) {
  return Math.round(
    input.workUnits * 1.2 +
      input.outputUnits * 0.8 +
      input.assets * 45 +
      input.reputation * 3 +
      input.clockInStreak * 12,
  );
}

export function valueBridgeScore(state: ValueBridgeState) {
  const liveStages = VALUE_READINESS.filter((stage) => stage.status === "LIVE").length;
  const activity = Math.min(
    20,
    Math.floor(
      (state.workUnits + state.outputUnits + state.marketFeesGenerated + state.clockIns * 10) /
        100,
    ),
  );
  return Math.min(40, liveStages * 10 + activity);
}

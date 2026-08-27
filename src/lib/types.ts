export type StepId =
  | "setup"
  | "connect"
  | "rules"
  | "strategy"
  | "desk"
  | "ticket"
  | "active"
  | "journal";

export type Phase = "challenge" | "verification" | "funded";

export type VerdictKind = "approved" | "waitlist" | "no_trade";

/** Platform is required — no "none" once desk is live. */
export type ConnectionMode = "ctrader" | "mt5";

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export interface PlatformLink {
  mode: ConnectionMode;
  status: ConnectionStatus;
  /** Broker account id from API */
  externalAccountId: string | null;
  environment: "demo" | "live";
  /** What the link can do */
  capabilities: {
    readBalance: boolean;
    readPositions: boolean;
    readHistory: boolean;
    placeOrders: boolean;
  };
  linkedChallengeId: string | null;
  lastHealthAt: string | null;
  healthNote: string | null;
}

export interface StrategyPack {
  id: string;
  name: string;
  source: "template" | "custom";
  thesis: string;
  sessions: string[];
  symbols: string[];
  indicators: { id: string; label: string; role: string }[];
  prechecks: { id: string; label: string; hard: boolean }[];
  riskCapPct: number | null;
}

export type TradeResult = "planned" | "win" | "loss" | "be" | "skipped";

export interface RulePreset {
  id: string;
  label: string;
  firm: string;
  program: string;
  profitTargetChallengePct: number | null;
  profitTargetVerificationPct: number | null;
  maxDailyLossPct: number | null;
  maxLossPct: number | null;
  maxLossStyle: "static" | "eod_trailing" | null;
  minTradingDays: number | null;
  overnightHold: boolean;
  weekendHold: boolean;
  newsRestricted: boolean;
  bestDayRulePct: number | null;
  allowedInstruments: string[];
  maxRiskPerTradePct: number;
  notes: string[];
}

export interface Challenge {
  id: string;
  presetId: string;
  firm: string;
  label: string;
  accountSize: number;
  phase: Phase;
  /** Free-form program: 1-step, 2-step, instant, etc. */
  programLabel: string;
  startingBalance: number;
  maxDailyLossPct: number;
  maxLossPct: number;
  profitTargetPct: number;
  minTradingDays: number | null;
  consistencyPct: number | null;
  overnightHold: boolean;
  weekendHold: boolean;
  newsRestricted: boolean;
  allowedInstruments: string[];
  maxRiskPerTradePct: number;
  customNotes: string;
  rulesUrl: string | null;
  rulesSource: "url" | "paste" | "name_heuristic" | "defaults";
  createdAt: string;
}

export interface Governance {
  humanConfirmRequired: boolean;
  autoLiveDisabled: boolean;
  midfleetRequired: boolean;
  maxRiskOverridePct: number | null;
  blockOnNews: boolean;
  blockOnDailyBufferBelowR: number;
  paperOnly: boolean;
}

export interface Compliance {
  equity: number;
  totalPnl: number;
  todayPnl: number;
  profitTargetUsd: number;
  profitProgressPct: number;
  maxDailyLossUsd: number;
  dailyLossLeftUsd: number;
  maxLossFloorUsd: number;
  distanceToFloorUsd: number;
  riskBudgetUsd: number;
  tradingDays: number;
  minTradingDays: number | null;
  consistencyOk: boolean;
  bestDayPctOfProfit: number | null;
  status: "clear" | "caution" | "blocked";
  statusReason: string;
}

export interface VerdictCard {
  id: string;
  kind: VerdictKind;
  symbol: string;
  side: "long" | "short";
  entry: number;
  stop: number;
  target: number;
  riskPct: number;
  riskUsd: number;
  rr: number;
  thesis: string;
  checks: { id: string; label: string; pass: boolean; detail?: string }[];
  midfleetRunId: string;
  createdAt: string;
}

export interface Ticket extends VerdictCard {
  status: "open" | "logged" | "dismissed";
}

export interface LoggedTrade {
  id: string;
  symbol: string;
  side: "long" | "short";
  entry: number;
  stop: number;
  target: number;
  riskPct: number;
  riskUsd: number;
  result: TradeResult;
  pnlR: number;
  pnlUsd: number;
  loggedAt: string;
  midfleetRunId: string;
  note: string;
}

/** Live / open position from platform API (cTrader / MT5) + Concierge rationale. */
export interface ActivePosition {
  id: string;
  platformId: string;
  platform: "ctrader" | "mt5" | "manual";
  symbol: string;
  side: "long" | "short";
  volume: number;
  entry: number;
  current: number;
  stop: number | null;
  target: number | null;
  unrealizedPnlUsd: number;
  unrealizedPnlR: number;
  riskUsd: number;
  /** Distance in price to stop / target */
  toStopPct: number | null;
  toTargetPct: number | null;
  mfeUsd: number;
  maeUsd: number;
  openedAt: string;
  lastSyncAt: string;
  midfleetRunId: string | null;
  /** Concierge note: why this trade was taken */
  conciergeWhy: string;
  playbookTag: string | null;
  status: "open" | "closing";
}

export interface ChatMessage {
  id: string;
  role: "user" | "agent" | "system";
  text: string;
  verdictId?: string;
  at: string;
}

export interface MidfleetRun {
  id: string;
  kind:
    | "prop_scan"
    | "prop_size"
    | "prop_why_blocked"
    | "prop_ingest"
    | "prop_rules_ingest"
    | "prop_positions_sync"
    | "prop_consult";
  status: "queued" | "running" | "completed" | "blocked";
  inputSummary: string;
  outputSummary: string;
  startedAt: string;
  finishedAt?: string;
}

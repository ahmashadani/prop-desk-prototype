import { DEFAULT_GOVERNANCE, STRATEGY_TEMPLATES } from "./presets";
import type {
  ActivePosition,
  Challenge,
  ChatMessage,
  Governance,
  LoggedTrade,
  MidfleetRun,
  PlatformLink,
  StrategyPack,
  VerdictCard,
} from "./types";

const now = () => new Date().toISOString();
const minsAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
const daysAgo = (d: number) => new Date(Date.now() - d * 86400_000).toISOString();

export interface MockSeed {
  challenge: Challenge;
  platform: PlatformLink;
  strategy: StrategyPack;
  governance: Governance;
  newsBlocked: boolean;
  messages: ChatMessage[];
  verdicts: VerdictCard[];
  activePositions: ActivePosition[];
  trades: LoggedTrade[];
  runs: MidfleetRun[];
  ingestSummary: string[];
  ingestConfidence: "high" | "medium" | "low";
  lastPositionsSyncNote: string;
}

/** Fully configured desk for stakeholder walkthrough. */
export function buildMockSeed(): MockSeed {
  const challenge: Challenge = {
    id: "ch_demo_ft50",
    presetId: "concierge_ingest",
    firm: "FundingTraders",
    label: "FT Pro10 50k · Phase 1",
    accountSize: 50000,
    phase: "challenge",
    programLabel: "2-step challenge",
    startingBalance: 50000,
    maxDailyLossPct: 5,
    maxLossPct: 10,
    profitTargetPct: 10,
    minTradingDays: 4,
    consistencyPct: null,
    overnightHold: true,
    weekendHold: true,
    newsRestricted: true,
    allowedInstruments: ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "NAS100", "US30"],
    maxRiskPerTradePct: 0.5,
    customNotes: "Rules URL: https://fundingtraders.com/rules",
    rulesUrl: "https://fundingtraders.com/rules",
    rulesSource: "url",
    createdAt: daysAgo(6),
  };

  const platform: PlatformLink = {
    mode: "ctrader",
    status: "connected",
    externalAccountId: "CT-DEMO-48291",
    environment: "demo",
    capabilities: {
      readBalance: true,
      readPositions: true,
      readHistory: true,
      placeOrders: false,
    },
    linkedChallengeId: challenge.id,
    lastHealthAt: minsAgo(2),
    healthNote: "cTrader Open API · token OK · positions stream ready",
  };

  const tpl = STRATEGY_TEMPLATES[0];
  const strategy: StrategyPack = {
    id: "st_demo_london",
    name: tpl.name,
    source: "template",
    thesis: tpl.thesis,
    sessions: [...tpl.sessions],
    symbols: [...tpl.symbols],
    indicators: tpl.indicators.map((i) => ({ ...i })),
    prechecks: tpl.prechecks.map((p) => ({ ...p })),
    riskCapPct: tpl.riskCapPct,
  };

  const governance: Governance = {
    ...DEFAULT_GOVERNANCE,
    blockOnNews: true,
    humanConfirmRequired: true,
    autoLiveDisabled: true,
    midfleetRequired: true,
    paperOnly: true,
  };

  const verdicts: VerdictCard[] = [
    {
      id: "v_demo_1",
      kind: "approved",
      symbol: "EURUSD",
      side: "long",
      entry: 1.0842,
      stop: 1.0812,
      target: 1.0902,
      riskPct: 0.4,
      riskUsd: 200,
      rr: 2,
      thesis:
        "London breakout: clean Asia range break, session window OK, R:R 1:2, news clear. Fits FT walls.",
      checks: [
        { id: "daily", label: "Daily loss buffer", pass: true, detail: "Left 2280" },
        { id: "dd", label: "Max DD floor", pass: true, detail: "Cushion 4820" },
        { id: "risk", label: "Risk ≤ caps", pass: true, detail: "0.4%" },
        { id: "session", label: "Strategy: Inside London window", pass: true },
        { id: "rr", label: "Strategy: R:R ≥ 1:2", pass: true },
        { id: "human", label: "Human confirm", pass: true },
      ],
      midfleetRunId: "mfr_scan_demo1",
      createdAt: minsAgo(45),
    },
  ];

  const activePositions: ActivePosition[] = [
    {
      id: "pos_demo_eu",
      platformId: "CT-11042",
      platform: "ctrader",
      symbol: "EURUSD",
      side: "long",
      volume: 0.4,
      entry: 1.0842,
      current: 1.0851,
      stop: 1.0812,
      target: 1.0902,
      unrealizedPnlUsd: 72,
      unrealizedPnlR: 0.36,
      riskUsd: 200,
      toStopPct: 0.7,
      toTargetPct: 0.18,
      mfeUsd: 95,
      maeUsd: -28,
      openedAt: minsAgo(42),
      lastSyncAt: minsAgo(1),
      midfleetRunId: "mfr_scan_demo1",
      conciergeWhy:
        "London ORB long after Asia range break. Firm daily/DD OK. Prechecks: session, range, R:R, news all pass. Risk 0.4% ($200).",
      playbookTag: "london_orb",
      status: "open",
    },
    {
      id: "pos_demo_xau",
      platformId: "CT-11088",
      platform: "ctrader",
      symbol: "XAUUSD",
      side: "long",
      volume: 0.05,
      entry: 2641.2,
      current: 2638.4,
      stop: 2636.0,
      target: 2652.0,
      unrealizedPnlUsd: -48,
      unrealizedPnlR: -0.24,
      riskUsd: 200,
      toStopPct: 0.35,
      toTargetPct: 0.12,
      mfeUsd: 40,
      maeUsd: -62,
      openedAt: hoursAgo(3),
      lastSyncAt: minsAgo(1),
      midfleetRunId: null,
      conciergeWhy:
        "Ingested from cTrader — no desk ticket. Tagged discretionary gold long. Watching vs daily wall; not London-ORB pack default.",
      playbookTag: "platform-ingest",
      status: "open",
    },
  ];

  const trades: LoggedTrade[] = [
    {
      id: "t_demo_1",
      symbol: "GBPUSD",
      side: "long",
      entry: 1.261,
      stop: 1.258,
      target: 1.267,
      riskPct: 0.4,
      riskUsd: 200,
      result: "win",
      pnlR: 1.8,
      pnlUsd: 360,
      loggedAt: daysAgo(1),
      midfleetRunId: "mfr_old_1",
      note: "London ORB — Asia range break, held to 1.8R partial.",
    },
    {
      id: "t_demo_2",
      symbol: "EURUSD",
      side: "long",
      entry: 1.079,
      stop: 1.0765,
      target: 1.084,
      riskPct: 0.4,
      riskUsd: 200,
      result: "loss",
      pnlR: -1,
      pnlUsd: -200,
      loggedAt: daysAgo(2),
      midfleetRunId: "mfr_old_2",
      note: "False break — stopped. Session OK but range was messy.",
    },
    {
      id: "t_demo_3",
      symbol: "USDJPY",
      side: "short",
      entry: 149.4,
      stop: 149.7,
      target: 148.8,
      riskPct: 0.35,
      riskUsd: 175,
      result: "win",
      pnlR: 1.2,
      pnlUsd: 210,
      loggedAt: daysAgo(3),
      midfleetRunId: "mfr_old_3",
      note: "London continuation short after failed NY push.",
    },
    {
      id: "t_demo_4",
      symbol: "EURUSD",
      side: "long",
      entry: 1.072,
      stop: 1.0695,
      target: 1.077,
      riskPct: 0.4,
      riskUsd: 200,
      result: "be",
      pnlR: 0,
      pnlUsd: 0,
      loggedAt: daysAgo(4),
      midfleetRunId: "mfr_old_4",
      note: "Scratched at BE into US data.",
    },
  ];

  const messages: ChatMessage[] = [
    {
      id: "m_sys_1",
      role: "system",
      text: "Demo desk loaded. Challenge + cTrader CT-DEMO-48291 + London breakout are linked. Concierge has full context.",
      at: minsAgo(50),
    },
    {
      id: "m_user_1",
      role: "user",
      text: "Market climate now",
      at: minsAgo(48),
    },
    {
      id: "m_agent_1",
      role: "agent",
      text: [
        "Market climate (desk read)",
        "• Session focus: London",
        "• News window: Clear",
        "• Challenge status: CLEAR — room on daily and DD",
        "• Skew: Favour EURUSD / GBPUSD per London breakout pack",
        "Ask “Find a trade” for a prop-safe ticket inside your pack.",
      ].join("\n"),
      at: minsAgo(47),
    },
    {
      id: "m_user_2",
      role: "user",
      text: "Find a trade for me",
      at: minsAgo(46),
    },
    {
      id: "m_agent_2",
      role: "agent",
      text: "Climate + London breakout + FundingTraders walls + cTrader CT-DEMO-48291.\nVerdict: APPROVED EURUSD. You confirm — nothing auto-sends live.",
      verdictId: "v_demo_1",
      at: minsAgo(45),
    },
    {
      id: "m_user_3",
      role: "user",
      text: "How are my open trades?",
      at: minsAgo(5),
    },
    {
      id: "m_agent_3",
      role: "agent",
      text: [
        "Active on ctrader (CT-DEMO-48291)",
        "• EURUSD long +0.36R (+$72)",
        "  Why: London ORB long after Asia range break…",
        "• XAUUSD long −0.24R (−$48)",
        "  Why: Ingested from cTrader — discretionary gold, not pack default.",
        "EURUSD is on-plan. Gold is off-playbook — decide hold vs flatten vs daily wall.",
      ].join("\n"),
      at: minsAgo(4),
    },
  ];

  const runs: MidfleetRun[] = [
    {
      id: "mfr_rules_demo",
      kind: "prop_rules_ingest",
      status: "completed",
      inputSummary: "FT Pro10 50k rules URL",
      outputSummary: "Rules pack · confidence high · daily 5% DD 10%",
      startedAt: daysAgo(6),
      finishedAt: daysAgo(6),
    },
    {
      id: "mfr_scan_demo1",
      kind: "prop_scan",
      status: "completed",
      inputSummary: "Find a trade for me",
      outputSummary: "APPROVED EURUSD · London breakout",
      startedAt: minsAgo(46),
      finishedAt: minsAgo(45),
    },
    {
      id: "mfr_consult_demo",
      kind: "prop_consult",
      status: "completed",
      inputSummary: "How are my open trades?",
      outputSummary: "2 opens · EURUSD +0.36R · XAU −0.24R",
      startedAt: minsAgo(5),
      finishedAt: minsAgo(4),
    },
    {
      id: "mfr_sync_demo",
      kind: "prop_positions_sync",
      status: "completed",
      inputSummary: "Sync ctrader",
      outputSummary: "Synced 2 open position(s) via cTrader Open API (CT-DEMO-48291).",
      startedAt: minsAgo(2),
      finishedAt: minsAgo(2),
    },
  ];

  return {
    challenge,
    platform,
    strategy,
    governance,
    newsBlocked: false,
    messages,
    verdicts,
    activePositions,
    trades,
    runs,
    ingestSummary: [
      `Named “${challenge.label}” · FundingTraders · $50,000 · 2-step challenge`,
      "Walls: daily 5% · max DD 10% · target 10% · risk/idea 0.5%",
      "News restriction ON → governance blocks new risk in news windows",
      "Concierge read rules from URL (demo seed)",
    ],
    ingestConfidence: "high",
    lastPositionsSyncNote:
      "Synced 2 open position(s) via cTrader Open API (CT-DEMO-48291).",
  };
}

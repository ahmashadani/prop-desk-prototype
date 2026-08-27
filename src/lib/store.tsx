"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { computeCompliance } from "./compliance";
import { runMidfleetPropAgent } from "./midfleet";
import {
  positionFromTicket,
  syncPlatformPositions,
  tickPosition,
} from "./platformPositions";
import { connectPlatform, disconnectedLink } from "./platformLink";
import { buildMockSeed } from "./mockSeed";
import { runConciergeRulesIngest, type IntakeDraft } from "./rulesIngest";
import { DEFAULT_GOVERNANCE, STRATEGY_TEMPLATES } from "./presets";
import type {
  ActivePosition,
  Challenge,
  ChatMessage,
  ConnectionMode,
  Governance,
  LoggedTrade,
  MidfleetRun,
  PlatformLink,
  StepId,
  StrategyPack,
  Ticket,
  TradeResult,
  VerdictCard,
} from "./types";

interface Store {
  step: StepId;
  setStep: (s: StepId) => void;
  draft: IntakeDraft;
  setDraft: (p: Partial<IntakeDraft>) => void;
  challenge: Challenge | null;
  platform: PlatformLink;
  connectBusy: boolean;
  connectToPlatform: (mode: ConnectionMode) => Promise<void>;
  strategy: StrategyPack | null;
  setStrategyFromTemplate: (templateId: string) => void;
  setStrategyCustom: (thesis: string, name?: string) => void;
  governance: Governance;
  setGovernance: (p: Partial<Governance>) => void;
  newsBlocked: boolean;
  setNewsBlocked: (v: boolean) => void;
  messages: ChatMessage[];
  verdicts: VerdictCard[];
  activeTicket: Ticket | null;
  activePositions: ActivePosition[];
  trades: LoggedTrade[];
  runs: MidfleetRun[];
  agentBusy: boolean;
  setupBusy: boolean;
  positionsSyncing: boolean;
  lastPositionsSyncNote: string | null;
  ingestSummary: string[];
  ingestConfidence: "high" | "medium" | "low" | null;
  compliance: ReturnType<typeof computeCompliance> | null;
  configured: boolean;
  isDemo: boolean;
  completeSetup: () => Promise<void>;
  patchChallenge: (p: Partial<Challenge>) => void;
  saveRulesAndContinue: () => void;
  saveStrategyAndOpenDesk: () => void;
  sendAgent: (text: string) => Promise<void>;
  openTicket: (verdictId: string) => void;
  dismissTicket: () => void;
  openPositionFromTicket: () => void;
  logTrade: (result: TradeResult, note?: string) => void;
  syncPositions: () => Promise<void>;
  tickOpenMarks: () => void;
  updatePositionWhy: (id: string, why: string) => void;
  closePosition: (id: string, result: "win" | "loss" | "be") => void;
  ingestManualTrade: (input: {
    symbol: string;
    side: "long" | "short";
    pnlR: number;
    note: string;
  }) => void;
  loadDemo: () => void;
  resetAll: () => void;
  unlocked: Record<StepId, boolean>;
}

const Ctx = createContext<Store | null>(null);

function uid(p: string) {
  return `${p}_${Math.random().toString(36).slice(2, 9)}`;
}

const initialDraft: IntakeDraft = {
  challengeName: "",
  firmName: "",
  accountSize: 50000,
  programLabel: "2-step challenge",
  rulesUrl: "",
  rulesPaste: "",
};

function applySeed(
  seed: ReturnType<typeof buildMockSeed>,
  setters: {
    setStep: (s: StepId) => void;
    setChallenge: (c: Challenge | null) => void;
    setPlatform: (p: PlatformLink) => void;
    setStrategy: (s: StrategyPack | null) => void;
    setGovState: (g: Governance) => void;
    setNewsBlocked: (v: boolean) => void;
    setMessages: (m: ChatMessage[]) => void;
    setVerdicts: (v: VerdictCard[]) => void;
    setActiveTicket: (t: Ticket | null) => void;
    setActivePositions: (p: ActivePosition[]) => void;
    setTrades: (t: LoggedTrade[]) => void;
    setRuns: (r: MidfleetRun[]) => void;
    setIngestSummary: (s: string[]) => void;
    setIngestConfidence: (c: "high" | "medium" | "low" | null) => void;
    setLastPositionsSyncNote: (n: string | null) => void;
    setIsDemo: (v: boolean) => void;
  }
) {
  setters.setChallenge(seed.challenge);
  setters.setPlatform(seed.platform);
  setters.setStrategy(seed.strategy);
  setters.setGovState(seed.governance);
  setters.setNewsBlocked(seed.newsBlocked);
  setters.setMessages(seed.messages);
  setters.setVerdicts(seed.verdicts);
  setters.setActiveTicket({ ...seed.verdicts[0], status: "open" });
  setters.setActivePositions(seed.activePositions);
  setters.setTrades(seed.trades);
  setters.setRuns(seed.runs);
  setters.setIngestSummary(seed.ingestSummary);
  setters.setIngestConfidence(seed.ingestConfidence);
  setters.setLastPositionsSyncNote(seed.lastPositionsSyncNote);
  setters.setIsDemo(true);
  setters.setStep("desk");
}

export function PropDeskProvider({ children }: { children: React.ReactNode }) {
  const seed0 = useMemo(() => buildMockSeed(), []);
  const [step, setStep] = useState<StepId>("desk");
  const [draft, setDraftState] = useState<IntakeDraft>(initialDraft);
  const [challenge, setChallenge] = useState<Challenge | null>(seed0.challenge);
  const [platform, setPlatform] = useState<PlatformLink>(seed0.platform);
  const [connectBusy, setConnectBusy] = useState(false);
  const [strategy, setStrategy] = useState<StrategyPack | null>(seed0.strategy);
  const [governance, setGovState] = useState<Governance>(seed0.governance);
  const [newsBlocked, setNewsBlocked] = useState(seed0.newsBlocked);
  const [messages, setMessages] = useState<ChatMessage[]>(seed0.messages);
  const [verdicts, setVerdicts] = useState<VerdictCard[]>(seed0.verdicts);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>({
    ...seed0.verdicts[0],
    status: "open",
  });
  const [activePositions, setActivePositions] = useState<ActivePosition[]>(
    seed0.activePositions
  );
  const [trades, setTrades] = useState<LoggedTrade[]>(seed0.trades);
  const [runs, setRuns] = useState<MidfleetRun[]>(seed0.runs);
  const [agentBusy, setAgentBusy] = useState(false);
  const [setupBusy, setSetupBusy] = useState(false);
  const [positionsSyncing, setPositionsSyncing] = useState(false);
  const [lastPositionsSyncNote, setLastPositionsSyncNote] = useState<string | null>(
    seed0.lastPositionsSyncNote
  );
  const [ingestSummary, setIngestSummary] = useState<string[]>(seed0.ingestSummary);
  const [ingestConfidence, setIngestConfidence] = useState<
    "high" | "medium" | "low" | null
  >(seed0.ingestConfidence);
  const [isDemo, setIsDemo] = useState(true);

  const setDraft = useCallback((p: Partial<IntakeDraft>) => {
    setDraftState((d) => ({ ...d, ...p }));
  }, []);

  const setGovernance = useCallback((p: Partial<Governance>) => {
    setGovState((g) => ({ ...g, ...p }));
  }, []);

  const compliance = useMemo(() => {
    if (!challenge) return null;
    return computeCompliance(challenge, trades, governance, newsBlocked);
  }, [challenge, trades, governance, newsBlocked]);

  const configured = !!(
    challenge &&
    platform.status === "connected" &&
    strategy
  );

  const unlocked = useMemo(() => {
    const hasC = !!challenge;
    const hasP = platform.status === "connected";
    const hasS = !!strategy;
    return {
      setup: true,
      connect: hasC,
      rules: hasC && hasP,
      strategy: hasC && hasP,
      desk: hasC && hasP && hasS,
      ticket: !!activeTicket || verdicts.some((v) => v.kind === "approved"),
      active: hasC && hasP,
      journal: hasC && hasP && hasS,
    } as Record<StepId, boolean>;
  }, [challenge, platform.status, strategy, activeTicket, verdicts]);

  const completeSetup = useCallback(async () => {
    if (setupBusy) return;
    if (!draft.challengeName.trim() && !draft.firmName.trim()) return;
    setSetupBusy(true);
    try {
      const { result, run } = await runConciergeRulesIngest(draft);
      const c: Challenge = {
        id: uid("ch"),
        ...result.challenge,
        createdAt: new Date().toISOString(),
      };
      setChallenge(c);
      setGovState(result.governance);
      setIngestSummary(result.summary);
      setIngestConfidence(result.confidence);
      setRuns((r) => [run, ...r]);
      setTrades([]);
      setVerdicts([]);
      setActiveTicket(null);
      setActivePositions([]);
      setStrategy(null);
      setPlatform(disconnectedLink());
      setMessages([
        {
          id: uid("m"),
          role: "system",
          text: `Challenge “${c.label}” loaded. Next: connect cTrader or MT5 (required) so Concierge can read balance, positions, and risk live.`,
          at: new Date().toISOString(),
        },
      ]);
      setStep("connect");
    } finally {
      setSetupBusy(false);
    }
  }, [draft, setupBusy]);

  const connectToPlatform = useCallback(
    async (mode: ConnectionMode) => {
      if (!challenge || connectBusy) return;
      setConnectBusy(true);
      setPlatform((p) => ({ ...p, mode, status: "connecting" }));
      try {
        const link = await connectPlatform({
          mode,
          challengeId: challenge.id,
          environment: "demo",
        });
        setPlatform(link);
        setMessages((m) => [
          ...m,
          {
            id: uid("m"),
            role: "system",
            text: `Platform linked: ${mode === "ctrader" ? "cTrader" : "MT5"} ${link.externalAccountId} → challenge “${challenge.label}”. Positions + balance readable. Orders stay human-confirmed.`,
            at: new Date().toISOString(),
          },
        ]);
      } finally {
        setConnectBusy(false);
      }
    },
    [challenge, connectBusy]
  );

  const patchChallenge = useCallback((p: Partial<Challenge>) => {
    setChallenge((c) => (c ? { ...c, ...p } : c));
  }, []);

  const saveRulesAndContinue = useCallback(() => {
    setStep("strategy");
    setMessages((m) => [
      ...m,
      {
        id: uid("m"),
        role: "system",
        text: "Firm walls confirmed. Pick a strategy pack so Concierge knows what to hunt.",
        at: new Date().toISOString(),
      },
    ]);
  }, []);

  const setStrategyFromTemplate = useCallback((templateId: string) => {
    const t = STRATEGY_TEMPLATES.find((x) => x.id === templateId);
    if (!t) return;
    setStrategy({
      id: uid("st"),
      name: t.name,
      source: "template",
      thesis: t.thesis,
      sessions: [...t.sessions],
      symbols: [...t.symbols],
      indicators: t.indicators.map((i) => ({ ...i })),
      prechecks: t.prechecks.map((p) => ({ ...p })),
      riskCapPct: t.riskCapPct,
    });
  }, []);

  const setStrategyCustom = useCallback((thesis: string, name?: string) => {
    const text = thesis.trim();
    if (!text) return;
    setStrategy({
      id: uid("st"),
      name: name?.trim() || "My playbook",
      source: "custom",
      thesis: text,
      sessions: ["Custom"],
      symbols: ["EURUSD", "GBPUSD", "XAUUSD"],
      indicators: [
        { id: "user", label: "Your rules", role: "As described" },
        { id: "structure", label: "Structure", role: "Entry context" },
      ],
      prechecks: [
        { id: "thesis", label: "Fits written playbook", hard: true },
        { id: "rr", label: "Defined invalidation + target", hard: true },
        { id: "risk", label: "Risk within strategy cap", hard: true },
      ],
      riskCapPct: 0.5,
    });
  }, []);

  const saveStrategyAndOpenDesk = useCallback(() => {
    if (!strategy) return;
    setStep("desk");
    setMessages((m) => [
      ...m,
      {
        id: uid("m"),
        role: "system",
        text: `Desk live. Connected: challenge rules + ${platform.mode} ${platform.externalAccountId} + strategy “${strategy.name}”. Ask anything — trades, rules, strategy, journal, climate.`,
        at: new Date().toISOString(),
      },
    ]);
  }, [strategy, platform]);

  const sendAgent = useCallback(
    async (text: string) => {
      if (!challenge || !compliance || agentBusy) return;
      const userMsg: ChatMessage = {
        id: uid("m"),
        role: "user",
        text,
        at: new Date().toISOString(),
      };
      setMessages((m) => [...m, userMsg]);
      setAgentBusy(true);
      setRuns((r) => [
        {
          id: uid("run"),
          kind: "prop_consult",
          status: "running",
          inputSummary: text.slice(0, 80),
          outputSummary: "Concierge thinking…",
          startedAt: new Date().toISOString(),
        },
        ...r,
      ]);

      try {
        const { run, verdict, reply } = await runMidfleetPropAgent({
          prompt: text,
          challenge,
          compliance,
          governance,
          newsBlocked,
          strategy,
          platform,
          trades,
          positions: activePositions,
        });
        setRuns((r) => [run, ...r.filter((x) => x.status !== "running")]);
        if (verdict) {
          setVerdicts((v) => [verdict, ...v]);
          setMessages((m) => [
            ...m,
            {
              id: uid("m"),
              role: "agent",
              text: reply,
              verdictId: verdict.id,
              at: new Date().toISOString(),
            },
          ]);
          if (verdict.kind === "approved" || verdict.kind === "waitlist") {
            setActiveTicket({ ...verdict, status: "open" });
          }
        } else {
          setMessages((m) => [
            ...m,
            {
              id: uid("m"),
              role: "agent",
              text: reply,
              at: new Date().toISOString(),
            },
          ]);
        }
      } finally {
        setAgentBusy(false);
      }
    },
    [
      challenge,
      compliance,
      agentBusy,
      governance,
      newsBlocked,
      strategy,
      platform,
      trades,
      activePositions,
    ]
  );

  const openTicket = useCallback(
    (verdictId: string) => {
      const v = verdicts.find((x) => x.id === verdictId);
      if (!v || v.kind === "no_trade") return;
      setActiveTicket({ ...v, status: "open" });
      setStep("ticket");
    },
    [verdicts]
  );

  const dismissTicket = useCallback(() => {
    setActiveTicket(null);
    setStep("desk");
  }, []);

  const openPositionFromTicket = useCallback(() => {
    if (!activeTicket || activeTicket.kind === "no_trade") return;
    if (platform.status !== "connected") return;
    const pos = positionFromTicket(activeTicket, platform);
    setActivePositions((p) => [pos, ...p]);
    setActiveTicket((tk) => (tk ? { ...tk, status: "logged" } : null));
    setMessages((m) => [
      ...m,
      {
        id: uid("m"),
        role: "system",
        text: `Live on ${platform.mode} ${platform.externalAccountId}: ${pos.symbol} ${pos.side}. Why saved. See Active.`,
        at: new Date().toISOString(),
      },
    ]);
    setStep("active");
  }, [activeTicket, platform]);

  const syncPositions = useCallback(async () => {
    if (positionsSyncing) return;
    setPositionsSyncing(true);
    try {
      const { positions, note } = await syncPlatformPositions({
        link: platform,
        challenge,
        existing: activePositions,
      });
      setActivePositions(positions);
      setLastPositionsSyncNote(note);
      setRuns((r) => [
        {
          id: uid("mfr"),
          kind: "prop_positions_sync",
          status: "completed",
          inputSummary: `Sync ${platform.mode}`,
          outputSummary: note,
          startedAt: new Date().toISOString(),
          finishedAt: new Date().toISOString(),
        },
        ...r,
      ]);
    } finally {
      setPositionsSyncing(false);
    }
  }, [positionsSyncing, platform, challenge, activePositions]);

  const tickOpenMarks = useCallback(() => {
    setActivePositions((list) => list.map(tickPosition));
  }, []);

  const updatePositionWhy = useCallback((id: string, why: string) => {
    setActivePositions((list) =>
      list.map((p) => (p.id === id ? { ...p, conciergeWhy: why } : p))
    );
  }, []);

  const closePosition = useCallback(
    (id: string, result: "win" | "loss" | "be") => {
      const pos = activePositions.find((p) => p.id === id);
      if (!pos) return;
      const pnlR =
        result === "win"
          ? Math.max(0.5, pos.unrealizedPnlR || 1)
          : result === "loss"
            ? -1
            : 0;
      const trade: LoggedTrade = {
        id: uid("t"),
        symbol: pos.symbol,
        side: pos.side,
        entry: pos.entry,
        stop: pos.stop ?? 0,
        target: pos.target ?? 0,
        riskPct: challenge?.maxRiskPerTradePct ?? 0.5,
        riskUsd: pos.riskUsd,
        result,
        pnlR,
        pnlUsd: pos.riskUsd * pnlR,
        loggedAt: new Date().toISOString(),
        midfleetRunId: pos.midfleetRunId || "platform_close",
        note: pos.conciergeWhy,
      };
      setTrades((t) => [trade, ...t]);
      setActivePositions((list) => list.filter((p) => p.id !== id));
      setStep("journal");
    },
    [activePositions, challenge]
  );

  const logTrade = useCallback(
    (result: TradeResult, note = "") => {
      if (!activeTicket || !challenge) return;
      const pnlR =
        result === "win"
          ? activeTicket.rr
          : result === "loss"
            ? -1
            : result === "be"
              ? 0
              : 0;
      const realized =
        result === "planned" || result === "skipped" ? 0 : activeTicket.riskUsd * pnlR;
      const trade: LoggedTrade = {
        id: uid("t"),
        symbol: activeTicket.symbol,
        side: activeTicket.side,
        entry: activeTicket.entry,
        stop: activeTicket.stop,
        target: activeTicket.target,
        riskPct: activeTicket.riskPct,
        riskUsd: activeTicket.riskUsd,
        result,
        pnlR: result === "planned" || result === "skipped" ? 0 : pnlR,
        pnlUsd: realized,
        loggedAt: new Date().toISOString(),
        midfleetRunId: activeTicket.midfleetRunId,
        note,
      };
      setTrades((t) => [trade, ...t]);
      setActiveTicket((tk) => (tk ? { ...tk, status: "logged" } : null));
      setStep("journal");
    },
    [activeTicket, challenge]
  );

  const ingestManualTrade = useCallback(
    (input: {
      symbol: string;
      side: "long" | "short";
      pnlR: number;
      note: string;
    }) => {
      if (!challenge || !compliance) return;
      const riskUsd = compliance.riskBudgetUsd;
      const trade: LoggedTrade = {
        id: uid("t"),
        symbol: input.symbol.toUpperCase(),
        side: input.side,
        entry: 0,
        stop: 0,
        target: 0,
        riskPct: challenge.maxRiskPerTradePct,
        riskUsd,
        result: input.pnlR > 0 ? "win" : input.pnlR < 0 ? "loss" : "be",
        pnlR: input.pnlR,
        pnlUsd: riskUsd * input.pnlR,
        loggedAt: new Date().toISOString(),
        midfleetRunId: "manual_ingest",
        note: input.note || "Manual fill",
      };
      setTrades((t) => [trade, ...t]);
      setStep("journal");
    },
    [challenge, compliance]
  );

  const loadDemo = useCallback(() => {
    const seed = buildMockSeed();
    applySeed(seed, {
      setStep,
      setChallenge,
      setPlatform,
      setStrategy,
      setGovState,
      setNewsBlocked,
      setMessages,
      setVerdicts,
      setActiveTicket,
      setActivePositions,
      setTrades,
      setRuns,
      setIngestSummary,
      setIngestConfidence,
      setLastPositionsSyncNote,
      setIsDemo,
    });
  }, []);

  const resetAll = useCallback(() => {
    setStep("setup");
    setDraftState(initialDraft);
    setChallenge(null);
    setPlatform(disconnectedLink());
    setStrategy(null);
    setGovState({ ...DEFAULT_GOVERNANCE });
    setNewsBlocked(false);
    setMessages([]);
    setVerdicts([]);
    setActiveTicket(null);
    setActivePositions([]);
    setTrades([]);
    setRuns([]);
    setIngestSummary([]);
    setIngestConfidence(null);
    setLastPositionsSyncNote(null);
    setIsDemo(false);
  }, []);

  const value: Store = {
    step,
    setStep,
    draft,
    setDraft,
    challenge,
    platform,
    connectBusy,
    connectToPlatform,
    strategy,
    setStrategyFromTemplate,
    setStrategyCustom,
    governance,
    setGovernance,
    newsBlocked,
    setNewsBlocked,
    messages,
    verdicts,
    activeTicket,
    activePositions,
    trades,
    runs,
    agentBusy,
    setupBusy,
    positionsSyncing,
    lastPositionsSyncNote,
    ingestSummary,
    ingestConfidence,
    compliance,
    configured,
    isDemo,
    completeSetup,
    patchChallenge,
    saveRulesAndContinue,
    saveStrategyAndOpenDesk,
    sendAgent,
    openTicket,
    dismissTicket,
    openPositionFromTicket,
    logTrade,
    syncPositions,
    tickOpenMarks,
    updatePositionWhy,
    closePosition,
    ingestManualTrade,
    loadDemo,
    resetAll,
    unlocked,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePropDesk() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePropDesk outside provider");
  return ctx;
}

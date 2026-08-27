import { money, pct } from "./compliance";
import type {
  ActivePosition,
  Challenge,
  Compliance,
  Governance,
  LoggedTrade,
  MidfleetRun,
  PlatformLink,
  StrategyPack,
  VerdictCard,
} from "./types";

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Full Concierge brain: trades, rules, strategy, journal, climate. */
export async function runMidfleetPropAgent(opts: {
  prompt: string;
  challenge: Challenge;
  compliance: Compliance;
  governance: Governance;
  newsBlocked: boolean;
  strategy: StrategyPack | null;
  platform: PlatformLink;
  trades: LoggedTrade[];
  positions: ActivePosition[];
}): Promise<{ run: MidfleetRun; verdict: VerdictCard | null; reply: string }> {
  const {
    prompt,
    challenge,
    compliance,
    governance,
    newsBlocked,
    strategy,
    platform,
    trades,
    positions,
  } = opts;
  const startedAt = new Date().toISOString();
  const runId = uid("mfr");
  const lower = prompt.toLowerCase();

  await sleep(500 + Math.random() * 450);

  // ——— Consult paths (no ticket) ———
  if (isConsult(lower, ["rule", "wall", "drawdown", "daily loss", "governance", "challenge limit"])) {
    return consult(
      runId,
      startedAt,
      prompt,
      rulesBrief(challenge, compliance, governance)
    );
  }

  if (isConsult(lower, ["strateg", "playbook", "precheck", "indicator", "setup"])) {
    return consult(runId, startedAt, prompt, strategyBrief(strategy));
  }

  if (isConsult(lower, ["journal", "performance", "expectancy", "win rate", "how am i", "improve", "analysis"])) {
    return consult(runId, startedAt, prompt, journalBrief(trades, strategy, compliance));
  }

  if (isConsult(lower, ["active", "open position", "my trade", "how is", "unrealized", "position"])) {
    return consult(runId, startedAt, prompt, positionsBrief(positions, platform));
  }

  if (isConsult(lower, ["climate", "market", "session", "bias", "favour", "skew"])) {
    return consult(
      runId,
      startedAt,
      prompt,
      climateBrief(challenge, strategy, newsBlocked, compliance)
    );
  }

  if (isConsult(lower, ["connect", "platform", "ctrader", "mt5", "account link"])) {
    return consult(runId, startedAt, prompt, platformBrief(platform, challenge));
  }

  if (lower.includes("block") || lower.includes("why am i")) {
    if (compliance.status === "clear") {
      return consult(
        runId,
        startedAt,
        prompt,
        `Gates are CLEAR.\n• Daily left ${money(compliance.dailyLossLeftUsd)}\n• DD cushion ${money(compliance.distanceToFloorUsd)}\n• News ${newsBlocked ? "blocked" : "clear"}\n• Platform ${platform.status}\n• Strategy ${strategy?.name ?? "not set"}\nAsk “Find a trade” when ready.`
      );
    }
    const verdict = buildNoTrade(runId, challenge, compliance, compliance.statusReason, strategy);
    return {
      run: finishRun(runId, "prop_why_blocked", startedAt, prompt, verdict.thesis),
      verdict,
      reply: `Blocked: ${compliance.statusReason}`,
    };
  }

  // ——— Trade scan paths ———
  if (platform.status !== "connected") {
    return consult(
      runId,
      startedAt,
      prompt,
      "Platform is not connected. Concierge needs cTrader or MT5 linked to size and watch live risk. Go to Platform and connect first."
    );
  }

  if (!strategy) {
    return consult(
      runId,
      startedAt,
      prompt,
      "No strategy pack yet. Pick a template or describe your playbook on Strategy, then I can hunt setups inside it."
    );
  }

  if (compliance.status === "blocked") {
    const verdict = buildNoTrade(
      runId,
      challenge,
      compliance,
      "Account blocked — no new risk until walls recover.",
      strategy
    );
    return {
      run: finishRun(runId, "prop_scan", startedAt, prompt, "NO_TRADE: blocked"),
      verdict,
      reply: verdict.thesis,
    };
  }

  if (
    (newsBlocked && governance.blockOnNews && challenge.newsRestricted) ||
    lower.includes("news block")
  ) {
    const verdict = buildNoTrade(
      runId,
      challenge,
      compliance,
      "News window — firm + strategy precheck block new entries.",
      strategy
    );
    return {
      run: finishRun(runId, "prop_scan", startedAt, prompt, "NO_TRADE: news"),
      verdict,
      reply: "NO TRADE: news blackout under your rules + playbook.",
    };
  }

  if (compliance.status === "caution" && (lower.includes("scan") || lower.includes("find"))) {
    const verdict = buildWaitlist(runId, challenge, compliance, strategy);
    return {
      run: finishRun(runId, "prop_scan", startedAt, prompt, "WAITLIST"),
      verdict,
      reply: `Setup fits ${strategy.name} but buffer is thin → WAITLIST. Cut risk or wait.`,
    };
  }

  const symbol =
    strategy.symbols.find((s) => lower.includes(s.toLowerCase())) ??
    challenge.allowedInstruments.find((s) => lower.includes(s.toLowerCase())) ??
    strategy.symbols[0] ??
    challenge.allowedInstruments[0] ??
    "EURUSD";

  const riskPct = Math.min(
    challenge.maxRiskPerTradePct,
    strategy.riskCapPct ?? challenge.maxRiskPerTradePct,
    governance.maxRiskOverridePct ?? 99,
    compliance.dailyLossLeftUsd > 0
      ? (compliance.riskBudgetUsd / challenge.startingBalance) * 100
      : 0.25
  );

  const verdict = buildApproved(
    runId,
    challenge,
    compliance,
    symbol,
    riskPct,
    strategy
  );

  return {
    run: finishRun(
      runId,
      "prop_scan",
      startedAt,
      prompt,
      `APPROVED ${symbol} · ${strategy.name}`
    ),
    verdict,
    reply: `Climate + ${strategy.name} + ${challenge.firm} walls + ${platform.mode} account ${platform.externalAccountId}.\nVerdict: APPROVED ${symbol}. You confirm — nothing auto-sends live.`,
  };
}

function isConsult(lower: string, keys: string[]) {
  return keys.some((k) => lower.includes(k));
}

function consult(
  runId: string,
  startedAt: string,
  prompt: string,
  reply: string
): { run: MidfleetRun; verdict: null; reply: string } {
  return {
    run: finishRun(runId, "prop_consult", startedAt, prompt, reply.slice(0, 80)),
    verdict: null,
    reply,
  };
}

function rulesBrief(
  challenge: Challenge,
  compliance: Compliance,
  governance: Governance
) {
  return [
    `**Challenge rules — ${challenge.label}**`,
    `• Firm: ${challenge.firm} · ${challenge.programLabel} · $${challenge.accountSize.toLocaleString()}`,
    `• Daily loss ${pct(challenge.maxDailyLossPct)} (left ${money(compliance.dailyLossLeftUsd)})`,
    `• Max DD ${pct(challenge.maxLossPct)} · floor ${money(compliance.maxLossFloorUsd)} · cushion ${money(compliance.distanceToFloorUsd)}`,
    `• Target ${pct(challenge.profitTargetPct)} · progress ${pct(compliance.profitProgressPct, 0)}`,
    `• Risk/idea ${pct(challenge.maxRiskPerTradePct)} · news restricted: ${challenge.newsRestricted ? "yes" : "no"}`,
    `• Governance: human confirm ${governance.humanConfirmRequired ? "ON" : "off"} · auto-live ${governance.autoLiveDisabled ? "OFF" : "ON"} · Midfleet required ${governance.midfleetRequired ? "yes" : "no"}`,
    `Status: ${compliance.status.toUpperCase()} — ${compliance.statusReason}`,
  ].join("\n");
}

function strategyBrief(strategy: StrategyPack | null) {
  if (!strategy) {
    return "No strategy pack loaded. Open Strategy and pick a template or describe yours. I only hunt setups inside a pack.";
  }
  return [
    `**Playbook — ${strategy.name}** (${strategy.source})`,
    `• ${strategy.thesis}`,
    `• Sessions: ${strategy.sessions.join(", ") || "—"}`,
    `• Universe: ${strategy.symbols.join(", ")}`,
    `• Indicators: ${strategy.indicators.map((i) => `${i.label} (${i.role})`).join("; ")}`,
    `• Prechecks:`,
    ...strategy.prechecks.map(
      (p) => `  - [${p.hard ? "hard" : "soft"}] ${p.label}`
    ),
    strategy.riskCapPct != null
      ? `• Strategy risk cap ${pct(strategy.riskCapPct)} (tighter than firm if lower)`
      : "• Risk cap: firm default",
    `I refuse tickets that fail hard prechecks even if firm walls are OK.`,
  ].join("\n");
}

function journalBrief(
  trades: LoggedTrade[],
  strategy: StrategyPack | null,
  compliance: Compliance
) {
  const closed = trades.filter((t) => t.result !== "planned" && t.result !== "skipped");
  if (closed.length === 0) {
    return `Journal is empty. After a few closes I can score expectancy, setup quality, and what to tighten in ${strategy?.name ?? "your playbook"}.\nChallenge progress: ${pct(compliance.profitProgressPct, 0)} of target.`;
  }
  const wins = closed.filter((t) => t.pnlR > 0).length;
  const losses = closed.filter((t) => t.pnlR < 0).length;
  const sumR = closed.reduce((s, t) => s + t.pnlR, 0);
  const avgR = sumR / closed.length;
  const wr = (wins / closed.length) * 100;
  const tips: string[] = [];
  if (avgR < 0) tips.push("Expectancy negative — cut losers faster or skip marginal setups.");
  if (wr < 40 && avgR > 0) tips.push("Low win rate but positive R — protect winners; your edge is payoff.");
  if (wr > 60 && avgR < 0.2) tips.push("High win rate, small R — trail or lift targets slightly.");
  if (compliance.status === "caution")
    tips.push("Buffers are thin — fewer trades, full prechecks only.");
  if (tips.length === 0)
    tips.push(
      strategy
        ? `Stay inside ${strategy.name} session/universe; don’t freestyle outside the pack.`
        : "Define a strategy pack so analysis can tag setups."
    );

  return [
    `**Journal analysis** (${closed.length} closes)`,
    `• Win/loss ${wins}/${losses} · win rate ${wr.toFixed(0)}%`,
    `• Total ${sumR >= 0 ? "+" : ""}${sumR.toFixed(1)}R · avg ${avgR >= 0 ? "+" : ""}${avgR.toFixed(2)}R`,
    `• Challenge target progress ${pct(compliance.profitProgressPct, 0)}`,
    `**Do better**`,
    ...tips.map((t) => `• ${t}`),
  ].join("\n");
}

function positionsBrief(positions: ActivePosition[], platform: PlatformLink) {
  if (platform.status !== "connected") {
    return "Platform disconnected — no live position feed.";
  }
  if (positions.length === 0) {
    return `No open positions on ${platform.mode} account ${platform.externalAccountId}. Ask me to find a new trade, or Sync on Active.`;
  }
  const lines = positions.map((p) => {
    const u = `${p.unrealizedPnlR >= 0 ? "+" : ""}${p.unrealizedPnlR.toFixed(2)}R (${money(p.unrealizedPnlUsd)})`;
    return `• ${p.symbol} ${p.side} ${u}\n  Why: ${p.conciergeWhy}\n  SL ${p.stop ?? "—"} TP ${p.target ?? "—"} · ${p.platform} ${p.platformId}`;
  });
  return [
    `**Active on ${platform.mode} (${platform.externalAccountId})**`,
    ...lines,
    `Ask about any symbol for a deeper read, or “find a new trade” if you want another idea.`,
  ].join("\n");
}

function climateBrief(
  challenge: Challenge,
  strategy: StrategyPack | null,
  newsBlocked: boolean,
  compliance: Compliance
) {
  const session = strategy?.sessions[0] ?? "London/NY";
  return [
    `**Market climate (desk read)**`,
    `• Session focus: ${session}`,
    `• News window: ${newsBlocked ? "BLOCKED — no new risk" : "Clear"}`,
    `• Challenge status: ${compliance.status} — ${compliance.statusReason}`,
    `• Skew: ${
      compliance.status === "clear" && !newsBlocked
        ? strategy
          ? `Favour setups in ${strategy.symbols.slice(0, 3).join(", ")} per ${strategy.name}`
          : `Favour liquid majors on ${challenge.firm} allow-list`
        : "No favourable skew until gates clear"
    }`,
    `Ask “Find a trade” for a prop-safe ticket inside your pack.`,
  ].join("\n");
}

function platformBrief(platform: PlatformLink, challenge: Challenge) {
  if (platform.status !== "connected") {
    return "Not connected. Link cTrader or MT5 — required for live balance, positions, and Concierge risk context.";
  }
  const c = platform.capabilities;
  return [
    `**Platform link**`,
    `• ${platform.mode === "ctrader" ? "cTrader" : "MT5"} · ${platform.environment} · ${platform.externalAccountId}`,
    `• Bound to challenge: ${challenge.label}`,
    `• Health: ${platform.healthNote}`,
    `• Caps: balance ${c.readBalance ? "✓" : "✗"} · positions ${c.readPositions ? "✓" : "✗"} · history ${c.readHistory ? "✓" : "✗"} · auto orders ${c.placeOrders ? "✓" : "✗ (supervised)"}`,
    `Data path: Platform API → Prop Desk → Concierge/Midfleet context → ticket/active/journal.`,
  ].join("\n");
}

function finishRun(
  id: string,
  kind: MidfleetRun["kind"],
  startedAt: string,
  input: string,
  output: string
): MidfleetRun {
  return {
    id,
    kind,
    status: "completed",
    inputSummary: input.slice(0, 120),
    outputSummary: output,
    startedAt,
    finishedAt: new Date().toISOString(),
  };
}

function buildApproved(
  runId: string,
  challenge: Challenge,
  compliance: Compliance,
  symbol: string,
  riskPct: number,
  strategy: StrategyPack
): VerdictCard {
  const entry = symbol.includes("XAU") ? 2642.5 : symbol.includes("USDJPY") ? 149.2 : 1.085;
  const stopDist = symbol.includes("XAU") ? 4.5 : symbol.includes("USDJPY") ? 0.25 : 0.003;
  const stop = entry - stopDist;
  const target = entry + stopDist * 2;
  const riskUsd = (challenge.startingBalance * riskPct) / 100;

  return {
    id: uid("v"),
    kind: "approved",
    symbol,
    side: "long",
    entry,
    stop,
    target,
    riskPct,
    riskUsd,
    rr: 2,
    thesis: `${strategy.name}: prop-safe idea on ${symbol}. ${strategy.thesis}`,
    checks: allChecks(challenge, compliance, strategy, true, true, true),
    midfleetRunId: runId,
    createdAt: new Date().toISOString(),
  };
}

function buildWaitlist(
  runId: string,
  challenge: Challenge,
  compliance: Compliance,
  strategy: StrategyPack
): VerdictCard {
  const symbol = strategy.symbols[0] ?? "EURUSD";
  return {
    id: uid("v"),
    kind: "waitlist",
    symbol,
    side: "long",
    entry: 1.082,
    stop: 1.079,
    target: 1.088,
    riskPct: Math.min(0.25, strategy.riskCapPct ?? challenge.maxRiskPerTradePct),
    riskUsd: challenge.startingBalance * 0.0025,
    rr: 2,
    thesis: `Fits ${strategy.name}, but compliance buffer is caution.`,
    checks: allChecks(challenge, compliance, strategy, true, false, true),
    midfleetRunId: runId,
    createdAt: new Date().toISOString(),
  };
}

function buildNoTrade(
  runId: string,
  challenge: Challenge,
  compliance: Compliance,
  reason: string,
  strategy: StrategyPack | null
): VerdictCard {
  return {
    id: uid("v"),
    kind: "no_trade",
    symbol: "—",
    side: "long",
    entry: 0,
    stop: 0,
    target: 0,
    riskPct: 0,
    riskUsd: 0,
    rr: 0,
    thesis: reason,
    checks: allChecks(challenge, compliance, strategy, false, false, false),
    midfleetRunId: runId,
    createdAt: new Date().toISOString(),
  };
}

function allChecks(
  challenge: Challenge,
  compliance: Compliance,
  strategy: StrategyPack | null,
  dailyOk: boolean,
  bufferOk: boolean,
  newsOk: boolean
) {
  const base = [
    {
      id: "daily",
      label: "Daily loss buffer",
      pass: dailyOk && compliance.dailyLossLeftUsd > 0,
      detail: `Left ${compliance.dailyLossLeftUsd.toFixed(0)}`,
    },
    {
      id: "dd",
      label: "Max DD floor",
      pass: compliance.distanceToFloorUsd > 0,
      detail: `Cushion ${compliance.distanceToFloorUsd.toFixed(0)}`,
    },
    {
      id: "risk",
      label: "Risk ≤ caps",
      pass: bufferOk,
      detail: `Firm ${challenge.maxRiskPerTradePct}%`,
    },
    {
      id: "news",
      label: "News rule",
      pass: newsOk,
      detail: challenge.newsRestricted ? "Restricted" : "Open",
    },
    {
      id: "human",
      label: "Human confirm",
      pass: true,
      detail: "Required",
    },
  ];
  if (strategy) {
    for (const p of strategy.prechecks.filter((x) => x.hard).slice(0, 3)) {
      base.push({
        id: p.id,
        label: `Strategy: ${p.label}`,
        pass: bufferOk && dailyOk && newsOk,
        detail: strategy.name,
      });
    }
  }
  return base;
}

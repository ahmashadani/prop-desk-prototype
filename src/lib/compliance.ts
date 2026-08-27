import type { Challenge, Compliance, Governance, LoggedTrade } from "./types";

export function computeCompliance(
  challenge: Challenge,
  trades: LoggedTrade[],
  governance: Governance,
  newsBlocked = false
): Compliance {
  const closed = trades.filter((t) => t.result !== "planned" && t.result !== "skipped");
  const totalPnl = closed.reduce((s, t) => s + t.pnlUsd, 0);
  const todayPnl = closed
    .filter((t) => isToday(t.loggedAt))
    .reduce((s, t) => s + t.pnlUsd, 0);

  const equity = challenge.startingBalance + totalPnl;
  const profitTargetUsd = (challenge.startingBalance * challenge.profitTargetPct) / 100;
  const profitProgressPct =
    profitTargetUsd > 0
      ? Math.min(100, Math.max(0, (totalPnl / profitTargetUsd) * 100))
      : 0;

  const maxDailyLossUsd = (challenge.startingBalance * challenge.maxDailyLossPct) / 100;
  const dailyLossLeftUsd = Math.max(0, maxDailyLossUsd + Math.min(0, todayPnl));

  const maxLossFloorUsd =
    challenge.startingBalance * (1 - challenge.maxLossPct / 100);
  const distanceToFloorUsd = equity - maxLossFloorUsd;

  const riskPct =
    governance.maxRiskOverridePct ?? challenge.maxRiskPerTradePct;
  const riskBudgetUsd = (challenge.startingBalance * riskPct) / 100;

  const tradingDays = new Set(
    closed.map((t) => t.loggedAt.slice(0, 10))
  ).size;

  const wins = closed.filter((t) => t.pnlUsd > 0);
  const bestDay = Math.max(0, ...groupByDay(closed).map((d) => d.pnl));
  const bestDayPctOfProfit =
    totalPnl > 0 && challenge.consistencyPct != null
      ? (bestDay / totalPnl) * 100
      : null;
  const consistencyOk =
    challenge.consistencyPct == null ||
    totalPnl <= 0 ||
    bestDayPctOfProfit == null ||
    bestDayPctOfProfit <= challenge.consistencyPct;

  let status: Compliance["status"] = "clear";
  let statusReason = "Clear to trade under challenge rules.";

  if (equity <= maxLossFloorUsd) {
    status = "blocked";
    statusReason = "Max drawdown floor breached — no new risk.";
  } else if (dailyLossLeftUsd <= 0) {
    status = "blocked";
    statusReason = "Daily loss limit reached — stop for the day.";
  } else if (newsBlocked && governance.blockOnNews && challenge.newsRestricted) {
    status = "blocked";
    statusReason = "News window blocked by governance + firm rules.";
  } else if (
    dailyLossLeftUsd < riskBudgetUsd * governance.blockOnDailyBufferBelowR
  ) {
    status = "caution";
    statusReason = `Daily buffer under ${governance.blockOnDailyBufferBelowR}R — reduce size or wait.`;
  } else if (!consistencyOk) {
    status = "caution";
    statusReason = "Consistency / best-day pressure — avoid oversized winners.";
  } else if (distanceToFloorUsd < riskBudgetUsd * 2) {
    status = "caution";
    statusReason = "Close to max DD floor — tighter risk only.";
  }

  return {
    equity,
    totalPnl,
    todayPnl,
    profitTargetUsd,
    profitProgressPct,
    maxDailyLossUsd,
    dailyLossLeftUsd,
    maxLossFloorUsd,
    distanceToFloorUsd,
    riskBudgetUsd,
    tradingDays,
    minTradingDays: challenge.minTradingDays,
    consistencyOk,
    bestDayPctOfProfit,
    status,
    statusReason,
  };
}

function isToday(iso: string) {
  return iso.slice(0, 10) === new Date().toISOString().slice(0, 10);
}

function groupByDay(trades: LoggedTrade[]) {
  const map = new Map<string, number>();
  for (const t of trades) {
    const d = t.loggedAt.slice(0, 10);
    map.set(d, (map.get(d) ?? 0) + t.pnlUsd);
  }
  return [...map.entries()].map(([day, pnl]) => ({ day, pnl }));
}

export function money(n: number) {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}

export function pct(n: number, digits = 1) {
  return `${n.toFixed(digits)}%`;
}

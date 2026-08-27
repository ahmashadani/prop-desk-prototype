import type {
  ActivePosition,
  Challenge,
  ConnectionMode,
  PlatformLink,
  Ticket,
  VerdictCard,
} from "./types";

function uid(p: string) {
  return `${p}_${Math.random().toString(36).slice(2, 9)}`;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function platformFromMode(mode: ConnectionMode): ActivePosition["platform"] {
  return mode === "ctrader" ? "ctrader" : "mt5";
}

/** Build open position when user confirms a ticket went live. */
export function positionFromTicket(
  ticket: Ticket | VerdictCard,
  link: PlatformLink,
  why?: string
): ActivePosition {
  const platform = platformFromMode(link.mode);
  const riskUsd = ticket.riskUsd || 250;
  const drift = ticket.side === "long" ? 0.00035 : -0.00035;
  const current =
    ticket.entry +
    (ticket.symbol.includes("XAU")
      ? drift * 8000
      : ticket.symbol.includes("JPY")
        ? drift * 80
        : drift);

  const stopDist = Math.abs(ticket.entry - ticket.stop) || 0.003;
  const pnlPrice = ticket.side === "long" ? current - ticket.entry : ticket.entry - current;
  const unrealizedPnlR = stopDist > 0 ? pnlPrice / stopDist : 0;
  const unrealizedPnlUsd = unrealizedPnlR * riskUsd;

  return {
    id: uid("pos"),
    platformId: `${platform.toUpperCase()}-${Math.floor(Math.random() * 90000 + 10000)}`,
    platform,
    symbol: ticket.symbol,
    side: ticket.side,
    volume:
      Number(
        (
          riskUsd /
          (stopDist * (ticket.symbol.includes("XAU") ? 100 : 100000))
        ).toFixed(2)
      ) || 0.1,
    entry: ticket.entry,
    current,
    stop: ticket.stop || null,
    target: ticket.target || null,
    unrealizedPnlUsd,
    unrealizedPnlR,
    riskUsd,
    toStopPct: ticket.stop
      ? Math.abs(current - ticket.stop) / Math.abs(ticket.entry - ticket.stop)
      : null,
    toTargetPct: ticket.target
      ? 1 - Math.abs(ticket.target - current) / Math.abs(ticket.target - ticket.entry)
      : null,
    mfeUsd: Math.max(0, unrealizedPnlUsd),
    maeUsd: Math.min(0, unrealizedPnlUsd),
    openedAt: new Date().toISOString(),
    lastSyncAt: new Date().toISOString(),
    midfleetRunId: ticket.midfleetRunId,
    conciergeWhy:
      why ||
      ticket.thesis ||
      "Concierge approved under challenge walls + playbook prechecks.",
    playbookTag: "desk-ticket",
    status: "open",
  };
}

/**
 * Simulate cTrader / MT5 open-positions API pull.
 */
export async function syncPlatformPositions(opts: {
  link: PlatformLink;
  challenge: Challenge | null;
  existing: ActivePosition[];
}): Promise<{ positions: ActivePosition[]; note: string }> {
  await sleep(450 + Math.random() * 350);
  const { link, challenge, existing } = opts;

  if (link.status !== "connected") {
    return {
      positions: existing,
      note: "Platform not connected — cannot sync positions.",
    };
  }

  const platform = platformFromMode(link.mode);
  let next = existing.map((p) => tickPosition(p));

  if (next.length === 0 && challenge) {
    const symbol = challenge.allowedInstruments[0] ?? "EURUSD";
    const entry = symbol.includes("XAU") ? 2640 : 1.0842;
    const stop = entry * 0.997;
    const target = entry * 1.006;
    const riskUsd = (challenge.startingBalance * challenge.maxRiskPerTradePct) / 100;
    const demo: ActivePosition = {
      id: uid("pos"),
      platformId: `${platform.toUpperCase()}-SYNC-${Math.floor(Math.random() * 8000 + 1000)}`,
      platform,
      symbol,
      side: "long",
      volume: 0.4,
      entry,
      current: entry * 1.0004,
      stop,
      target,
      unrealizedPnlUsd: riskUsd * 0.35,
      unrealizedPnlR: 0.35,
      riskUsd,
      toStopPct: 0.72,
      toTargetPct: 0.28,
      mfeUsd: riskUsd * 0.5,
      maeUsd: -riskUsd * 0.1,
      openedAt: new Date(Date.now() - 36 * 60 * 1000).toISOString(),
      lastSyncAt: new Date().toISOString(),
      midfleetRunId: null,
      conciergeWhy:
        link.mode === "ctrader"
          ? `Ingested from cTrader account ${link.externalAccountId}. No prior ticket — external/discretionary entry. Attach why if this is yours.`
          : `Ingested from MT5 account ${link.externalAccountId}. No Concierge ticket linked — check vs daily wall.`,
      playbookTag: "platform-ingest",
      status: "open",
    };
    next = [demo];
  } else {
    next = next.map((p) => ({ ...p, lastSyncAt: new Date().toISOString() }));
  }

  const src =
    link.mode === "ctrader"
      ? `cTrader Open API (${link.externalAccountId})`
      : `MT5 bridge (${link.externalAccountId})`;

  return {
    positions: next,
    note: `Synced ${next.length} open position(s) via ${src}.`,
  };
}

export function tickPosition(p: ActivePosition): ActivePosition {
  const noise =
    (Math.random() - 0.45) *
    (p.symbol.includes("XAU") ? 0.35 : p.symbol.includes("JPY") ? 0.02 : 0.00012);
  const current = p.side === "long" ? p.current + noise : p.current - noise * 0.3;
  const stopDist =
    p.stop != null ? Math.abs(p.entry - p.stop) : Math.abs(p.entry) * 0.002;
  const pnlPrice = p.side === "long" ? current - p.entry : p.entry - current;
  const unrealizedPnlR = stopDist > 0 ? pnlPrice / stopDist : 0;
  const unrealizedPnlUsd = unrealizedPnlR * p.riskUsd;
  const mfeUsd = Math.max(p.mfeUsd, unrealizedPnlUsd);
  const maeUsd = Math.min(p.maeUsd, unrealizedPnlUsd);

  return {
    ...p,
    current: Number(current.toFixed(p.symbol.includes("XAU") ? 2 : 5)),
    unrealizedPnlR: Number(unrealizedPnlR.toFixed(2)),
    unrealizedPnlUsd: Number(unrealizedPnlUsd.toFixed(2)),
    mfeUsd: Number(mfeUsd.toFixed(2)),
    maeUsd: Number(maeUsd.toFixed(2)),
    toStopPct:
      p.stop != null
        ? Number(
            (Math.abs(current - p.stop) / Math.abs(p.entry - p.stop)).toFixed(2)
          )
        : null,
    toTargetPct:
      p.target != null
        ? Number(
            (
              1 -
              Math.abs(p.target - current) / Math.abs(p.target - p.entry)
            ).toFixed(2)
          )
        : null,
    lastSyncAt: new Date().toISOString(),
  };
}

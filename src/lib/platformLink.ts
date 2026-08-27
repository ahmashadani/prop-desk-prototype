import type { ConnectionMode, PlatformLink } from "./types";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Simulate OAuth / API key connect to cTrader or MT5. */
export async function connectPlatform(opts: {
  mode: ConnectionMode;
  challengeId: string;
  environment?: "demo" | "live";
}): Promise<PlatformLink> {
  await sleep(800 + Math.random() * 500);
  const env = opts.environment ?? "demo";
  const prefix = opts.mode === "ctrader" ? "CT" : "MT5";
  const externalAccountId = `${prefix}-${env.toUpperCase()}-${Math.floor(
    100000 + Math.random() * 899999
  )}`;

  return {
    mode: opts.mode,
    status: "connected",
    externalAccountId,
    environment: env,
    capabilities: {
      readBalance: true,
      readPositions: true,
      readHistory: true,
      // supervised: no silent live place in prototype
      placeOrders: false,
    },
    linkedChallengeId: opts.challengeId,
    lastHealthAt: new Date().toISOString(),
    healthNote:
      opts.mode === "ctrader"
        ? "cTrader Open API · token OK · positions stream ready"
        : "MT5 bridge · account bound · positions + deals readable",
  };
}

export function disconnectedLink(): PlatformLink {
  return {
    mode: "ctrader",
    status: "disconnected",
    externalAccountId: null,
    environment: "demo",
    capabilities: {
      readBalance: false,
      readPositions: false,
      readHistory: false,
      placeOrders: false,
    },
    linkedChallengeId: null,
    lastHealthAt: null,
    healthNote: null,
  };
}

export function platformLabel(mode: ConnectionMode) {
  return mode === "ctrader" ? "cTrader" : "MT5 / TradeLocker";
}

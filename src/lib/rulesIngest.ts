import type { Challenge, Governance, MidfleetRun, Phase } from "./types";
import { DEFAULT_GOVERNANCE } from "./presets";

export interface IntakeDraft {
  challengeName: string;
  firmName: string;
  accountSize: number;
  /** Free text: 1-step, 2-step, challenge, verification, funded, instant, etc. */
  programLabel: string;
  rulesUrl: string;
  rulesPaste: string;
}

export interface IngestedRules {
  challenge: Omit<Challenge, "id" | "createdAt">;
  governance: Governance;
  summary: string[];
  confidence: "high" | "medium" | "low";
  source: "url" | "paste" | "name_heuristic" | "defaults";
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizePhase(programLabel: string): Phase {
  const t = programLabel.toLowerCase();
  if (t.includes("fund")) return "funded";
  if (t.includes("verif") || t.includes("phase 2") || t.includes("step 2"))
    return "verification";
  return "challenge";
}

/** Simulated Concierge + Midfleet rules read (URL / paste / name). */
export async function runConciergeRulesIngest(
  draft: IntakeDraft
): Promise<{ result: IngestedRules; run: MidfleetRun }> {
  const startedAt = new Date().toISOString();
  const runId = uid("mfr");
  await sleep(700 + Math.random() * 500);

  const blob = `${draft.challengeName} ${draft.firmName} ${draft.programLabel} ${draft.rulesUrl} ${draft.rulesPaste}`.toLowerCase();
  const hasUrl = !!draft.rulesUrl.trim();
  const hasPaste = draft.rulesPaste.trim().length > 20;

  // Heuristic extraction (prototype stand-in for real page fetch + LLM normalize)
  let maxDaily = pickPct(blob, [/daily\s*(?:loss|drawdown)?\s*[:=]?\s*(\d+(?:\.\d+)?)\s*%/i, /(\d+(?:\.\d+)?)\s*%\s*daily/i], 5);
  let maxDd = pickPct(blob, [/max(?:imum)?\s*(?:total\s*)?(?:loss|drawdown)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*%/i, /(\d+(?:\.\d+)?)\s*%\s*(?:max|total)\s*(?:dd|drawdown|loss)/i], 10);
  let target = pickPct(blob, [/profit\s*target\s*[:=]?\s*(\d+(?:\.\d+)?)\s*%/i, /target\s*[:=]?\s*(\d+(?:\.\d+)?)\s*%/i], 10);
  let risk = pickPct(blob, [/(?:max\s*)?risk\s*(?:per\s*(?:trade|idea))?\s*[:=]?\s*(\d+(?:\.\d+)?)\s*%/i], 0.5);
  let minDays = pickInt(blob, [/min(?:imum)?\s*(?:trading\s*)?days?\s*[:=]?\s*(\d+)/i], 4);
  let consistency = pickPct(blob, [/consistency|best\s*day[^%]{0,20}(\d+(?:\.\d+)?)\s*%/i], null);

  // Firm name heuristics when no rich text
  if (!hasUrl && !hasPaste) {
    if (blob.includes("ftmo") && blob.includes("1")) {
      maxDaily = 3;
      consistency = 50;
      minDays = null;
    }
    if (blob.includes("funding")) {
      risk = 0.5;
      maxDaily = 5;
    }
    if (blob.includes("funded")) {
      target = 0;
    }
  }

  // Demo URL catalog (no real network in prototype)
  if (hasUrl) {
    if (blob.includes("ftmo")) {
      maxDaily = blob.includes("1-step") || blob.includes("1step") ? 3 : 5;
      maxDd = 10;
      target = 10;
      if (blob.includes("1-step") || blob.includes("1step")) consistency = 50;
    } else if (blob.includes("fundingtrader") || blob.includes("funding-trader")) {
      maxDaily = 5;
      maxDd = 10;
      target = 10;
      risk = 0.5;
    } else {
      // generic prop page
      maxDaily = maxDaily || 5;
      maxDd = maxDd || 10;
      target = target || 8;
    }
  }

  if (hasPaste) {
    // paste already drove pickPct; bump confidence
  }

  const phase = normalizePhase(draft.programLabel || draft.challengeName);
  if (phase === "funded") target = target || 0;
  if (phase === "verification" && target >= 10) target = 5;

  const newsRestricted =
    /news/.test(blob) || blob.includes("ftmo") || blob.includes("funding");
  const weekendHold = /weekend/.test(blob) ? !/no weekend|flatten.*weekend/.test(blob) : true;
  const overnightHold = !/no overnight/.test(blob);

  const instruments = extractInstruments(blob) ?? [
    "EURUSD",
    "GBPUSD",
    "USDJPY",
    "XAUUSD",
    "NAS100",
  ];

  const firm =
    draft.firmName.trim() ||
    guessFirm(draft.challengeName, draft.rulesUrl) ||
    "Custom firm";
  const label =
    draft.challengeName.trim() ||
    `${firm} ${draft.programLabel || phase}`.trim();

  const source: IngestedRules["source"] = hasUrl
    ? "url"
    : hasPaste
      ? "paste"
      : draft.challengeName.trim()
        ? "name_heuristic"
        : "defaults";

  const confidence: IngestedRules["confidence"] =
    hasUrl || hasPaste ? "high" : draft.challengeName.trim() ? "medium" : "low";

  const size = draft.accountSize > 0 ? draft.accountSize : 50000;

  const challenge: Omit<Challenge, "id" | "createdAt"> = {
    presetId: "concierge_ingest",
    firm,
    label,
    accountSize: size,
    phase,
    startingBalance: size,
    maxDailyLossPct: maxDaily,
    maxLossPct: maxDd,
    profitTargetPct: target || (phase === "funded" ? 0 : 10),
    minTradingDays: minDays,
    consistencyPct: consistency,
    overnightHold,
    weekendHold,
    newsRestricted,
    allowedInstruments: instruments,
    maxRiskPerTradePct: risk < 0.1 ? 0.5 : risk,
    customNotes: [
      draft.programLabel ? `Program: ${draft.programLabel}` : null,
      draft.rulesUrl ? `Rules URL: ${draft.rulesUrl}` : null,
      draft.rulesPaste ? `Paste: ${draft.rulesPaste.slice(0, 240)}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
    programLabel: draft.programLabel.trim() || phase,
    rulesUrl: draft.rulesUrl.trim() || null,
    rulesSource: source,
  };

  const governance: Governance = {
    ...DEFAULT_GOVERNANCE,
    humanConfirmRequired: true,
    autoLiveDisabled: true,
    midfleetRequired: true,
    paperOnly: true,
    blockOnNews: newsRestricted,
    blockOnDailyBufferBelowR: 1,
    maxRiskOverridePct: null,
  };

  const summary = [
    `Named “${label}” · ${firm} · $${size.toLocaleString()} · ${challenge.programLabel}`,
    `Walls: daily ${maxDaily}% · max DD ${maxDd}% · target ${challenge.profitTargetPct || "—"}% · risk/idea ${challenge.maxRiskPerTradePct}%`,
    newsRestricted
      ? "News restriction ON → governance blocks new risk in news windows"
      : "No firm news lock detected",
    hasUrl
      ? `Concierge read rules from URL (simulated): ${draft.rulesUrl}`
      : hasPaste
        ? "Concierge structured rules from your paste"
        : "No URL/paste — used name + program heuristics; review walls on next step",
  ];

  const run: MidfleetRun = {
    id: runId,
    kind: "prop_rules_ingest",
    status: "completed",
    inputSummary: `${label} · ${draft.rulesUrl || "no url"}`.slice(0, 120),
    outputSummary: `Rules pack · confidence ${confidence} · daily ${maxDaily}% DD ${maxDd}%`,
    startedAt,
    finishedAt: new Date().toISOString(),
  };

  return { result: { challenge, governance, summary, confidence, source }, run };
}

function pickPct(
  text: string,
  patterns: RegExp[],
  fallback: number | null
): number {
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) return Number(m[1]);
  }
  return fallback ?? 0;
}

function pickInt(text: string, patterns: RegExp[], fallback: number | null) {
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) return Number(m[1]);
  }
  return fallback;
}

function extractInstruments(text: string): string[] | null {
  const known = ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "NAS100", "US30", "GER40", "BTCUSD"];
  const found = known.filter((s) => text.toUpperCase().includes(s));
  return found.length ? found : null;
}

function guessFirm(name: string, url: string) {
  const t = `${name} ${url}`.toLowerCase();
  if (t.includes("ftmo")) return "FTMO";
  if (t.includes("funding")) return "FundingTraders";
  if (t.includes("fundednext")) return "FundedNext";
  if (t.includes("thefunded")) return "The Funded Trader";
  if (t.includes("apex")) return "Apex";
  return "";
}

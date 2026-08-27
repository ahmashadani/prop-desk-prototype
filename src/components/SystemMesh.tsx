"use client";

import { money, pct } from "@/lib/compliance";
import { usePropDesk } from "@/lib/store";
import { Check, Circle } from "lucide-react";

/** What the desk looks like when challenge + platform + strategy are all live. */
export function SystemMesh() {
  const {
    challenge,
    platform,
    strategy,
    compliance,
    configured,
    setStep,
    activePositions,
    trades,
  } = usePropDesk();

  if (!challenge) return null;

  const platOk = platform.status === "connected";
  const stratOk = !!strategy;

  return (
    <div className="rounded-xl border border-white/10 bg-[#11110f] overflow-hidden">
      <div className="border-b border-white/10 px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">
          Connected system
        </span>
        <span
          className={
            configured
              ? "text-[10px] font-semibold uppercase tracking-wide text-emerald-400"
              : "text-[10px] font-semibold uppercase tracking-wide text-amber-300"
          }
        >
          {configured ? "Ready to consult" : "Finish setup"}
        </span>
      </div>

      <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
        <MeshCell
          ok={true}
          title="Challenge"
          primary={challenge.label}
          lines={[
            `${challenge.firm} · ${challenge.programLabel}`,
            `$${challenge.accountSize.toLocaleString()} · daily ${pct(challenge.maxDailyLossPct)} · DD ${pct(challenge.maxLossPct)}`,
            compliance
              ? `${compliance.status.toUpperCase()} · target ${pct(compliance.profitProgressPct, 0)}`
              : "",
          ]}
          actionLabel="Rules"
          onAction={() => setStep("rules")}
        />
        <MeshCell
          ok={platOk}
          title="Platform"
          primary={
            platOk
              ? platform.mode === "ctrader"
                ? "cTrader"
                : "MT5"
              : "Not connected"
          }
          lines={
            platOk
              ? [
                  String(platform.externalAccountId),
                  `${platform.environment} · ${platform.healthNote ?? "healthy"}`,
                  `Pos ${platform.capabilities.readPositions ? "✓" : "—"} · Bal ${platform.capabilities.readBalance ? "✓" : "—"} · Auto orders off`,
                ]
              : ["Required for Active + live risk", "Connect cTrader or MT5"]
          }
          actionLabel="Platform"
          onAction={() => setStep("connect")}
        />
        <MeshCell
          ok={stratOk}
          title="Strategy"
          primary={strategy?.name ?? "Not set"}
          lines={
            strategy
              ? [
                  strategy.thesis.slice(0, 90) + (strategy.thesis.length > 90 ? "…" : ""),
                  `${strategy.sessions.join(", ")} · ${strategy.symbols.slice(0, 4).join(", ")}`,
                  `${strategy.prechecks.filter((p) => p.hard).length} hard prechecks`,
                ]
              : ["Template or your playbook", "Gates every ticket"]
          }
          actionLabel="Strategy"
          onAction={() => setStep("strategy")}
        />
      </div>

      {configured && compliance && (
        <div className="border-t border-white/10 px-4 py-2 flex flex-wrap gap-3 text-[11px] text-zinc-500">
          <span>
            Open{" "}
            <button
              type="button"
              onClick={() => setStep("active")}
              className="text-zinc-300 hover:text-zinc-100"
            >
              {activePositions.length}
            </button>
          </span>
          <span>·</span>
          <span>
            Journal{" "}
            <button
              type="button"
              onClick={() => setStep("journal")}
              className="text-zinc-300 hover:text-zinc-100"
            >
              {trades.length}
            </button>
          </span>
          <span>·</span>
          <span>Daily left {money(compliance.dailyLossLeftUsd)}</span>
          <span>·</span>
          <span>Risk budget {money(compliance.riskBudgetUsd)}</span>
          <span className="text-zinc-600">
            · Data: Platform → Desk → Concierge (Midfleet)
          </span>
        </div>
      )}
    </div>
  );
}

function MeshCell({
  ok,
  title,
  primary,
  lines,
  actionLabel,
  onAction,
}: {
  ok: boolean;
  title: string;
  primary: string;
  lines: string[];
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-500">
          {ok ? (
            <Check className="h-3 w-3 text-emerald-400" />
          ) : (
            <Circle className="h-3 w-3 text-amber-400" />
          )}
          {title}
        </div>
        <button
          type="button"
          onClick={onAction}
          className="text-[10px] text-zinc-600 hover:text-zinc-300"
        >
          {actionLabel}
        </button>
      </div>
      <div className="text-sm font-semibold text-zinc-50 truncate">{primary}</div>
      {lines.filter(Boolean).map((l) => (
        <p key={l} className="text-[11px] text-zinc-500 line-clamp-2">
          {l}
        </p>
      ))}
    </div>
  );
}

"use client";

import { money, pct } from "@/lib/compliance";
import { usePropDesk } from "@/lib/store";

export function ComplianceStrip() {
  const { challenge, compliance, platform, newsBlocked, strategy } = usePropDesk();
  if (!challenge || !compliance) return null;

  const bar =
    compliance.status === "clear"
      ? "border-emerald-500/25 bg-emerald-500/10"
      : compliance.status === "caution"
        ? "border-amber-500/25 bg-amber-500/10"
        : "border-red-500/25 bg-red-500/10";

  return (
    <div className={`rounded-xl border p-4 ${bar}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-zinc-400">
            Account health
          </div>
          <div className="mt-0.5 text-sm font-semibold text-zinc-50">
            {challenge.firm} · ${challenge.accountSize.toLocaleString()} ·{" "}
            {challenge.phase}
            {challenge.minTradingDays
              ? ` · day ${compliance.tradingDays}/${challenge.minTradingDays}+`
              : ""}
          </div>
          <p className="mt-1 text-xs text-zinc-400">{compliance.statusReason}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wide">
          <Chip>
            Platform:{" "}
            {platform.status === "connected"
              ? `${platform.mode} ${platform.externalAccountId}`
              : "off"}
          </Chip>
          <Chip>Playbook: {strategy?.name ?? "—"}</Chip>
          <Chip>News: {newsBlocked ? "BLOCKED" : "Clear"}</Chip>
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex justify-between text-[10px] text-zinc-500">
          <span>Profit target</span>
          <span>
            {pct(compliance.profitProgressPct, 0)} · {money(compliance.totalPnl)} /{" "}
            {money(compliance.profitTargetUsd)}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-black/40">
          <div
            className="h-full rounded-full bg-zinc-100 transition-all"
            style={{ width: `${Math.min(100, compliance.profitProgressPct)}%` }}
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label="Equity" value={money(compliance.equity)} />
        <Metric label="Daily left" value={money(compliance.dailyLossLeftUsd)} />
        <Metric label="DD cushion" value={money(compliance.distanceToFloorUsd)} />
        <Metric label="Risk budget" value={money(compliance.riskBudgetUsd)} />
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded border border-white/10 bg-black/25 px-2 py-1 text-zinc-400">
      {children}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 px-2.5 py-2">
      <div className="text-[10px] uppercase text-zinc-600">{label}</div>
      <div className="text-sm font-medium text-zinc-100">{value}</div>
    </div>
  );
}

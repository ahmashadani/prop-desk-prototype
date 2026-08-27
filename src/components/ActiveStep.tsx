"use client";

import { useEffect } from "react";
import { money } from "@/lib/compliance";
import { usePropDesk } from "@/lib/store";
import type { ActivePosition } from "@/lib/types";
import { Loader2, RefreshCw } from "lucide-react";

export function ActiveStep() {
  const {
    challenge,
    platform,
    activePositions,
    syncPositions,
    positionsSyncing,
    lastPositionsSyncNote,
    tickOpenMarks,
    updatePositionWhy,
    closePosition,
    setStep,
  } = usePropDesk();

  useEffect(() => {
    if (activePositions.length === 0) return;
    const t = setInterval(() => tickOpenMarks(), 2200);
    return () => clearInterval(t);
  }, [activePositions.length, tickOpenMarks]);

  if (!challenge) {
    return <p className="text-sm text-zinc-500">Complete setup first.</p>;
  }

  const linked = platform.status === "connected";
  const totalU = activePositions.reduce((s, p) => s + p.unrealizedPnlUsd, 0);
  const platformLabel =
    platform.mode === "ctrader" ? "cTrader" : "MT5";

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
            Active positions
          </p>
          <h1 className="text-xl font-semibold text-zinc-50">
            Live book from {linked ? platformLabel : "platform"}
          </h1>
          <p className="text-sm text-zinc-500">
            {linked
              ? `${platform.externalAccountId} · marks + Concierge why on every row`
              : "Connect platform to ingest opens."}
          </p>
        </div>
        <button
          onClick={() => void syncPositions()}
          disabled={positionsSyncing || !linked}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-zinc-200 disabled:opacity-40"
        >
          {positionsSyncing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Sync platform
        </button>
      </header>

      <div className="grid gap-2 sm:grid-cols-3">
        <Stat label="Open" value={String(activePositions.length)} />
        <Stat
          label="Unrealized"
          value={money(totalU)}
          tone={totalU > 0 ? "up" : totalU < 0 ? "down" : "flat"}
        />
        <Stat
          label="Account"
          value={linked ? String(platform.externalAccountId) : "—"}
        />
      </div>

      {lastPositionsSyncNote && (
        <p className="text-xs text-zinc-500">{lastPositionsSyncNote}</p>
      )}

      {!linked ? (
        <div className="rounded-xl border border-dashed border-white/10 p-8 text-center space-y-3">
          <p className="text-sm text-zinc-500">Platform required to show active trades.</p>
          <button
            onClick={() => setStep("connect")}
            className="h-9 rounded-lg bg-zinc-100 px-3 text-xs font-semibold text-zinc-950"
          >
            Connect platform
          </button>
        </div>
      ) : activePositions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-[#11110f] p-8 text-center space-y-3">
          <p className="text-sm text-zinc-500">
            No opens. Confirm a ticket live, or Sync to pull from {platformLabel}.
          </p>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setStep("desk")}
              className="h-9 rounded-lg bg-zinc-100 px-3 text-xs font-semibold text-zinc-950"
            >
              Concierge
            </button>
            <button
              onClick={() => void syncPositions()}
              className="h-9 rounded-lg border border-white/10 px-3 text-xs text-zinc-300"
            >
              Sync now
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {activePositions.map((p) => (
            <PositionCard
              key={p.id}
              p={p}
              onWhy={(w) => updatePositionWhy(p.id, w)}
              onClose={(r) => closePosition(p.id, r)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PositionCard({
  p,
  onWhy,
  onClose,
}: {
  p: ActivePosition;
  onWhy: (w: string) => void;
  onClose: (r: "win" | "loss" | "be") => void;
}) {
  const up = p.unrealizedPnlUsd >= 0;
  return (
    <article className="rounded-xl border border-white/10 bg-[#11110f] p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold text-zinc-50">{p.symbol}</span>
            <span className="text-xs uppercase text-zinc-400">{p.side}</span>
            <span className="rounded border border-white/10 bg-black/30 px-1.5 py-0.5 text-[10px] uppercase text-zinc-500">
              {p.platform} · {p.platformId}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Entry {p.entry} → mark {p.current}
            {p.stop != null ? ` · SL ${p.stop}` : ""}
            {p.target != null ? ` · TP ${p.target}` : ""}
          </p>
        </div>
        <div className="text-right">
          <div
            className={
              up
                ? "text-lg font-semibold text-emerald-400"
                : "text-lg font-semibold text-red-400"
            }
          >
            {up ? "+" : ""}
            {money(p.unrealizedPnlUsd)}
          </div>
          <div className="text-xs text-zinc-500">
            {p.unrealizedPnlR >= 0 ? "+" : ""}
            {p.unrealizedPnlR.toFixed(2)}R
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-black/25 p-3 space-y-1.5">
        <div className="text-[10px] uppercase tracking-wider text-zinc-500">
          Concierge · why we took this
        </div>
        <textarea
          value={p.conciergeWhy}
          onChange={(e) => onWhy(e.target.value)}
          rows={2}
          className="w-full resize-none rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-zinc-200 focus:border-zinc-400 focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onClose("win")}
          className="h-9 rounded-lg bg-emerald-500/90 px-3 text-xs font-semibold text-zinc-950"
        >
          Close · win
        </button>
        <button
          onClick={() => onClose("loss")}
          className="h-9 rounded-lg border border-red-500/40 bg-red-500/15 px-3 text-xs font-semibold text-red-200"
        >
          Close · loss
        </button>
        <button
          onClick={() => onClose("be")}
          className="h-9 rounded-lg border border-white/10 px-3 text-xs text-zinc-400"
        >
          Close · BE
        </button>
      </div>
    </article>
  );
}

function Stat({
  label,
  value,
  tone = "flat",
}: {
  label: string;
  value: string;
  tone?: "up" | "down" | "flat";
}) {
  const c =
    tone === "up"
      ? "text-emerald-400"
      : tone === "down"
        ? "text-red-400"
        : "text-zinc-100";
  return (
    <div className="rounded-xl border border-white/10 bg-[#11110f] px-3 py-2">
      <div className="text-[10px] uppercase text-zinc-600">{label}</div>
      <div className={`text-sm font-semibold ${c} truncate`}>{value}</div>
    </div>
  );
}

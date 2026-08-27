"use client";

import { money, pct } from "@/lib/compliance";
import { usePropDesk } from "@/lib/store";
import { VerdictCardView } from "./VerdictCardView";
import { Check, X } from "lucide-react";

export function TicketStep() {
  const {
    activeTicket,
    logTrade,
    openPositionFromTicket,
    dismissTicket,
    governance,
    compliance,
    setStep,
    platform,
  } = usePropDesk();

  if (!activeTicket) {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <p className="text-sm text-zinc-500">No open ticket. Ask Concierge to find a trade.</p>
        <button
          onClick={() => setStep("desk")}
          className="inline-flex h-10 items-center rounded-xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-950"
        >
          Back to Concierge
        </button>
      </div>
    );
  }

  const t = activeTicket;
  const breachDaily =
    compliance && t.kind !== "no_trade"
      ? Math.max(0, compliance.dailyLossLeftUsd - t.riskUsd)
      : 0;
  const linked = platform.status === "connected";

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <header className="space-y-1">
        <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Ticket</p>
        <h1 className="text-xl font-semibold text-zinc-50">Confirm before you risk</h1>
        <p className="text-sm text-zinc-500">
          Opens on {linked ? `${platform.mode} ${platform.externalAccountId}` : "platform"} with
          Concierge why attached.
        </p>
      </header>

      <VerdictCardView verdict={t} />

      <div className="rounded-xl border border-white/10 bg-[#11110f] p-4 space-y-3">
        <p className="text-sm text-zinc-300">
          If stop hits: −{money(t.riskUsd)} ({pct(t.riskPct)}). Daily after →{" "}
          {money(breachDaily)}.
        </p>
        <ul className="space-y-1 text-xs text-zinc-400">
          <li className="flex items-center gap-2">
            {governance.humanConfirmRequired ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <X className="h-3.5 w-3.5 text-red-400" />
            )}
            Human confirm
          </li>
          <li className="flex items-center gap-2">
            {linked ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <X className="h-3.5 w-3.5 text-red-400" />
            )}
            Platform linked
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-emerald-400" />
            Why-note rides with Active position
          </li>
        </ul>
      </div>

      <button
        disabled={!linked}
        onClick={openPositionFromTicket}
        className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-zinc-100 text-sm font-semibold text-zinc-950 hover:bg-zinc-300 disabled:opacity-40"
      >
        I took this · open live → Active
      </button>

      <div className="grid gap-2 sm:grid-cols-3">
        <button
          onClick={() => logTrade("win", "Instant close win")}
          className="h-10 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-200"
        >
          Instant · win
        </button>
        <button
          onClick={() => logTrade("loss", "Instant close loss")}
          className="h-10 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-200"
        >
          Instant · loss
        </button>
        <button
          onClick={dismissTicket}
          className="h-10 rounded-xl border border-white/10 text-xs text-zinc-500"
        >
          Skip
        </button>
      </div>
    </div>
  );
}

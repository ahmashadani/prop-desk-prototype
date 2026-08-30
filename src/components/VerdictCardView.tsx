"use client";

import { money, pct } from "@/lib/compliance";
import type { VerdictCard } from "@/lib/types";
import { Check, X } from "lucide-react";

export function VerdictCardView({
  verdict,
  onOpen,
}: {
  verdict: VerdictCard;
  onOpen?: () => void;
}) {
  const tone =
    verdict.kind === "approved"
      ? "border-emerald-500/30 bg-emerald-500/10"
      : verdict.kind === "waitlist"
        ? "border-amber-500/30 bg-amber-500/10"
        : "border-red-500/30 bg-red-500/10";

  const title =
    verdict.kind === "approved"
      ? "APPROVED"
      : verdict.kind === "waitlist"
        ? "WAITLIST"
        : "NO TRADE";

  return (
    <div className={`rounded-xl border p-4 ${tone}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-wide text-zinc-50">
          Verdict: {title}
        </span>
        <span className="text-[10px] text-zinc-500">
          Midfleet · {verdict.midfleetRunId}
        </span>
      </div>

      {verdict.kind !== "no_trade" ? (
        <div className="mt-2 text-sm text-zinc-100">
          <span className="font-semibold">{verdict.symbol}</span>{" "}
          <span className="uppercase text-zinc-400">{verdict.side}</span>
          <span className="text-zinc-500">
            {" "}
            · Risk {pct(verdict.riskPct)} ({money(verdict.riskUsd)}) · R:R 1:
            {verdict.rr}
          </span>
        </div>
      ) : null}

      <p className="mt-2 text-xs text-zinc-400">{verdict.thesis}</p>

      {verdict.kind !== "no_trade" && (
        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
          <Tiny label="Entry" v={String(verdict.entry)} />
          <Tiny label="Stop" v={String(verdict.stop)} />
          <Tiny label="Target" v={String(verdict.target)} />
        </div>
      )}

      <ul className="mt-3 space-y-1">
        {verdict.checks.map((ch) => (
          <li key={ch.id} className="flex items-center gap-2 text-xs text-zinc-400">
            {ch.pass ? (
              <Check aria-hidden="true" className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <X aria-hidden="true" className="h-3.5 w-3.5 text-red-400" />
            )}
            <span>
              {ch.label}
              {ch.detail ? ` · ${ch.detail}` : ""}
            </span>
          </li>
        ))}
      </ul>

      {onOpen && verdict.kind !== "no_trade" && (
        <button
          type="button"
          onClick={onOpen}
          className="mt-3 inline-flex h-9 items-center rounded-lg bg-zinc-100 px-3 text-xs font-semibold text-zinc-950 hover:bg-zinc-300"
        >
          Open ticket →
        </button>
      )}
    </div>
  );
}

function Tiny({ label, v }: { label: string; v: string }) {
  return (
    <div className="rounded border border-white/10 bg-black/25 px-2 py-1.5">
      <div className="text-[10px] uppercase text-zinc-600">{label}</div>
      <div className="font-medium text-zinc-200">{v}</div>
    </div>
  );
}

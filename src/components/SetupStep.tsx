"use client";

import { usePropDesk } from "@/lib/store";
import { ArrowRight, Link2, Loader2, Sparkles } from "lucide-react";

const PROGRAM_CHIPS = [
  "1-step",
  "2-step",
  "Challenge",
  "Verification",
  "Funded",
  "Instant",
];

const EXAMPLE_CHIPS = [
  {
    label: "FTMO 100k 2-step",
    patch: {
      challengeName: "FTMO 2-Step 100k",
      firmName: "FTMO",
      accountSize: 100000,
      programLabel: "2-step challenge",
      rulesUrl: "https://ftmo.com/en/rules/",
      rulesPaste: "",
    },
  },
  {
    label: "FundingTraders 50k",
    patch: {
      challengeName: "FT Pro10 50k",
      firmName: "FundingTraders",
      accountSize: 50000,
      programLabel: "2-step",
      rulesUrl: "https://fundingtraders.com/rules",
      rulesPaste: "",
    },
  },
];

export function SetupStep() {
  const { draft, setDraft, completeSetup, setupBusy } = usePropDesk();

  const canGo =
    (draft.challengeName.trim().length > 0 || draft.firmName.trim().length > 0) &&
    draft.accountSize > 0 &&
    !setupBusy;

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <header className="space-y-1">
        <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
          Step 1 · Concierge intake
        </p>
        <h1 className="text-xl font-semibold text-zinc-50">
          Tell Concierge your challenge
        </h1>
        <p className="text-sm text-zinc-500">
          Name it, size it, say which step you are on. Drop a rules URL if you have one —
          Midfleet structures the walls into governance.
        </p>
      </header>

      <div className="rounded-xl border border-white/10 bg-[#11110f] p-4 space-y-4">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Sparkles className="h-3.5 w-3.5 text-zinc-300" />
          Concierge · Midfleet rules engine
        </div>

        <Field label="What do you call this challenge?">
          <input
            value={draft.challengeName}
            onChange={(e) => setDraft({ challengeName: e.target.value })}
            placeholder="e.g. FTMO 2-Step 100k · my FT Pro10"
            className={inputClass}
            autoFocus
          />
        </Field>

        <Field label="Firm (optional if name is clear)">
          <input
            value={draft.firmName}
            onChange={(e) => setDraft({ firmName: e.target.value })}
            placeholder="FTMO, FundingTraders, FundedNext…"
            className={inputClass}
          />
        </Field>

        <Field label="Account size you are trading">
          <div className="flex flex-wrap items-center gap-2">
            {[10000, 25000, 50000, 100000].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setDraft({ accountSize: s })}
                className={[
                  "h-9 rounded-lg border px-3 text-sm",
                  draft.accountSize === s
                    ? "border-zinc-100 bg-zinc-100 text-zinc-950"
                    : "border-white/10 bg-black/25 text-zinc-400 hover:text-zinc-100",
                ].join(" ")}
              >
                ${(s / 1000).toFixed(0)}k
              </button>
            ))}
            <input
              type="number"
              value={draft.accountSize || ""}
              onChange={(e) => setDraft({ accountSize: Number(e.target.value) || 0 })}
              className="h-9 w-28 rounded-lg border border-white/10 bg-black/25 px-2 text-sm text-zinc-100 focus:border-zinc-400 focus:outline-none"
              placeholder="Custom"
            />
          </div>
        </Field>

        <Field label="Where are you? (1-step, 2-step, funded — anything)">
          <input
            value={draft.programLabel}
            onChange={(e) => setDraft({ programLabel: e.target.value })}
            placeholder="2-step challenge · verification · funded · instant"
            className={inputClass}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PROGRAM_CHIPS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setDraft({ programLabel: c })}
                className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-zinc-400 hover:text-zinc-100"
              >
                {c}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Rules URL (Concierge reads this)">
          <div className="relative">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
            <input
              value={draft.rulesUrl}
              onChange={(e) => setDraft({ rulesUrl: e.target.value })}
              placeholder="https://…/rules  (optional but best)"
              className={`${inputClass} pl-9`}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-zinc-600">
            Prototype simulates the fetch. Production: Midfleet fetches + normalizes into
            structured walls.
          </p>
        </Field>

        <Field label="Or paste rules text">
          <textarea
            value={draft.rulesPaste}
            onChange={(e) => setDraft({ rulesPaste: e.target.value })}
            rows={3}
            placeholder="Daily loss 5%, max DD 10%, profit target 10%, min 4 days, no news…"
            className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none"
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="w-full text-[10px] uppercase tracking-wider text-zinc-600">
          Try an example
        </span>
        {EXAMPLE_CHIPS.map((ex) => (
          <button
            key={ex.label}
            type="button"
            onClick={() => setDraft(ex.patch)}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-100"
          >
            {ex.label}
          </button>
        ))}
      </div>

      <button
        disabled={!canGo}
        onClick={() => void completeSetup()}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 text-sm font-semibold text-zinc-950 hover:bg-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {setupBusy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Concierge reading rules…
          </>
        ) : (
          <>
            Build rules with Concierge
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      <p className="text-center text-[11px] text-zinc-600">
        Next you must connect cTrader or MT5 — required for the live desk.
      </p>
    </div>
  );
}

const inputClass =
  "h-10 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  );
}

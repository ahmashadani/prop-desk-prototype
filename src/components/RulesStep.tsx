"use client";

import { money, pct } from "@/lib/compliance";
import { usePropDesk } from "@/lib/store";
import { ArrowRight } from "lucide-react";

export function RulesStep() {
  const {
    challenge,
    patchChallenge,
    governance,
    setGovernance,
    newsBlocked,
    setNewsBlocked,
    saveRulesAndContinue,
    ingestSummary,
    ingestConfidence,
  } = usePropDesk();

  if (!challenge) {
    return <p className="text-sm text-zinc-500">Complete Concierge intake first.</p>;
  }

  const c = challenge;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-1">
        <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
          Step 3 · Confirm rules
        </p>
        <h1 className="text-xl font-semibold text-zinc-50">
          Concierge built these walls — tweak if needed
        </h1>
        <p className="text-sm text-zinc-500">
          Source: {c.rulesSource}
          {c.rulesUrl ? ` · ${c.rulesUrl}` : ""} · confidence{" "}
          <span className="text-zinc-300">{ingestConfidence ?? "—"}</span>
        </p>
      </header>

      {ingestSummary.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-[#11110f] p-4 space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500">
            Midfleet ingest summary
          </div>
          {ingestSummary.map((line) => (
            <p key={line} className="text-xs text-zinc-400">
              · {line}
            </p>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Challenge walls (editable)">
          <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-300">
            <div className="font-medium text-zinc-100">{c.label}</div>
            <div className="text-xs text-zinc-500">
              {c.firm} · {c.programLabel} · ${c.accountSize.toLocaleString()} · {c.phase}
            </div>
          </div>
          <Field
            label="Max daily loss %"
            value={c.maxDailyLossPct}
            onChange={(n) => patchChallenge({ maxDailyLossPct: n })}
          />
          <Field
            label="Max total DD %"
            value={c.maxLossPct}
            onChange={(n) => patchChallenge({ maxLossPct: n })}
          />
          <Field
            label="Profit target %"
            value={c.profitTargetPct}
            onChange={(n) => patchChallenge({ profitTargetPct: n })}
          />
          <Field
            label="Max risk / trade %"
            value={c.maxRiskPerTradePct}
            step={0.1}
            onChange={(n) => patchChallenge({ maxRiskPerTradePct: n })}
          />
          <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-zinc-400">
            Daily wall {money((c.maxDailyLossPct / 100) * c.startingBalance)} · DD floor{" "}
            {money(c.startingBalance * (1 - c.maxLossPct / 100))} · risk budget{" "}
            {money((c.maxRiskPerTradePct / 100) * c.startingBalance)} (
            {pct(c.maxRiskPerTradePct)})
          </div>
          <Toggle
            label="Overnight holds"
            checked={c.overnightHold}
            onChange={(v) => patchChallenge({ overnightHold: v })}
          />
          <Toggle
            label="Weekend holds"
            checked={c.weekendHold}
            onChange={(v) => patchChallenge({ weekendHold: v })}
          />
          <Toggle
            label="Firm news restriction"
            checked={c.newsRestricted}
            onChange={(v) => patchChallenge({ newsRestricted: v })}
          />
        </Panel>

        <Panel title="Governance gates (auto from Concierge)">
          <Toggle
            label="Human confirm required"
            checked={governance.humanConfirmRequired}
            onChange={(v) => setGovernance({ humanConfirmRequired: v })}
          />
          <Toggle
            label="Auto-live disabled"
            checked={governance.autoLiveDisabled}
            onChange={(v) => setGovernance({ autoLiveDisabled: v })}
          />
          <Toggle
            label="Midfleet decision required"
            checked={governance.midfleetRequired}
            onChange={(v) => setGovernance({ midfleetRequired: v })}
          />
          <Toggle
            label="Paper / supervised only"
            checked={governance.paperOnly}
            onChange={(v) => setGovernance({ paperOnly: v })}
          />
          <Toggle
            label="Block new risk on news window"
            checked={governance.blockOnNews}
            onChange={(v) => setGovernance({ blockOnNews: v })}
          />
          <Field
            label="Caution if daily buffer < N × R"
            value={governance.blockOnDailyBufferBelowR}
            step={0.5}
            onChange={(n) => setGovernance({ blockOnDailyBufferBelowR: n })}
          />
          <div className="mt-2 rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="text-[10px] uppercase text-zinc-500">Session simulator</div>
            <Toggle
              label="News window active NOW"
              checked={newsBlocked}
              onChange={setNewsBlocked}
            />
          </div>
        </Panel>
      </div>

      <Panel title="Allowed instruments">
        <div className="flex flex-wrap gap-1.5">
          {c.allowedInstruments.map((s) => (
            <span
              key={s}
              className="rounded-lg border border-white/10 bg-black/25 px-2.5 py-1 text-xs text-zinc-300"
            >
              {s}
            </span>
          ))}
        </div>
      </Panel>

      <button
        onClick={saveRulesAndContinue}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 text-sm font-semibold text-zinc-950 hover:bg-zinc-300"
      >
        Looks good · pick strategy
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-white/10 bg-[#11110f] p-4">
      <h2 className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span className="text-zinc-400">{label}</span>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-9 w-24 rounded-lg border border-white/10 bg-black/30 px-2 text-right text-zinc-100 focus:border-zinc-400 focus:outline-none"
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-left text-sm"
    >
      <span className="text-zinc-300">{label}</span>
      <span
        className={[
          "relative h-5 w-9 rounded-full transition-colors",
          checked ? "bg-emerald-500/80" : "bg-zinc-700",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all",
            checked ? "left-4" : "left-0.5",
          ].join(" ")}
        />
      </span>
    </button>
  );
}

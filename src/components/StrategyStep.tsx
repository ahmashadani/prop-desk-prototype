"use client";

import { useState } from "react";
import { STRATEGY_TEMPLATES } from "@/lib/presets";
import { usePropDesk } from "@/lib/store";
import { ArrowRight } from "lucide-react";

export function StrategyStep() {
  const {
    strategy,
    setStrategyFromTemplate,
    setStrategyCustom,
    saveStrategyAndOpenDesk,
  } = usePropDesk();
  const [custom, setCustom] = useState("");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-1">
        <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
          Step 4 · Strategy
        </p>
        <h1 className="text-xl font-semibold text-zinc-50">
          What should Concierge hunt?
        </h1>
        <p className="text-sm text-zinc-500">
          Template or your words. Hard prechecks gate every ticket with firm walls.
        </p>
      </header>

      <div className="grid gap-2">
        {STRATEGY_TEMPLATES.map((t) => {
          const on = strategy?.source === "template" && strategy.name === t.name;
          return (
            <button
              aria-pressed={on}
              key={t.id}
              type="button"
              onClick={() => setStrategyFromTemplate(t.id)}
              className={[
                "rounded-xl border p-4 text-left transition-colors",
                on
                  ? "border-zinc-100 bg-zinc-100 text-zinc-950"
                  : "border-white/10 bg-[#11110f] hover:border-white/20",
              ].join(" ")}
            >
              <div className="text-sm font-semibold">{t.name}</div>
              <p className={`mt-1 text-xs ${on ? "text-zinc-600" : "text-zinc-500"}`}>
                {t.thesis}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {t.symbols.map((s) => (
                  <span
                    key={s}
                    className={[
                      "rounded px-1.5 py-0.5 text-[10px]",
                      on ? "bg-zinc-900/10 text-zinc-700" : "bg-black/30 text-zinc-500",
                    ].join(" ")}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-white/10 bg-[#11110f] p-4 space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-zinc-500">
          Or describe yours
        </div>
        <textarea
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          rows={3}
          placeholder="e.g. Only EUR/GBP London breakout after Asia range, 1:2, no US news…"
          className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none"
        />
        <button
          onClick={() => setStrategyCustom(custom)}
          disabled={!custom.trim()}
          className="h-9 rounded-lg border border-white/10 px-3 text-xs text-zinc-300 hover:text-zinc-100 disabled:opacity-40"
        >
          Save as my playbook
        </button>
      </div>

      {strategy && (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-zinc-200 space-y-2">
          <div className="font-semibold text-zinc-50">Selected: {strategy.name}</div>
          <p className="text-xs text-zinc-400">{strategy.thesis}</p>
          <div className="text-[10px] uppercase text-zinc-500">Hard prechecks</div>
          <ul className="text-xs text-zinc-400 space-y-0.5">
            {strategy.prechecks
              .filter((p) => p.hard)
              .map((p) => (
                <li key={p.id}>· {p.label}</li>
              ))}
          </ul>
          <div className="text-[10px] uppercase text-zinc-500 pt-1">Indicators</div>
          <ul className="text-xs text-zinc-400 space-y-0.5">
            {strategy.indicators.map((i) => (
              <li key={i.id}>
                · {i.label} — {i.role}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        disabled={!strategy}
        onClick={saveStrategyAndOpenDesk}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 text-sm font-semibold text-zinc-950 hover:bg-zinc-300 disabled:opacity-40"
      >
        Open Concierge desk
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

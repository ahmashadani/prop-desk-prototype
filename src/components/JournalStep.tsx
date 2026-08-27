"use client";

import { money } from "@/lib/compliance";
import { usePropDesk } from "@/lib/store";
import { ComplianceStrip } from "./ComplianceStrip";

export function JournalStep() {
  const { trades, setStep, compliance } = usePropDesk();

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
          Step 6 · Journal & compliance
        </p>
        <h1 className="text-xl font-semibold text-zinc-50">Logged trades</h1>
        <p className="text-sm text-zinc-500">
          Outcomes update daily loss, DD cushion, and profit target progress.
        </p>
      </header>

      <ComplianceStrip />

      {trades.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-[#11110f] p-8 text-center">
          <p className="text-sm text-zinc-500">
            No trades yet. Run Midfleet on the desk, open a ticket, or ingest a fill.
          </p>
          <button
            onClick={() => setStep("desk")}
            className="mt-4 inline-flex h-10 items-center rounded-xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-950"
          >
            Back to desk
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#11110f] text-[10px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-3 py-2 font-medium">When</th>
                  <th className="px-3 py-2 font-medium">Symbol</th>
                  <th className="px-3 py-2 font-medium">Side</th>
                  <th className="px-3 py-2 font-medium">Result</th>
                  <th className="px-3 py-2 font-medium">R</th>
                  <th className="px-3 py-2 font-medium">P&L</th>
                  <th className="px-3 py-2 font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => (
                  <tr key={t.id} className="border-t border-white/10 bg-black/20">
                    <td className="px-3 py-2 text-xs text-zinc-500">
                      {new Date(t.loggedAt).toLocaleTimeString()}
                    </td>
                    <td className="px-3 py-2 font-medium text-zinc-100">{t.symbol}</td>
                    <td className="px-3 py-2 uppercase text-zinc-400">{t.side}</td>
                    <td className="px-3 py-2 text-zinc-300">{t.result}</td>
                    <td
                      className={
                        t.pnlR > 0
                          ? "px-3 py-2 text-emerald-400"
                          : t.pnlR < 0
                            ? "px-3 py-2 text-red-400"
                            : "px-3 py-2 text-zinc-400"
                      }
                    >
                      {t.pnlR > 0 ? "+" : ""}
                      {t.pnlR.toFixed(1)}R
                    </td>
                    <td
                      className={
                        t.pnlUsd > 0
                          ? "px-3 py-2 text-emerald-400"
                          : t.pnlUsd < 0
                            ? "px-3 py-2 text-red-400"
                            : "px-3 py-2 text-zinc-400"
                      }
                    >
                      {money(t.pnlUsd)}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-zinc-500">
                      {t.midfleetRunId === "manual_ingest" ? "ingest" : "ticket"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {compliance && (
            <div className="rounded-xl border border-white/10 bg-[#11110f] p-4 text-sm text-zinc-400">
              After last log: equity {money(compliance.equity)} · target{" "}
              {compliance.profitProgressPct.toFixed(0)}% · status{" "}
              <span className="text-zinc-100 uppercase">{compliance.status}</span>
            </div>
          )}

          <button
            onClick={() => setStep("desk")}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-zinc-100 text-sm font-semibold text-zinc-950 hover:bg-zinc-300 sm:w-auto sm:px-6"
          >
            Back to desk · find next trade
          </button>
        </>
      )}
    </div>
  );
}

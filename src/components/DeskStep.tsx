"use client";

import { useState } from "react";
import { ComplianceStrip } from "./ComplianceStrip";
import { SystemMesh } from "./SystemMesh";
import { VerdictCardView } from "./VerdictCardView";
import { usePropDesk } from "@/lib/store";
import { Loader2, Send } from "lucide-react";

const CHIPS = [
  "Find a trade for me",
  "Market climate now",
  "How are my open trades?",
  "Explain my challenge rules",
  "Review my strategy",
  "Analyze my journal",
  "Why am I blocked?",
];

export function DeskStep() {
  const {
    challenge,
    messages,
    verdicts,
    sendAgent,
    agentBusy,
    openTicket,
    setStep,
    activeTicket,
    activePositions,
    configured,
    platform,
    strategy,
  } = usePropDesk();
  const [input, setInput] = useState("");

  if (!challenge) {
    return <p className="text-sm text-zinc-500">Complete challenge intake first.</p>;
  }

  if (!configured) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <SystemMesh />
        <p className="text-sm text-zinc-500 text-center">
          Finish platform + strategy to unlock Concierge.
        </p>
        <div className="flex justify-center gap-2">
          {platform.status !== "connected" && (
            <button
              onClick={() => setStep("connect")}
              className="h-10 rounded-xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-950"
            >
              Connect platform
            </button>
          )}
          {!strategy && platform.status === "connected" && (
            <button
              onClick={() => setStep("strategy")}
              className="h-10 rounded-xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-950"
            >
              Pick strategy
            </button>
          )}
        </div>
      </div>
    );
  }

  const onSend = async (text: string) => {
    const t = text.trim();
    if (!t) return;
    setInput("");
    await sendAgent(t);
  };

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
          Concierge desk
        </p>
        <h1 className="text-xl font-semibold text-zinc-50">
          Ask anything on this book
        </h1>
        <p className="text-sm text-zinc-500">
          Trades, climate, strategy, firm rules, journal — one agent, full context.
        </p>
      </header>

      <SystemMesh />
      <ComplianceStrip />

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <section className="flex min-h-[440px] flex-col rounded-xl border border-white/10 bg-[#11110f]">
          <div className="border-b border-white/10 px-4 py-2 text-[10px] uppercase tracking-wider text-zinc-500">
            Concierge · Midfleet · {platform.mode} {platform.externalAccountId} ·{" "}
            {strategy?.name}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m) => {
              const verdict = m.verdictId
                ? verdicts.find((v) => v.id === m.verdictId)
                : null;
              return (
                <div key={m.id} className="space-y-2">
                  <div
                    className={[
                      "max-w-[95%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap",
                      m.role === "user"
                        ? "ml-auto bg-zinc-100 text-zinc-950"
                        : m.role === "system"
                          ? "border border-white/10 bg-black/30 text-zinc-400"
                          : "border border-white/10 bg-black/25 text-zinc-200",
                    ].join(" ")}
                  >
                    {m.role !== "user" && (
                      <div className="mb-1 text-[10px] uppercase text-zinc-500">
                        {m.role === "agent" ? "Concierge" : "System"}
                      </div>
                    )}
                    {m.text}
                  </div>
                  {verdict && (
                    <VerdictCardView
                      verdict={verdict}
                      onOpen={() => openTicket(verdict.id)}
                    />
                  )}
                </div>
              );
            })}
            {agentBusy && (
              <div className="flex items-center gap-2 text-xs text-zinc-500 animate-pulse-soft">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Concierge reading rules · platform · strategy · journal…
              </div>
            )}
          </div>

          <div className="border-t border-white/10 p-3 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {CHIPS.map((c) => (
                <button
                  key={c}
                  disabled={agentBusy}
                  onClick={() => onSend(c)}
                  className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-[11px] text-zinc-400 hover:text-zinc-100 disabled:opacity-50"
                >
                  {c}
                </button>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                onSend(input);
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about a trade, find setups, rules, strategy, journal…"
                className="h-10 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={agentBusy || !input.trim()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-950 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </section>

        <aside className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-[#11110f] p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                Active
              </span>
              <button
                onClick={() => setStep("active")}
                className="text-[10px] text-zinc-400 hover:text-zinc-100"
              >
                Open →
              </button>
            </div>
            {activePositions.length === 0 ? (
              <p className="mt-2 text-xs text-zinc-600">None open. Find a trade or Sync.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {activePositions.slice(0, 4).map((p) => (
                  <li
                    key={p.id}
                    className="rounded-lg border border-white/10 bg-black/25 px-2 py-1.5 text-xs"
                  >
                    <div className="flex justify-between">
                      <span className="text-zinc-200">
                        {p.symbol} {p.side}
                      </span>
                      <span
                        className={
                          p.unrealizedPnlUsd >= 0 ? "text-emerald-400" : "text-red-400"
                        }
                      >
                        {p.unrealizedPnlR >= 0 ? "+" : ""}
                        {p.unrealizedPnlR.toFixed(1)}R
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-zinc-500">
                      {p.conciergeWhy}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {activeTicket?.status === "open" && (
            <button
              onClick={() => setStep("ticket")}
              className="h-10 w-full rounded-xl bg-zinc-100 text-xs font-semibold text-zinc-950"
            >
              Open ticket →
            </button>
          )}

          <div className="rounded-xl border border-white/10 bg-[#11110f] p-3 text-[11px] text-zinc-500 space-y-1">
            <div className="text-[10px] uppercase tracking-wider">You can ask</div>
            <p>· Any open or journaled trade</p>
            <p>· Find new setups (playbook-bound)</p>
            <p>· Firm walls & governance</p>
            <p>· Strategy prechecks & indicators</p>
            <p>· Journal what to improve</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

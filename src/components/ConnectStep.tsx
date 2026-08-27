"use client";

import { usePropDesk } from "@/lib/store";
import type { ConnectionMode } from "@/lib/types";
import { ArrowRight, Cable, Check, Loader2, MonitorSmartphone } from "lucide-react";

const OPTIONS: {
  id: ConnectionMode;
  title: string;
  blurb: string;
  icon: typeof Cable;
  wires: string[];
}[] = [
  {
    id: "ctrader",
    title: "cTrader",
    blurb: "OAuth → Open API. Balance, positions, history into Prop Desk.",
    icon: Cable,
    wires: [
      "Token vault (encrypted)",
      "Account id bound to this challenge",
      "Positions stream → Active",
      "Concierge reads live risk context",
    ],
  },
  {
    id: "mt5",
    title: "MT5 / TradeLocker",
    blurb: "Bridge account. Deals + opens sync for journal and Active.",
    icon: MonitorSmartphone,
    wires: [
      "Account binding to challenge",
      "Open positions → Active",
      "Closed deals → Journal",
      "Concierge consults same book",
    ],
  },
];

export function ConnectStep() {
  const {
    challenge,
    platform,
    connectToPlatform,
    connectBusy,
    setStep,
  } = usePropDesk();

  const linked = platform.status === "connected";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-1">
        <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
          Step 2 · Platform (required)
        </p>
        <h1 className="text-xl font-semibold text-zinc-50">
          Connect the account you trade the challenge on
        </h1>
        <p className="text-sm text-zinc-500">
          Not optional. Concierge, Active, and risk gates need a live platform link.
        </p>
      </header>

      <div className="rounded-xl border border-white/10 bg-[#11110f] p-4">
        <div className="text-[10px] uppercase tracking-wider text-zinc-500">
          How it connects
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-300">
          <Node>Challenge</Node>
          <Arrow />
          <Node>Platform API</Node>
          <Arrow />
          <Node>Prop Desk</Node>
          <Arrow />
          <Node>Concierge</Node>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          {challenge
            ? `Binding target: “${challenge.label}” · $${challenge.accountSize.toLocaleString()}`
            : "Load a challenge first."}
          {" · "}
          Orders stay <strong className="text-zinc-300">human-confirmed</strong> (no
          silent auto-live in this build).
        </p>
      </div>

      <div className="grid gap-3">
        {OPTIONS.map((o) => {
          const on = platform.mode === o.id && linked;
          const Icon = o.icon;
          return (
            <div
              key={o.id}
              className={[
                "rounded-xl border p-4 transition-colors",
                on
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : "border-white/10 bg-[#11110f]",
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                <div
                  className={[
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                    on ? "bg-emerald-500/20 text-emerald-300" : "bg-black/30 text-zinc-300",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-50">{o.title}</span>
                    {on && (
                      <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase text-emerald-300 bg-emerald-500/15">
                        <Check className="h-3 w-3" /> Connected
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{o.blurb}</p>
                  <ul className="mt-2 space-y-1">
                    {o.wires.map((w) => (
                      <li key={w} className="text-[11px] text-zinc-500">
                        · {w}
                      </li>
                    ))}
                  </ul>
                  {on && platform.externalAccountId && (
                    <p className="mt-2 text-xs text-emerald-200/90">
                      Account {platform.externalAccountId} · {platform.environment} ·{" "}
                      {platform.healthNote}
                    </p>
                  )}
                  <button
                    disabled={connectBusy || !challenge}
                    onClick={() => void connectToPlatform(o.id)}
                    className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-zinc-100 px-3 text-xs font-semibold text-zinc-950 hover:bg-zinc-300 disabled:opacity-40"
                  >
                    {connectBusy && platform.mode === o.id ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Connecting…
                      </>
                    ) : on ? (
                      "Reconnect"
                    ) : (
                      `Connect ${o.title}`
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        disabled={!linked}
        onClick={() => setStep("rules")}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 text-sm font-semibold text-zinc-950 hover:bg-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Platform linked · confirm rules
        <ArrowRight className="h-4 w-4" />
      </button>
      {!linked && (
        <p className="text-center text-[11px] text-zinc-600">
          Choose cTrader or MT5 and connect before continuing.
        </p>
      )}
    </div>
  );
}

function Node({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 font-medium text-zinc-200">
      {children}
    </span>
  );
}

function Arrow() {
  return <span className="text-zinc-600">→</span>;
}

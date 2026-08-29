"use client";

import { STEPS } from "@/lib/presets";
import { usePropDesk } from "@/lib/store";
import type { StepId } from "@/lib/types";
import {
  BarChart3,
  Bot,
  LayoutDashboard,
  LineChart,
  PlugZap,
  RotateCcw,
  Shield,
  ShieldCheck,
  Telescope,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const TOS_NAV = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Market Lens", icon: Telescope },
  { name: "Charts", icon: BarChart3 },
  { name: "Concierge", icon: Bot },
  { name: "Prop Desk", icon: ShieldCheck, active: true },
  { name: "Trade Desk", icon: Shield },
  { name: "Execution", icon: Zap },
  { name: "Connections", icon: PlugZap },
  { name: "Trades", icon: LineChart },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const {
    step,
    setStep,
    unlocked,
    challenge,
    resetAll,
    loadDemo,
    compliance,
    activePositions,
    platform,
    strategy,
    configured,
    isDemo,
  } = usePropDesk();
  const [view, setView] = useState<"prop" | "tos">("prop");
  const [resetConfirmationOpen, setResetConfirmationOpen] = useState(false);
  const resetButtonRef = useRef<HTMLButtonElement>(null);
  const cancelResetRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!resetConfirmationOpen) return;

    cancelResetRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setResetConfirmationOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [resetConfirmationOpen]);

  const closeResetConfirmation = () => {
    setResetConfirmationOpen(false);
    requestAnimationFrame(() => resetButtonRef.current?.focus());
  };

  const confirmReset = () => {
    resetAll();
    closeResetConfirmation();
  };

  return (
    <div className="min-h-screen bg-[#0b0b0a] text-zinc-100 lg:pl-64">
      {/* Trading OS sidebar (visual fit) */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r border-white/10 bg-[#090907] lg:block">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-950">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-50">Trading OS</div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                Execution Desk
              </div>
            </div>
          </div>
        </div>
        <nav className="space-y-1 px-3 py-4">
          {TOS_NAV.map((item) => {
            const Icon = item.icon;
            const isProp = item.active;
            return (
              <div
                key={item.name}
                className={[
                  "flex h-10 items-center gap-3 rounded-lg px-3 text-sm",
                  isProp
                    ? "bg-zinc-100 text-zinc-950"
                    : "cursor-default text-zinc-600",
                ].join(" ")}
                title={isProp ? "You are here" : "Visual only · lives in full Trading OS"}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.name}</span>
                {!isProp && (
                  <span className="ml-auto text-[9px] uppercase tracking-wide text-zinc-700">
                    TOS
                  </span>
                )}
              </div>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-4">
          <p className="text-[10px] leading-relaxed text-zinc-600">
            Visual prototype · no auth · no live orders · Midfleet mocked
          </p>
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090907]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0 lg:hidden">
            <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              Trading OS · Prototype
            </div>
            <div className="truncate text-sm font-semibold text-zinc-50">Prop Firm Desk</div>
          </div>
          <div className="hidden min-w-0 lg:block">
            <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              Active surface
            </div>
            <div className="text-sm font-semibold text-zinc-50">
              Prop Firm Desk
              <span className="ml-2 font-normal text-zinc-500">
                · challenge rules first
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/30 p-1">
            <button
              type="button"
              onClick={() => setView("prop")}
              className={[
                "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                view === "prop"
                  ? "bg-zinc-100 text-zinc-950"
                  : "text-zinc-500 hover:text-zinc-200",
              ].join(" ")}
            >
              Prop Desk
            </button>
            <button
              type="button"
              onClick={() => setView("tos")}
              className={[
                "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                view === "tos"
                  ? "bg-zinc-100 text-zinc-950"
                  : "text-zinc-500 hover:text-zinc-200",
              ].join(" ")}
            >
              Trading OS
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isDemo && (
              <span className="hidden sm:inline-flex h-9 items-center rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                Demo data
              </span>
            )}
            {compliance && <StatusPill status={compliance.status} />}
            <button
              onClick={loadDemo}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs text-zinc-400 hover:text-zinc-100"
              title="Reload full mock desk"
            >
              Demo
            </button>
            <button
              ref={resetButtonRef}
              type="button"
              onClick={() => setResetConfirmationOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs text-zinc-400 hover:text-zinc-100"
              title="Empty setup from scratch"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {view === "prop" && (
          <div className="mx-auto max-w-6xl px-4 pb-3">
            <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
{STEPS.map((s) => {
              const active = step === s.id;
              const can = unlocked[s.id] || s.id === "setup";
              const badge =
                s.id === "active" && activePositions.length > 0
                  ? activePositions.length
                  : null;
              return (
                <button
                  key={s.id}
                  disabled={!can}
                  onClick={() => can && setStep(s.id as StepId)}
                  className={[
                    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors",
                    active
                      ? "border-white/10 bg-zinc-100 text-zinc-950"
                      : can
                        ? "border-white/10 bg-white/[0.03] text-zinc-400 hover:text-zinc-100"
                        : "border-white/5 bg-transparent text-zinc-700 cursor-not-allowed",
                  ].join(" ")}
                >
                  {s.label}
                  {badge != null && (
                    <span
                      className={
                        active
                          ? "rounded-full bg-zinc-900 px-1.5 text-[10px] text-zinc-50"
                          : "rounded-full bg-emerald-500/20 px-1.5 text-[10px] text-emerald-300"
                      }
                    >
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
            </div>
            {challenge && (
              <p className="mt-2 truncate text-xs text-zinc-500">
                {challenge.label}
                {platform.status === "connected"
                  ? ` · ${platform.mode} ${platform.externalAccountId}`
                  : " · platform off"}
                {strategy ? ` · ${strategy.name}` : " · no strategy"}
                {configured ? " · ready" : ""}
              </p>
            )}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {view === "tos" ? <TradingOsPlaceholder onBack={() => setView("prop")} /> : children}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 text-center text-[11px] text-zinc-600">
        Supervised execution · Midfleet decision engine · No hidden auto-live · Maps to
        TradeAccount + Concierge + Trade Desk in therajushahi/trading-os
      </footer>

      {resetConfirmationOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-confirmation-title"
            aria-describedby="reset-confirmation-description"
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#11110f] p-6 shadow-2xl"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300">
              Destructive action
            </p>
            <h2 id="reset-confirmation-title" className="mt-2 text-lg font-semibold text-zinc-50">
              Reset this desk?
            </h2>
            <p id="reset-confirmation-description" className="mt-2 text-sm leading-relaxed text-zinc-400">
              This clears your desk setup, challenge, connection, strategy, governance settings,
              and all trading and journal data. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                ref={cancelResetRef}
                type="button"
                onClick={closeResetConfirmation}
                className="inline-flex h-10 items-center rounded-xl border border-white/10 px-4 text-sm font-medium text-zinc-300 hover:text-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmReset}
                className="inline-flex h-10 items-center rounded-xl bg-red-500 px-4 text-sm font-semibold text-white hover:bg-red-400"
              >
                Reset desk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TradingOsPlaceholder({ onBack }: { onBack: () => void }) {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="rounded-2xl border border-white/10 bg-[#11110f] p-6">
        <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
          View switch · visual only
        </p>
        <h2 className="mt-2 text-xl font-semibold text-zinc-50">Trading OS cockpit</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Same backend later: Market Lens, Concierge, Connections, Trades. Prop traders
          stay on Prop Desk — “Can I take this without breaking my challenge?” — instead of
          configuring the full platform.
        </p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {[
            "Market Lens briefing",
            "Concierge Midfleet chat",
            "cTrader / Connections",
            "Trade journal /traderoutes",
          ].map((label) => (
            <div
              key={label}
              className="rounded-xl border border-dashed border-white/10 bg-black/25 px-3 py-3 text-xs text-zinc-500"
            >
              {label}
              <div className="mt-1 text-[10px] uppercase tracking-wide text-zinc-600">
                Lives in full app
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onBack}
          className="mt-6 inline-flex h-10 items-center rounded-xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-950"
        >
          ← Back to Prop Firm Desk
        </button>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: "clear" | "caution" | "blocked" }) {
  const map = {
    clear: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    caution: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    blocked: "bg-red-500/15 text-red-300 border-red-500/30",
  };
  const label = {
    clear: "CLEAR",
    caution: "CAUTION",
    blocked: "BLOCKED",
  };
  return (
    <span
      className={`inline-flex h-9 items-center rounded-lg border px-2.5 text-[10px] font-semibold tracking-wide ${map[status]}`}
    >
      {label[status]}
    </span>
  );
}

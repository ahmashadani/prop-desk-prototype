"use client";

import { Shell } from "@/components/Shell";
import { SetupStep } from "@/components/SetupStep";
import { ConnectStep } from "@/components/ConnectStep";
import { RulesStep } from "@/components/RulesStep";
import { StrategyStep } from "@/components/StrategyStep";
import { DeskStep } from "@/components/DeskStep";
import { TicketStep } from "@/components/TicketStep";
import { ActiveStep } from "@/components/ActiveStep";
import { JournalStep } from "@/components/JournalStep";
import { usePropDesk } from "@/lib/store";

export default function Page() {
  const { step } = usePropDesk();

  return (
    <Shell>
      {step === "setup" && <SetupStep />}
      {step === "connect" && <ConnectStep />}
      {step === "rules" && <RulesStep />}
      {step === "strategy" && <StrategyStep />}
      {step === "desk" && <DeskStep />}
      {step === "ticket" && <TicketStep />}
      {step === "active" && <ActiveStep />}
      {step === "journal" && <JournalStep />}
    </Shell>
  );
}

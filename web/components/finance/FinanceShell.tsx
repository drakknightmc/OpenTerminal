"use client";

import { useTerminal } from "../../store/terminal";
import Rail from "./Rail";
import FinanceTopBar from "./FinanceTopBar";
import AgentConsole from "./AgentConsole";

export default function FinanceShell({ children }: { children: React.ReactNode }) {
  const agentOpen = useTerminal((s) => s.financeAgentOpen);

  return (
    <div
      className="nocturne"
      style={{
        display: "flex", height: "100vh", minHeight: 640,
        background: "var(--color-bg)", color: "var(--color-text)",
        fontFamily: "var(--font-body)", overflow: "hidden",
      }}
    >
      <Rail />
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <FinanceTopBar />
        <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
          <div style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>{children}</div>
          {agentOpen && <AgentConsole />}
        </div>
      </main>
    </div>
  );
}

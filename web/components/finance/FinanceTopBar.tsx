"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTerminal } from "../../store/terminal";
import { pageMeta } from "../../lib/finance/route";
import { FX } from "../../lib/finance/rows";

export default function FinanceTopBar() {
  const pathname = usePathname();
  const [title, sub] = pageMeta(pathname);
  const agentOpen = useTerminal((s) => s.financeAgentOpen);
  const toggleFinanceAgent = useTerminal((s) => s.toggleFinanceAgent);

  return (
    <header
      style={{
        flex: "none", display: "flex", alignItems: "center", gap: 14, height: 44, padding: "0 16px",
        background: "#1a1c2b", boxShadow: "inset 0 -1px 0 rgba(233,233,237,0.10)",
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 500, flex: "none", whiteSpace: "nowrap" }}>{title}</span>
      <span style={{ fontSize: 11, color: "var(--color-neutral-600)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 20 }}>
        {sub}
      </span>
      <button
        type="button"
        style={{
          flex: "1 1 auto", minWidth: 0, maxWidth: 320, height: 28, display: "flex", alignItems: "center", gap: 8,
          background: "var(--color-surface)", border: "1px solid rgba(233,233,237,0.12)", borderRadius: 8,
          padding: "0 9px", color: "var(--color-neutral-600)", font: "inherit", fontSize: "11.5px",
          cursor: "pointer", overflow: "hidden",
        }}
      >
        <span style={{ flex: 1, minWidth: 0, textAlign: "left", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          Search holdings, merchants, statements…
        </span>
        <span style={{ flex: "none", fontFamily: "var(--font-mono)", fontSize: 10 }}>⌘K</span>
      </button>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14, fontSize: 11, color: "var(--color-neutral-600)", flex: "none", whiteSpace: "nowrap" }}>
        <span>base <span style={{ color: "var(--color-text)", fontFamily: "var(--font-mono)" }}>INR</span></span>
        <span>fx <span style={{ color: "var(--color-text)", fontFamily: "var(--font-mono)" }}>{FX.toFixed(2)}</span></span>
        <span style={{ color: "var(--color-gain)" }}>NSE ●</span>
        <span style={{ color: "var(--color-neutral-600)" }}>NYSE ○</span>
      </div>
      <Link
        href="/inbox"
        className="btn btn-secondary"
        style={{ height: 27, fontSize: "11.5px", padding: "0 10px", gap: 7, flex: "none", whiteSpace: "nowrap", textDecoration: "none" }}
      >
        Review
        <span style={{ background: "var(--color-accent)", color: "var(--color-bg)", borderRadius: 20, padding: "0 6px", fontSize: 10, fontWeight: 600, fontFamily: "var(--font-mono)" }}>
          7
        </span>
      </Link>
      <button
        type="button"
        onClick={toggleFinanceAgent}
        className={agentOpen ? "btn btn-primary" : "btn btn-secondary"}
        style={{ height: 27, fontSize: "11.5px", padding: "0 10px", flex: "none" }}
      >
        Agent
      </button>
    </header>
  );
}

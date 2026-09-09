"use client";

import { usePathname } from "next/navigation";
import { useTerminal } from "../../store/terminal";
import { pageMeta } from "../../lib/finance/route";

export default function AgentConsole() {
  const pathname = usePathname();
  const [title, sub] = pageMeta(pathname);
  const toggleFinanceAgent = useTerminal((s) => s.toggleFinanceAgent);

  return (
    <aside
      style={{
        width: 296, flex: "none", display: "flex", flexDirection: "column",
        background: "#1a1c2b", boxShadow: "inset 1px 0 0 rgba(233,233,237,0.10)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 13px 9px", boxShadow: "inset 0 -1px 0 rgba(233,233,237,0.08)" }}>
        <h6 style={{ margin: 0, flex: 1, color: "var(--color-neutral-400)" }}>Agent</h6>
        <span style={{ fontSize: 10, color: "var(--color-neutral-700)" }}>sees this page</span>
        <button
          type="button"
          onClick={toggleFinanceAgent}
          style={{ border: 0, background: "transparent", color: "var(--color-neutral-600)", cursor: "pointer", fontSize: 14, lineHeight: 1 }}
        >
          ×
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "11px 13px", display: "flex", flexDirection: "column", gap: 11, fontSize: 12, lineHeight: 1.5 }}>
        <div style={{ color: "var(--color-neutral-600)" }}>
          Context: {title}{sub ? " · " + sub : ""}
        </div>
        <div style={{ alignSelf: "flex-end", background: "#292b31", borderRadius: "8px 8px 2px 8px", padding: "7px 9px", maxWidth: "88%" }}>
          If I trim NVDA to 3% of net worth, what&apos;s the tax hit?
        </div>
        <div style={{ background: "var(--color-surface)", borderRadius: "8px 8px 8px 2px", padding: "8px 9px" }}>
          Selling 11 shares takes the position to 3.0%. Cheapest lots by tax: the Mar-2026 lot is short-term. Using the
          Aug-2024 long-term lots instead gives{" "}
          <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-text)" }}>₹1,04,300</span> LTCG and about{" "}
          <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-loss)" }}>₹20,860</span> tax at 20%.
        </div>
        <div
          style={{
            display: "flex", flexDirection: "column", gap: 5, padding: "8px 9px",
            background: "rgba(145,132,217,0.10)", borderRadius: 8, boxShadow: "0 0 0 1px rgba(145,132,217,0.35)",
          }}
        >
          <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-accent-400)" }}>
            Proposed write
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "11.5px" }}>draft_order · SELL 11 NVDA @ market · lots FIFO-LT</div>
          <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
            <button type="button" className="btn btn-primary" style={{ height: 24, fontSize: 11, padding: "0 10px" }}>
              Send to review
            </button>
            <button type="button" className="btn btn-secondary" style={{ height: 24, fontSize: 11, padding: "0 10px" }}>
              Discard
            </button>
          </div>
        </div>
      </div>
      <div style={{ padding: "10px 13px", boxShadow: "inset 0 1px 0 rgba(233,233,237,0.08)" }}>
        <input className="input" placeholder="Ask about this page…" style={{ minHeight: 30, fontSize: 12, background: "var(--color-surface)" }} />
      </div>
    </aside>
  );
}

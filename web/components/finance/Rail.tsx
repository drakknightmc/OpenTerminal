"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECTIONS } from "../../lib/finance/sections";
import { activeSectionId } from "../../lib/finance/route";

const ROUTE_OF: Record<string, string> = {
  overview: "/",
  holdings: "/investments",
  networth: "/networth",
  markets: "/markets",
  cashflow: "/cashflow",
  expenses: "/expenses",
  subs: "/subscriptions",
  income: "/income",
  statements: "/statements",
  tax: "/tax",
  inbox: "/inbox",
  connectors: "/connectors",
};

export default function Rail() {
  const pathname = usePathname();
  const activeId = activeSectionId(pathname);

  return (
    <nav
      style={{
        width: 196, flex: "none", display: "flex", flexDirection: "column",
        background: "#13151f", boxShadow: "inset -1px 0 0 rgba(233,233,237,0.10)",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 7, padding: "13px 14px 12px" }}>
        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.14em" }}>LEDGERLINE</span>
        <span style={{ fontSize: 9, letterSpacing: "0.1em", color: "var(--color-neutral-600)" }}>v0.4</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 12 }}>
        {SECTIONS.map((grp) => (
          <div key={grp.g}>
            <div style={{ padding: "11px 14px 4px", fontSize: 9, letterSpacing: "0.13em", textTransform: "uppercase", color: "#595d6c" }}>
              {grp.g}
            </div>
            {grp.items.map((it) => {
              const active = it.id === activeId;
              return (
                <Link
                  key={it.id}
                  href={ROUTE_OF[it.id] ?? "/"}
                  style={{
                    display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left",
                    border: 0, background: "transparent", cursor: "pointer", fontSize: "12.5px",
                    padding: "5px 14px 5px 13px", textDecoration: "none",
                    color: active ? "var(--color-text)" : "#9397ab",
                    boxShadow: active ? "inset 2px 0 0 var(--color-accent), inset 0 0 0 999px rgba(145,132,217,0.08)" : "none",
                  }}
                >
                  <span style={{ width: 5, height: 5, flex: "none", borderRadius: "50%", background: active ? "var(--color-accent)" : "transparent" }} />
                  <span style={{ flex: 1 }}>{it.label}</span>
                  <span style={{ fontSize: "9.5px", fontFamily: "var(--font-mono)", color: it.badge === "7" ? "var(--color-accent-400)" : "var(--color-neutral-700)" }}>
                    {it.badge ?? ""}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ padding: "9px 14px", boxShadow: "inset 0 1px 0 rgba(233,233,237,0.10)", display: "flex", alignItems: "center", gap: 7, fontSize: "10.5px", color: "var(--color-neutral-600)" }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-gain)" }} />
        <span>4 connectors live</span>
      </div>
    </nav>
  );
}

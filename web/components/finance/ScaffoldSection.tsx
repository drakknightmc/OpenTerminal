"use client";

import { useMemo, useState } from "react";
import { SCAFFOLDS } from "../../lib/finance/scaffolds";
import { DIM, TXT } from "../../lib/finance/colors";
import { isNeg } from "../../lib/finance/rows";

const tone = (v: string) => (v === "—" ? DIM : isNeg(v) ? "var(--color-loss)" : TXT);

export default function ScaffoldSection({ sectionId }: { sectionId: string }) {
  const entry = SCAFFOLDS[sectionId];
  const tabNames = useMemo(() => Object.keys(entry?.tabs ?? {}), [entry]);
  const [activeTab, setActiveTab] = useState(tabNames[0]);
  const view = entry?.tabs[activeTab ?? tabNames[0]];

  if (!entry || !view) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 4, padding: "8px 16px 0", flexWrap: "wrap" }}>
        {tabNames.map((label) => (
          <button
            key={label}
            onClick={() => setActiveTab(label)}
            style={{
              border: 0, background: "transparent", cursor: "pointer", font: "inherit", fontSize: 12,
              padding: "5px 9px 7px", color: label === activeTab ? TXT : DIM,
              boxShadow: label === activeTab ? "inset 0 -2px 0 var(--color-accent)" : "none",
            }}
          >
            {label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 7, paddingBottom: 4 }}>
          <input className="input" placeholder="filter…" style={{ width: 130, minHeight: 26, fontSize: "11.5px", padding: "2px 8px", background: "var(--color-surface)" }} />
          <button className="btn btn-secondary" style={{ height: 26, fontSize: "11.5px", padding: "0 9px" }}>Period: FY26</button>
          <button className="btn btn-secondary" style={{ height: 26, fontSize: "11.5px", padding: "0 9px" }}>Export</button>
        </div>
      </div>
      <div style={{ height: 1, background: "linear-gradient(to right, transparent, rgba(233,233,237,0.14) 48px, rgba(233,233,237,0.14) calc(100% - 48px), transparent)" }} />

      <div style={{ flex: "none", display: "flex", alignItems: "stretch", padding: "9px 16px 10px", background: "#1a1c2b", boxShadow: "inset 0 -1px 0 rgba(233,233,237,0.08)", overflowX: "auto" }}>
        {view.stats.map(([k, v, sub], i, arr) => (
          <div key={k} style={{ padding: "0 15px 0 0", marginRight: 15, boxShadow: i === arr.length - 1 ? "none" : "inset -1px 0 0 rgba(233,233,237,0.09)", whiteSpace: "nowrap" }}>
            <div style={{ fontSize: "9.5px", letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>{k}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "14.5px", marginTop: 3, color: tone(v) === DIM && v !== "—" ? TXT : (isNeg(v) ? "var(--color-loss)" : TXT) }}>{v}</div>
            <div style={{ fontSize: 10, color: "var(--color-neutral-700)", fontFamily: "var(--font-mono)", marginTop: 1 }}>{sub}</div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        <table className="table" style={{ fontSize: "12.5px", minWidth: 820 }}>
          <thead>
            <tr>
              {view.cols.map((label, i) => (
                <th key={label} style={{ padding: "6px 10px", textAlign: i === 0 ? "left" : "right", position: "sticky", top: 0, background: "var(--color-bg)", zIndex: 1 }}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.rows.map((cells, ri) => (
              <tr key={ri} style={{ cursor: "pointer" }}>
                {cells.map((v, i) => (
                  <td
                    key={i}
                    style={{
                      padding: "6px 10px", textAlign: i === 0 ? "left" : "right",
                      fontFamily: i === 0 ? "var(--font-body)" : "var(--font-mono)",
                      color: i === 0 ? TXT : isNeg(v) ? "var(--color-loss)" : v.startsWith("+") ? "var(--color-gain)" : "var(--color-neutral-400)",
                    }}
                  >
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ flex: "none", padding: "8px 16px", background: "#1a1c2b", boxShadow: "inset 0 1px 0 rgba(233,233,237,0.10)", fontSize: 11, color: "var(--color-neutral-600)" }}>
        {view.note}
      </div>
    </div>
  );
}

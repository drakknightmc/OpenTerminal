"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TABS } from "../../lib/finance/tabs";
import { CLASS_OF, ROWS, isNeg } from "../../lib/finance/rows";
import { computeInvestmentStats } from "../../lib/finance/investmentStats";
import { DIM, DOWN, TXT, UP } from "../../lib/finance/colors";

export default function InvestmentsPage() {
  const [tab, setTab] = useState("All");
  const router = useRouter();

  const tabs = TABS.map(([label, count]) => ({
    label, count,
    color: label === tab ? TXT : DIM,
    mark: label === tab ? "inset 0 -2px 0 var(--color-accent)" : "none",
  }));

  const { tabStats, footCount, footBench } = useMemo(() => computeInvestmentStats(tab), [tab]);

  const holdings = useMemo(
    () => ROWS.filter((r) => tab === "All" || CLASS_OF[r[0]] === tab).map((r) => ({
      sym: r[0], name: r[1], acct: r[2], qty: r[3], avg: r[4], ltp: r[5],
      day: r[6], dayColor: r[6] === "—" ? DIM : isNeg(r[6]) ? DOWN : UP,
      value: r[7], valueInr: r[8],
      pnl: r[9], pnlPct: r[10], pnlColor: isNeg(r[9]) ? DOWN : UP,
      xirr: r[11], xirrColor: isNeg(r[11]) ? DOWN : UP, wt: r[12],
    })),
    [tab]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 4, padding: "8px 16px 0", flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button
            key={t.label}
            onClick={() => setTab(t.label)}
            style={{
              border: 0, background: "transparent", cursor: "pointer", font: "inherit", fontSize: 12,
              padding: "5px 9px 7px", color: t.color, boxShadow: t.mark,
            }}
          >
            {t.label} <span style={{ fontSize: 10, color: "var(--color-neutral-700)", fontFamily: "var(--font-mono)" }}>{t.count}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 7, paddingBottom: 4 }}>
          <input className="input" placeholder="filter…" style={{ width: 130, minHeight: 26, fontSize: "11.5px", padding: "2px 8px", background: "var(--color-surface)" }} />
          <button className="btn btn-secondary" style={{ height: 26, fontSize: "11.5px", padding: "0 9px" }}>Group: asset class</button>
          <button className="btn btn-secondary" style={{ height: 26, fontSize: "11.5px", padding: "0 9px" }}>Add lot</button>
        </div>
      </div>
      <div style={{ height: 1, background: "linear-gradient(to right, transparent, rgba(233,233,237,0.14) 48px, rgba(233,233,237,0.14) calc(100% - 48px), transparent)" }} />

      <div style={{ flex: "none", display: "flex", alignItems: "stretch", gap: 0, padding: "9px 16px 10px", background: "#1a1c2b", boxShadow: "inset 0 -1px 0 rgba(233,233,237,0.08)", overflowX: "auto" }}>
        {tabStats.map((k) => (
          <div key={k.k} style={{ padding: "0 15px 0 0", marginRight: 15, boxShadow: k.sep, whiteSpace: "nowrap" }}>
            <div style={{ fontSize: "9.5px", letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>{k.k}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "14.5px", marginTop: 3, color: k.color }}>{k.v}</div>
            <div style={{ fontSize: 10, color: "var(--color-neutral-700)", fontFamily: "var(--font-mono)", marginTop: 1 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        <table className="table" style={{ fontSize: "12.5px", minWidth: 1080 }}>
          <thead>
            <tr>
              <th style={{ padding: "6px 16px", position: "sticky", top: 0, background: "var(--color-bg)", zIndex: 1 }}>Instrument</th>
              <th style={{ padding: "6px 8px", position: "sticky", top: 0, background: "var(--color-bg)" }}>Account</th>
              <th style={{ padding: "6px 8px", textAlign: "right", position: "sticky", top: 0, background: "var(--color-bg)" }}>Qty</th>
              <th style={{ padding: "6px 8px", textAlign: "right", position: "sticky", top: 0, background: "var(--color-bg)" }}>Avg cost</th>
              <th style={{ padding: "6px 8px", textAlign: "right", position: "sticky", top: 0, background: "var(--color-bg)" }}>Last</th>
              <th style={{ padding: "6px 8px", textAlign: "right", position: "sticky", top: 0, background: "var(--color-bg)" }}>Day</th>
              <th style={{ padding: "6px 8px", textAlign: "right", position: "sticky", top: 0, background: "var(--color-bg)" }}>Value</th>
              <th style={{ padding: "6px 8px", textAlign: "right", position: "sticky", top: 0, background: "var(--color-bg)" }}>Unrealised</th>
              <th style={{ padding: "6px 8px", textAlign: "right", position: "sticky", top: 0, background: "var(--color-bg)" }}>XIRR</th>
              <th style={{ padding: "6px 16px 6px 8px", textAlign: "right", position: "sticky", top: 0, background: "var(--color-bg)" }}>Wt</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h) => (
              <tr key={h.sym} onClick={() => router.push(`/investments/${h.sym}`)} style={{ cursor: "pointer" }}>
                <td style={{ padding: "6px 16px" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{h.sym}</div>
                  <div style={{ fontSize: "10.5px", color: "var(--color-neutral-600)" }}>{h.name}</div>
                </td>
                <td style={{ padding: "6px 8px", fontSize: 11, color: "var(--color-neutral-400)" }}>{h.acct}</td>
                <td style={{ padding: "6px 8px", textAlign: "right", fontFamily: "var(--font-mono)" }}>{h.qty}</td>
                <td style={{ padding: "6px 8px", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--color-neutral-400)" }}>{h.avg}</td>
                <td style={{ padding: "6px 8px", textAlign: "right", fontFamily: "var(--font-mono)" }}>{h.ltp}</td>
                <td style={{ padding: "6px 8px", textAlign: "right", fontFamily: "var(--font-mono)", color: h.dayColor }}>{h.day}</td>
                <td style={{ padding: "6px 8px", textAlign: "right", fontFamily: "var(--font-mono)" }}>
                  <div>{h.value}</div>
                  <div style={{ fontSize: 10, color: "var(--color-neutral-700)" }}>{h.valueInr}</div>
                </td>
                <td style={{ padding: "6px 8px", textAlign: "right", fontFamily: "var(--font-mono)", color: h.pnlColor }}>
                  <div>{h.pnl}</div>
                  <div style={{ fontSize: 10, opacity: 0.75 }}>{h.pnlPct}</div>
                </td>
                <td style={{ padding: "6px 8px", textAlign: "right", fontFamily: "var(--font-mono)", color: h.xirrColor }}>{h.xirr}</td>
                <td style={{ padding: "6px 16px 6px 8px", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--color-neutral-400)" }}>{h.wt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 22, padding: "8px 16px", background: "#1a1c2b", boxShadow: "inset 0 1px 0 rgba(233,233,237,0.10)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
        <span style={{ color: "var(--color-neutral-600)", fontFamily: "var(--font-body)", fontSize: 11 }}>{footCount}</span>
        <span style={{ marginLeft: "auto", color: "var(--color-neutral-600)", fontFamily: "var(--font-body)", fontSize: 11 }}>Prices</span>
        <span>14:32:06 IST</span>
        <span style={{ color: "var(--color-neutral-600)", fontFamily: "var(--font-body)", fontSize: 11 }}>Lots synced</span>
        <span>02 Sep</span>
        <span style={{ color: "var(--color-neutral-600)", fontFamily: "var(--font-body)", fontSize: 11 }}>Benchmark</span>
        <span style={{ color: "var(--color-gain)" }}>{footBench}</span>
      </div>
    </div>
  );
}

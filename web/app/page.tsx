import Link from "next/link";
import { dayLine, getSleeves, movers, netWorth, reviewPeek } from "../lib/finance/overview";

export default function OverviewPage() {
  const sleeves = getSleeves();

  return (
    <div style={{ padding: "18px 20px 28px" }}>
      <div style={{ display: "flex", gap: 28, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-neutral-600)", marginBottom: 4 }}>
            Net worth
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 40, fontWeight: 500, lineHeight: 1, letterSpacing: "-0.02em" }}>
            {netWorth()}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 9, fontSize: 12, fontFamily: "var(--font-mono)" }}>
            <span style={{ color: "var(--color-gain)" }}>{dayLine()}</span>
            <span style={{ color: "var(--color-gain)" }}>+₹9,84,600 30d · +4.33%</span>
            <span style={{ color: "var(--color-neutral-600)" }}>XIRR 14.9%</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 260, maxWidth: 560 }}>
          <svg viewBox="0 0 560 76" preserveAspectRatio="none" style={{ width: "100%", height: 76, display: "block" }}>
            <defs>
              <linearGradient id="nwfill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.30" />
                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0 62 L40 58 L80 63 L120 49 L160 52 L200 41 L240 45 L280 33 L320 37 L360 26 L400 30 L440 21 L480 24 L520 14 L560 11 L560 76 L0 76 Z" fill="url(#nwfill)" />
            <path d="M0 62 L40 58 L80 63 L120 49 L160 52 L200 41 L240 45 L280 33 L320 37 L360 26 L400 30 L440 21 L480 24 L520 14 L560 11" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" />
          </svg>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9.5px", color: "var(--color-neutral-700)", fontFamily: "var(--font-mono)" }}>
            <span>Sep 2024</span><span>Mar 2025</span><span>Sep 2025</span><span>Mar 2026</span><span>today</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(196px, 1fr))", gap: 10, marginTop: 22 }}>
        {sleeves.map((s) => (
          <Link
            key={s.name}
            href={s.href}
            className="card"
            style={{
              alignItems: "stretch", textAlign: "left", border: 0, cursor: "pointer", gap: 0,
              padding: "11px 12px 10px", background: "#1e2030", boxShadow: "0 0 0 1px rgba(233,233,237,0.07)",
              textDecoration: "none", color: "inherit",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: "11.5px", color: "var(--color-neutral-400)", flex: 1 }}>{s.name}</span>
              <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--color-neutral-600)" }}>{s.weight}</span>
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, marginTop: 5, letterSpacing: "-0.01em" }}>{s.value}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 3, fontFamily: "var(--font-mono)", fontSize: 11 }}>
              <span style={{ color: s.dayColor }}>{s.day}</span>
              <span style={{ color: "var(--color-neutral-700)" }}>{s.native}</span>
            </div>
            <div style={{ height: 2, marginTop: 9, background: "rgba(233,233,237,0.08)" }}>
              <div style={{ height: 2, width: s.bar, background: "var(--color-accent-600)" }} />
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.55fr) minmax(0, 1fr)", gap: 14, marginTop: 20, alignItems: "start" }}>
        <section style={{ background: "#1c1e2c", borderRadius: 8, padding: "12px 0 4px" }}>
          <div style={{ display: "flex", alignItems: "center", padding: "0 13px 9px" }}>
            <h6 style={{ margin: 0, flex: 1, color: "var(--color-neutral-400)" }}>Today&apos;s movers</h6>
            <span style={{ fontSize: 10, color: "var(--color-neutral-700)" }}>by contribution to net worth</span>
          </div>
          <table className="table" style={{ fontSize: "12.5px" }}>
            <thead>
              <tr>
                <th style={{ padding: "4px 13px" }}>Symbol</th>
                <th style={{ padding: "4px 8px" }}>Name</th>
                <th style={{ padding: "4px 8px", textAlign: "right" }}>Day</th>
                <th style={{ padding: "4px 13px 4px 8px", textAlign: "right" }}>Contribution</th>
              </tr>
            </thead>
            <tbody>
              {movers.map((m) => (
                <tr key={m.sym}>
                  <td style={{ padding: "5px 13px", width: "1%", whiteSpace: "nowrap" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{m.sym}</span>
                  </td>
                  <td style={{ padding: "5px 8px", color: "var(--color-neutral-600)", fontSize: "11.5px" }}>{m.name}</td>
                  <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "var(--font-mono)", color: m.color }}>{m.pct}</td>
                  <td style={{ padding: "5px 13px 5px 8px", textAlign: "right", fontFamily: "var(--font-mono)", color: m.color }}>{m.abs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={{ background: "#1c1e2c", borderRadius: 8, padding: "12px 13px 13px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <h6 style={{ margin: 0, flex: 1, color: "var(--color-neutral-400)" }}>Needs review</h6>
            <span className="tag tag-accent" style={{ fontSize: 10, padding: "1px 8px" }}>7 pending</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {reviewPeek.map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", paddingBottom: 8, boxShadow: "inset 0 -1px 0 rgba(233,233,237,0.07)" }}>
                <span style={{ fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-accent-600)", width: 42, flex: "none", paddingTop: 2 }}>
                  {r.src}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12 }}>{r.title}</div>
                  <div style={{ fontSize: "10.5px", color: "var(--color-neutral-600)", fontFamily: "var(--font-mono)" }}>{r.meta}</div>
                </div>
              </div>
            ))}
            <Link href="/inbox" className="btn btn-ghost" style={{ alignSelf: "flex-start", fontSize: "11.5px", textDecoration: "none" }}>
              Open review queue →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

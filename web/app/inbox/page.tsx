import { queue } from "../../lib/finance/inbox";

export default function InboxPage() {
  return (
    <div style={{ padding: "16px 20px 28px", maxWidth: 1000 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <h4 style={{ margin: 0 }}>Review queue</h4>
        <span style={{ fontSize: 12, color: "var(--color-neutral-600)" }}>Every agent write lands here before it touches the ledger.</span>
      </div>
      <div style={{ display: "flex", gap: 6, margin: "12px 0 14px", flexWrap: "wrap" }}>
        <span className="tag tag-accent" style={{ fontSize: 11 }}>All 7</span>
        <span className="tag tag-neutral" style={{ fontSize: 11 }}>Gmail MCP 3</span>
        <span className="tag tag-neutral" style={{ fontSize: 11 }}>SMS relay 3</span>
        <span className="tag tag-neutral" style={{ fontSize: 11 }}>Broker file 1</span>
        <span style={{ marginLeft: "auto" }} />
        <button className="btn btn-secondary" style={{ height: 26, fontSize: "11.5px" }}>Approve all high-confidence</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {queue.map((q, i) => (
          <div
            key={i}
            style={{
              background: "#1c1e2c", borderRadius: 8, padding: "11px 13px", display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto", gap: 12, alignItems: "start",
              boxShadow: "0 0 0 1px rgba(233,233,237,0.06)",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 9, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--color-accent-600)" }}>{q.src}</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{q.title}</span>
                <span className="tag" style={{ fontSize: 10, padding: "1px 7px", background: q.confBg, color: q.confFg }}>{q.conf}</span>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "11.5px", color: "var(--color-neutral-400)", marginTop: 6 }}>{q.parsed}</div>
              <div style={{ fontSize: 11, color: "var(--color-neutral-600)", marginTop: 4 }}>{q.raw}</div>
              <div style={{ fontSize: 11, color: "var(--color-neutral-700)", marginTop: 5 }}>→ writes {q.writes}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <button className="btn btn-primary" style={{ height: 26, fontSize: "11.5px", padding: "0 12px" }}>Approve</button>
              <button className="btn btn-secondary" style={{ height: 26, fontSize: "11.5px", padding: "0 12px" }}>Edit</button>
              <button className="btn btn-secondary" style={{ height: 26, fontSize: "11.5px", padding: "0 12px", color: "var(--color-loss)" }}>Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

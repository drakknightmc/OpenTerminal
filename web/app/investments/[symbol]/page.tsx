"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CLASS_OF, ROWS, TOTALS, isNeg } from "../../../lib/finance/rows";
import { DIM, DOWN, TXT, UP } from "../../../lib/finance/colors";
import { RANGE_LABELS, lots, news, posStats as nvdaPosStats } from "../../../lib/finance/position";

type PosStat = { k: string; v: string; color: string };

export default function PositionDetailPage() {
  const params = useParams<{ symbol: string }>();
  const router = useRouter();
  const symbol = decodeURIComponent(params.symbol ?? "").toUpperCase();
  const [range, setRange] = useState("1Y");

  const row = ROWS.find((r) => r[0] === symbol);
  const cls = row ? CLASS_OF[row[0]] : undefined;

  const ranges = RANGE_LABELS.map((label) => ({
    label,
    color: label === range ? "var(--color-accent-400)" : DIM,
    mark: label === range ? "inset 0 0 0 1px var(--color-accent-700)" : "none",
  }));

  const isNvda = symbol === "NVDA";

  const posStats: PosStat[] = useMemo(() => {
    if (isNvda) return nvdaPosStats;
    if (!row) return [];
    const dayColor = row[6] === "—" ? DIM : isNeg(row[6]) ? DOWN : UP;
    return [
      { k: "Quantity", v: row[3], color: TXT },
      { k: "Average cost", v: row[4], color: TXT },
      { k: "Last", v: row[5], color: dayColor },
      { k: "Day", v: row[6], color: dayColor },
      { k: "Market value", v: row[8] ? `${row[7]} · ${row[8]}` : row[7], color: TXT },
      { k: "Unrealised", v: `${row[9]} · ${row[10]}`, color: isNeg(row[9]) ? DOWN : UP },
      { k: "XIRR", v: row[11], color: isNeg(row[11]) ? DOWN : UP },
      { k: "Weight of net worth", v: row[12], color: TXT },
    ];
  }, [isNvda, row]);

  const concentration = useMemo(() => {
    if (isNvda) {
      return {
        text: (
          <>
            Largest single position at <b style={{ fontFamily: "var(--font-mono)", color: "var(--color-text)", fontWeight: 400 }}>7.9%</b> of
            net worth and <b style={{ fontFamily: "var(--font-mono)", color: "var(--color-text)", fontWeight: 400 }}>41.7%</b> of the US
            sleeve. Semiconductors total <b style={{ fontFamily: "var(--font-mono)", color: "var(--color-text)", fontWeight: 400 }}>9.8%</b>{" "}
            across NVDA and the index funds&apos; look-through.
          </>
        ),
        selfPct: 7.9, classPct: 9.2,
      };
    }
    if (!row || !cls) return null;
    const nw = TOTALS["All"].value;
    const selfPct = (Number(String(row[8] || row[7]).replace(/[^0-9.]/g, "")) / nw) * 100;
    const classPct = (TOTALS[cls].value / nw) * 100;
    return {
      text: (
        <>
          This position is <b style={{ fontFamily: "var(--font-mono)", color: "var(--color-text)", fontWeight: 400 }}>{row[12]}</b> of net
          worth. The {cls} sleeve as a whole is{" "}
          <b style={{ fontFamily: "var(--font-mono)", color: "var(--color-text)", fontWeight: 400 }}>{classPct.toFixed(1)}%</b>.
        </>
      ),
      selfPct, classPct,
    };
  }, [isNvda, row, cls]);

  if (!row) {
    return (
      <div style={{ padding: "16px 20px 28px" }}>
        <button onClick={() => router.push("/investments")} className="btn btn-ghost" style={{ fontSize: "11.5px", paddingLeft: 0, marginBottom: 8 }}>
          ← Holdings
        </button>
        <p style={{ color: "var(--color-neutral-400)" }}>No holding found for {symbol}.</p>
      </div>
    );
  }

  const [exchangeTag, acctTag] = row[2].includes(" · ") ? row[2].split(" · ") : [row[2], ""];
  const currency = row[4]?.startsWith("$") || row[5]?.startsWith("$") ? "USD" : "INR";
  const dayColor = row[6] === "—" ? DIM : isNeg(row[6]) ? DOWN : UP;

  return (
    <div style={{ padding: "16px 20px 28px" }}>
      <Link href="/investments" className="btn btn-ghost" style={{ fontSize: "11.5px", paddingLeft: 0, marginBottom: 8, textDecoration: "none", display: "inline-block" }}>
        ← Holdings
      </Link>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 26, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 24, fontWeight: 500 }}>{row[0]}</span>
            {exchangeTag && <span className="tag tag-neutral" style={{ fontSize: 10 }}>{exchangeTag}</span>}
            {acctTag && <span className="tag tag-outline" style={{ fontSize: 10 }}>{acctTag} · {currency}</span>}
          </div>
          <div style={{ fontSize: 12, color: "var(--color-neutral-600)", marginTop: 3 }}>
            {row[1]}{cls ? ` · ${cls}` : ""}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 28, lineHeight: 1 }}>{row[5]}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: dayColor, marginTop: 4 }}>{row[6]}</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 7 }}>
          <button className="btn btn-secondary" style={{ height: 28, fontSize: "11.5px" }}>Add lot</button>
          <button className="btn btn-secondary" style={{ height: 28, fontSize: "11.5px" }}>Set alert</button>
          <button className="btn btn-primary" style={{ height: 28, fontSize: "11.5px" }}>Ask agent</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.7fr) minmax(0, 1fr)", gap: 14, marginTop: 16, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <section style={{ background: "#1c1e2c", borderRadius: 8, padding: "11px 13px 9px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <h6 style={{ margin: 0, flex: 1, color: "var(--color-neutral-400)" }}>Price · cost basis</h6>
              {ranges.map((r) => (
                <button
                  key={r.label}
                  onClick={() => setRange(r.label)}
                  style={{ border: 0, background: "transparent", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: "10.5px", padding: "1px 5px", borderRadius: 4, color: r.color, boxShadow: r.mark }}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <svg viewBox="0 0 640 190" preserveAspectRatio="none" style={{ width: "100%", height: 190, display: "block" }}>
              <line x1="0" y1="126" x2="640" y2="126" stroke="var(--color-neutral-700)" strokeWidth="1" strokeDasharray="3 4" />
              <path d="M0 168 L45 160 L90 171 L135 150 L180 141 L225 152 L270 118 L315 126 L360 96 L405 104 L450 72 L495 84 L540 52 L585 44 L640 30" fill="none" stroke="var(--color-accent)" strokeWidth="1.6" />
              <path d="M0 168 L45 160 L90 171 L135 150 L180 141 L225 152 L270 118 L315 126 L360 96 L405 104 L450 72 L495 84 L540 52 L585 44 L640 30 L640 190 L0 190 Z" fill="var(--color-accent)" fillOpacity="0.11" />
              <circle cx="90" cy="171" r="3" fill="var(--color-gain)" /><circle cx="270" cy="118" r="3" fill="var(--color-gain)" /><circle cx="450" cy="72" r="3" fill="var(--color-gain)" />
            </svg>
            <div style={{ display: "flex", gap: 16, fontSize: 10, color: "var(--color-neutral-700)", fontFamily: "var(--font-mono)" }}>
              <span>— price</span><span style={{ color: "var(--color-gain)" }}>● buy lots</span>
              {row[4] && row[4] !== "—" && <span>--- avg cost {row[4]}</span>}
            </div>
          </section>

          <section style={{ background: "#1c1e2c", borderRadius: 8, padding: "11px 0 5px" }}>
            <h6 style={{ margin: "0 0 6px", padding: "0 13px", color: "var(--color-neutral-400)" }}>Tax lots</h6>
            {currency === "USD" ? (
              <>
                <table className="table" style={{ fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "5px 13px" }}>Acquired</th>
                      <th style={{ padding: "5px 8px", textAlign: "right" }}>Qty</th>
                      <th style={{ padding: "5px 8px", textAlign: "right" }}>Cost</th>
                      <th style={{ padding: "5px 8px", textAlign: "right" }}>Gain</th>
                      <th style={{ padding: "5px 8px" }}>Holding</th>
                      <th style={{ padding: "5px 13px 5px 8px", textAlign: "right" }}>If sold today</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lots.map((l) => (
                      <tr key={l.date}>
                        <td style={{ padding: "5px 13px", fontFamily: "var(--font-mono)" }}>{l.date}</td>
                        <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "var(--font-mono)" }}>{l.qty}</td>
                        <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--color-neutral-400)" }}>{l.cost}</td>
                        <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--color-gain)" }}>{l.gain}</td>
                        <td style={{ padding: "5px 8px" }}>
                          <span className="tag" style={{ fontSize: 10, padding: "1px 7px", background: l.tagBg, color: l.tagFg }}>{l.term}</span>
                        </td>
                        <td style={{ padding: "5px 13px 5px 8px", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--color-loss)" }}>{l.tax}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ padding: "7px 13px 4px", fontSize: 11, color: "var(--color-neutral-600)" }}>
                  Illustrative lot schedule{isNvda ? " — foreign asset, Schedule FA reportable" : ""}. Sale tax modelled at 20% LTCG with
                  indexation removed post-2024; dividends taxed at slab with 25% US withholding credited where applicable.
                </div>
              </>
            ) : (
              <div style={{ padding: "4px 13px 13px", fontSize: 12, color: "var(--color-neutral-600)" }}>
                Lot-level detail is only modelled for US equity in this preview — see the{" "}
                <a href="/tax" style={{ color: "var(--color-accent-400)" }}>Tax</a> section for realised-gains rollups across every asset
                class.
              </div>
            )}
          </section>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <section style={{ background: "#1c1e2c", borderRadius: 8, padding: "11px 13px 12px" }}>
            <h6 style={{ margin: "0 0 8px", color: "var(--color-neutral-400)" }}>Position</h6>
            {posStats.map((p) => (
              <div key={p.k} style={{ display: "flex", alignItems: "baseline", gap: 10, padding: "3px 0", fontSize: 12 }}>
                <span style={{ color: "var(--color-neutral-600)", flex: 1 }}>{p.k}</span>
                <span style={{ fontFamily: "var(--font-mono)", color: p.color }}>{p.v}</span>
              </div>
            ))}
          </section>

          {concentration && (
            <section style={{ background: "#1c1e2c", borderRadius: 8, padding: "11px 13px 10px" }}>
              <h6 style={{ margin: "0 0 8px", color: "var(--color-neutral-400)" }}>Concentration</h6>
              <div style={{ fontSize: 12, color: "var(--color-neutral-400)", lineHeight: 1.5 }}>{concentration.text}</div>
              <div style={{ display: "flex", height: 5, marginTop: 10, gap: 2 }}>
                <div style={{ width: `${concentration.selfPct}%`, background: "var(--color-accent)" }} />
                <div style={{ width: `${concentration.classPct}%`, background: "var(--color-accent-700)" }} />
                <div style={{ flex: 1, background: "rgba(233,233,237,0.08)" }} />
              </div>
            </section>
          )}

          <section style={{ background: "#1c1e2c", borderRadius: 8, padding: "11px 13px 10px" }}>
            <h6 style={{ margin: "0 0 8px", color: "var(--color-neutral-400)" }}>News</h6>
            {news.map((n, i) => (
              <div key={i} style={{ padding: "5px 0", boxShadow: "inset 0 -1px 0 rgba(233,233,237,0.06)" }}>
                <div style={{ fontSize: 12, lineHeight: 1.35 }}>{n.head}</div>
                <div style={{ fontSize: 10, color: "var(--color-neutral-700)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{n.meta}</div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}

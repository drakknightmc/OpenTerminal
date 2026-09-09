"use client";

import dynamic from "next/dynamic";

// The one section that keeps the original OpenTerminal widget workspace
// (react-grid-layout etc.) — kept as-is and code-split behind this route,
// per design/README.md and Terminal - UX Plan.dc.html section 5's weight
// budget ("0 drag-and-drop outside Markets").
const Terminal = dynamic(() => import("../../components/Terminal"), { ssr: false });

export default function MarketsPage() {
  return <Terminal />;
}

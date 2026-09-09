// Maps a pathname to the active rail section id and the top-bar
// title/subtitle, mirroring Terminal - Investments.dc.html's `TITLES` /
// `renderVals()` title logic (plus the two real routes — /markets and
// per-symbol position detail — the prototype didn't need to route for).
import { CLASS_OF } from "./rows";
import { titleFor } from "./sections";

export function activeSectionId(pathname: string): string {
  if (pathname === "/") return "overview";
  if (pathname.startsWith("/investments")) return "holdings";
  if (pathname.startsWith("/inbox")) return "inbox";
  if (pathname.startsWith("/markets")) return "markets";
  if (pathname.startsWith("/networth")) return "networth";
  if (pathname.startsWith("/cashflow")) return "cashflow";
  if (pathname.startsWith("/expenses")) return "expenses";
  if (pathname.startsWith("/subscriptions")) return "subs";
  if (pathname.startsWith("/income")) return "income";
  if (pathname.startsWith("/statements")) return "statements";
  if (pathname.startsWith("/tax")) return "tax";
  if (pathname.startsWith("/connectors")) return "connectors";
  return "overview";
}

export function pageMeta(pathname: string): [title: string, sub: string] {
  if (pathname.startsWith("/investments/")) {
    const symbol = decodeURIComponent(pathname.split("/")[2] ?? "").toUpperCase();
    const cls = CLASS_OF[symbol];
    return [symbol, "Investments" + (cls ? " / " + cls : "")];
  }
  if (pathname.startsWith("/markets")) return ["Markets", "OpenTerminal widget workspace"];
  return titleFor(activeSectionId(pathname));
}

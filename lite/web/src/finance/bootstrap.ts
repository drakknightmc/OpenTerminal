// Registers every built section so Rail has something to show. Import this
// once, before the Shell mounts (App.svelte does it first thing) -- Rail
// reads getSections() at its own mount time, so registration has to happen
// before that, not lazily per-route.
import { RegisterSection } from "./registry";

RegisterSection({ id: "overview", label: "Overview", group: "Position", routes: ["/"] });
RegisterSection({ id: "investments", label: "Investments", group: "Position", routes: ["/investments"] });
RegisterSection({ id: "networth", label: "Net worth", group: "Position", routes: ["/networth"] });
RegisterSection({ id: "markets", label: "Markets", group: "Markets", routes: ["/markets"] });
RegisterSection({ id: "inbox", label: "Inbox", group: "System", routes: ["/inbox"] });

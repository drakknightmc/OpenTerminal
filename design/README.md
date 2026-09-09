# design/

Design source for the personal-finance terminal built on top of OpenTerminal.
Drop this folder into the repo root and commit it; the two HTML files open
directly in a browser with no build step.

## Files

| File | What it is |
| --- | --- |
| `Terminal - UX Plan.dc.html` | The written plan: IA tree, section map with phases, shell spec, twelve-component inventory, the two-tier add-on contract, weight budget, build order. |
| `Terminal - Investments.dc.html` | The hi-fi prototype: app shell plus Overview, Investments, position detail, review queue, agent console, and a working scaffold for every remaining section. |
| `support.js` | Runtime the two HTML files need. Do not edit. |
| `_ds/nocturne-.../` | The Nocturne design system — `styles.css` is the token source of truth (colors, type, spacing, radii, shadows) and `readme.md` is its guide. |

## How the prototype is organised

`Terminal - Investments.dc.html` is one file with two parts: a template
(markup) and a logic class holding all the data.

- **`SECTIONS`** — the left rail. Group, label, badge, and for not-yet-built
  sections a short description plus its module path.
- **`SCAFFOLDS`** — one config entry per section that is not yet hand-designed.
  Each entry declares `tabs`, `stats`, `cols`, `rows` and a `note`, and renders
  through a single generic scaffold: tab row → stat strip → toolbar → table →
  footnote. Adding a section is a config entry, not a new page. This is the
  design-side proof of the `registerSection` contract in the plan.
- **`STATS`** — the Investments stat strip, per asset-class tab. Money metrics
  are `[value, alternate-currency line]`; the tab decides which currency leads.
  US equity leads in USD because that is the account's own currency; All leads
  in INR with the USD line beneath.

## Translating to the Next.js app

The prototype's structure maps one-to-one onto the component inventory in the
plan. In implementation terms:

- The left rail, top bar and content well are the shell and never re-render on
  navigation — a section swap should mount one subtree.
- `SCAFFOLDS` becomes the section registry (`registerSection`) on the server
  side plus a generic list page on the client. Only sections that outgrow the
  scaffold get a hand-built page.
- Every number in the prototype is a server-computed rollup. The client never
  sums a ledger.
- Colors, radii and type come from `_ds/.../styles.css`. Two values are not in
  the system and are declared inline in the prototype: gain `#57c98c` and loss
  `#e0736c`. Promote those to tokens when porting.

## Not covered here

Expenses, cashflow, subscriptions, income, tax and statements exist as
scaffolds with representative columns and sample rows, not as finished
designs. They are deliberately real enough to build against and to argue with.

// Minimal client-side router -- pathname-based, no third-party dependency.
// Small enough (path store + pushState + click interception) that a
// router library would be pure overhead for the handful of routes this
// app needs (Overview, Investments, Net worth, Inbox, Markets).
import { writable } from "svelte/store";

function currentPath(): string {
  return typeof window === "undefined" ? "/" : window.location.pathname;
}

export const path = writable(currentPath());

export function navigate(to: string): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname !== to) {
    window.history.pushState({}, "", to);
  }
  path.set(to);
}

if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => path.set(currentPath()));

  // Intercept clicks on same-origin, non-modified <a href="/..."> links so
  // internal navigation doesn't trigger a full page reload.
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const anchor = (event.target as HTMLElement)?.closest("a");
    if (!anchor) return;
    const href = anchor.getAttribute("href");
    if (!href || !href.startsWith("/") || anchor.target === "_blank") return;

    event.preventDefault();
    navigate(href);
  });
}

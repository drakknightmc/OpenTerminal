import { writable } from "svelte/store";
import { fetchAPI } from "../lib/api";

export const pendingReviewCount = writable(0);

let refreshRequest: Promise<void> | null = null;

/** Refresh the shell badge once, even when Rail and TopBar mount together. */
export function refreshPendingReviewCount(): Promise<void> {
  if (refreshRequest) return refreshRequest;
  refreshRequest = fetchAPI<{ proposals: unknown[] }>("/api/proposals?status=pending")
    .then((response) => pendingReviewCount.set(response.proposals.length))
    .catch(() => { /* the badge is supplementary */ })
    .finally(() => { refreshRequest = null; });
  return refreshRequest;
}

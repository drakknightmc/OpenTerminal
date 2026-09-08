import { getNews } from "./index";
import type { NewsItem } from "./index";

const requests = [
  ["global", undefined],
  ["AAPL", "AAPL"],
  ["TCS.NS", "TCS.NS"],
  ["BTC-USD", "BTC-USD"],
] as const;

function isNewsItem(value: unknown): value is NewsItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  const validPublishedAt =
    item.publishedAt === null ||
    (typeof item.publishedAt === "string" && !Number.isNaN(Date.parse(item.publishedAt)));
  return (
    typeof item.title === "string" &&
    typeof item.link === "string" &&
    typeof item.source === "string" &&
    validPublishedAt &&
    typeof item.market === "string"
  );
}

function normalizedTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 80);
}

function hasUniqueTitles(items: NewsItem[]): boolean {
  const titles = items.map((item) => normalizedTitle(item.title));
  return new Set(titles).size === titles.length;
}

async function main(): Promise<void> {
  let passed = 0;
  let failed = 0;

  for (const [label, symbol] of requests) {
    let items: NewsItem[] = [];
    let valid = true;

    try {
      const result = await getNews(symbol);
      valid = Array.isArray(result) && result.every(isNewsItem);
      if (valid) items = result;
    } catch (error) {
      valid = false;
      console.error(`[FAIL] News ${label} threw:`, error);
    }

    const deduped = valid && hasUniqueTitles(items);
    if (valid && deduped) {
      passed += 1;
      console.log(`[PASS] News ${label}: ${items.length} item(s), titles deduped`);
    } else {
      failed += 1;
      console.log(
        `[FAIL] News ${label}: ${valid ? "duplicate normalized titles" : "invalid result"}`,
      );
    }
  }

  console.log(`Summary: ${passed} passed, ${failed} failed`);
}

if (import.meta.main) {
  main().catch((error) => {
    console.error("[FAIL] News smoke test:", error);
  });
}

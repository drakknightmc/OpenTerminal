<script lang="ts">
  import { onMount } from "svelte";

  export type NewsItem = {
    title: string;
    link: string;
    source: string;
    publishedAt: string | null;
    market: "us" | "india" | "crypto" | "global";
  };

  export let symbol: string | undefined = undefined;

  let items: NewsItem[] = [];
  let loading = true;
  let error: string | null = null;

  async function fetchNews(symbol?: string): Promise<NewsItem[]> {
    // TODO(integration): wire to real /api/news route
    void symbol;
    return [];
  }

  function relativeTime(publishedAt: string | null): string {
    if (!publishedAt) return "time unavailable";

    const elapsed = Date.now() - new Date(publishedAt).getTime();
    if (!Number.isFinite(elapsed) || elapsed < 0) return "just now";

    const minutes = Math.floor(elapsed / 60_000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  onMount(async () => {
    try {
      items = await fetchNews(symbol);
    } catch (cause) {
      error = cause instanceof Error ? cause.message : "Unable to load news";
    } finally {
      loading = false;
    }
  });
</script>

<section class="news-card" aria-label={symbol ? `${symbol} news` : "Market news"}>
  {#if loading}
    <p class="muted">Loading news...</p>
  {:else if error}
    <p class="error">{error}</p>
  {:else if items.length === 0}
    <p class="muted">No news available.</p>
  {:else}
    <div class="news-list">
      {#each items as item}
        <a class="news-item" href={item.link} target="_blank" rel="noreferrer">
          <div class="item-heading">
            <span class="title">{item.title}</span>
            <span class={`badge ${item.market}`}>{item.market}</span>
          </div>
          <div class="metadata">
            <span>{item.source}</span>
            <span aria-hidden="true">·</span>
            <span>{relativeTime(item.publishedAt)}</span>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</section>

<style>
  .news-card {
    overflow: hidden;
    background: #1a1a1a;
    border: 1px solid #333;
    color: #e0e0e0;
  }

  .news-list {
    max-height: 360px;
    overflow-y: auto;
  }

  .news-item {
    display: block;
    padding: 0.7rem 0.8rem;
    border-bottom: 1px solid #333;
    color: inherit;
    text-decoration: none;
    transition: background 120ms ease;
  }

  .news-item:last-child {
    border-bottom: 0;
  }

  .news-item:hover {
    background: #242424;
  }

  .item-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.7rem;
  }

  .title {
    min-width: 0;
    font-size: 0.9rem;
    line-height: 1.35;
  }

  .metadata,
  .muted,
  .error {
    color: #888;
    font-size: 0.75rem;
  }

  .metadata {
    display: flex;
    gap: 0.35rem;
    margin-top: 0.35rem;
  }

  .error {
    color: #ff6b6b;
  }

  .muted,
  .error {
    margin: 0;
    padding: 1rem;
  }

  .badge {
    flex: 0 0 auto;
    border: 1px solid currentColor;
    border-radius: 2px;
    padding: 0.1rem 0.3rem;
    font-size: 0.65rem;
    line-height: 1.2;
    text-transform: uppercase;
  }

  .badge.us { color: #5dd8e8; }
  .badge.india { color: #ffad5c; }
  .badge.crypto { color: #c28cff; }
  .badge.global { color: #aaa; }
</style>

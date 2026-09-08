<script lang="ts">
  import { onMount } from "svelte";

  interface Message {
    role: "user" | "assistant";
    content: string;
  }

  interface StatusResponse {
    ok: boolean;
    ai: boolean;
  }

  export let symbol: string | undefined = undefined;

  let messages: Message[] = [];
  let input = "";
  let isLoading = false;
  let error: string | null = null;
  let aiAvailable = false;
  let statusLoading = true;
  let dismissedUnavailable = false;

  let scrollContainer: HTMLDivElement;

  onMount(async () => {
    await fetchStatus();
  });

  async function fetchStatus(): Promise<void> {
    try {
      const res = await fetch("/api/status");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const status: StatusResponse = await res.json();
      aiAvailable = status.ai;
    } catch (e) {
      aiAvailable = false;
    } finally {
      statusLoading = false;
    }
  }

  async function sendMessage(message: string, context?: string): Promise<string> {
    // TODO(integration): wire to real /api/ai/chat route
    // For now, return a stub response
    return "AI integration pending. This is a stub response.";
  }

  async function handleSend(): Promise<void> {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    // Add user message
    const userMsg: Message = { role: "user", content: trimmed };
    messages = [...messages, userMsg];
    input = "";
    isLoading = true;
    error = null;

    try {
      // Auto-scroll to bottom
      setTimeout(() => scrollToBottom(), 0);

      const reply = await sendMessage(trimmed, symbol);
      const assistantMsg: Message = { role: "assistant", content: reply };
      messages = [...messages, assistantMsg];
      setTimeout(() => scrollToBottom(), 50);
    } catch (e) {
      error = e instanceof Error ? e.message : "Unknown error";
    } finally {
      isLoading = false;
    }
  }

  function scrollToBottom(): void {
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }

  function dismissUnavailable(): void {
    dismissedUnavailable = true;
  }
</script>

<div class="ai-assistant">
  {#if statusLoading}
    <div class="loading-state">
      <p>Checking AI availability...</p>
    </div>
  {:else if !aiAvailable && !dismissedUnavailable}
    <div class="unavailable-banner">
      <div class="unavailable-content">
        <p>AI assistant not configured</p>
        <p class="subtitle">Set ANTHROPIC_API_KEY on the server to enable the AI assistant.</p>
      </div>
      <button class="dismiss-btn" on:click={dismissUnavailable}>✕</button>
    </div>
  {:else if aiAvailable}
    <div class="chat-container">
      <div class="messages" bind:this={scrollContainer}>
        {#if messages.length === 0}
          <div class="empty-state">
            Ask about {symbol ? symbol : "the market"}, indicators, or headlines.
            {#if symbol}
              <br />
              <span class="muted">Current symbol: <span class="symbol">{symbol}</span></span>
            {/if}
          </div>
        {/if}
        {#each messages as msg, i (i)}
          <div class="message {msg.role}">
            <span class="role-label">{msg.role === "user" ? "YOU" : "AI"} ›</span>
            <span class="content">{msg.content}</span>
          </div>
        {/each}
        {#if isLoading}
          <div class="message assistant loading">
            <span class="role-label">AI ›</span>
            <span class="content">thinking…</span>
          </div>
        {/if}
        {#if error}
          <div class="message error">
            <span class="role-label">ERROR ›</span>
            <span class="content">{error}</span>
          </div>
        {/if}
      </div>
      <div class="input-area">
        <input
          type="text"
          bind:value={input}
          on:keydown={(e) => e.key === "Enter" && handleSend()}
          placeholder={symbol ? `Ask about ${symbol}…` : "Ask about the market…"}
          disabled={isLoading}
        />
        <button on:click={handleSend} disabled={isLoading || !input.trim()}>
          {isLoading ? "…" : "SEND"}
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .ai-assistant {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0a0a0a;
    color: #e0e0e0;
  }

  .loading-state,
  .unavailable-banner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 2rem;
    text-align: center;
  }

  .loading-state p,
  .unavailable-banner p {
    margin: 0;
  }

  .unavailable-banner {
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 8px;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    height: auto;
    margin: auto;
  }

  .unavailable-content {
    flex: 1;
    text-align: left;
  }

  .unavailable-content p:first-child {
    font-weight: 600;
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
  }

  .subtitle {
    color: #888;
    font-size: 0.9rem;
  }

  .dismiss-btn {
    background: none;
    border: none;
    color: #888;
    cursor: pointer;
    padding: 0.5rem;
    font-size: 1.2rem;
    transition: color 0.2s;
  }

  .dismiss-btn:hover {
    color: #e0e0e0;
  }

  .chat-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .empty-state {
    color: #888;
    font-size: 0.95rem;
    text-align: center;
    padding: 2rem;
  }

  .muted {
    color: #555;
    font-size: 0.85rem;
  }

  .symbol {
    color: #888;
    font-family: "Courier New", monospace;
  }

  .message {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .message.user {
    align-items: flex-end;
  }

  .message.assistant {
    align-items: flex-start;
  }

  .role-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .message.user .role-label {
    color: #f59e0b;
  }

  .message.assistant .role-label {
    color: #10b981;
  }

  .message.loading .role-label,
  .message.error .role-label {
    color: #888;
  }

  .content {
    word-wrap: break-word;
    white-space: pre-wrap;
    font-family: "Courier New", monospace;
    line-height: 1.4;
  }

  .message.error .content {
    color: #ff6b6b;
  }

  .message.loading .content {
    color: #888;
    font-style: italic;
  }

  .input-area {
    display: flex;
    gap: 0.5rem;
    padding: 1rem;
    border-top: 1px solid #333;
    background: #0a0a0a;
  }

  input {
    flex: 1;
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 4px;
    color: #e0e0e0;
    padding: 0.75rem;
    font-family: "Courier New", monospace;
    font-size: 0.9rem;
  }

  input:focus {
    outline: none;
    border-color: #555;
  }

  input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  input::placeholder {
    color: #555;
  }

  button {
    padding: 0.75rem 1rem;
    background: #333;
    border: 1px solid #555;
    border-radius: 4px;
    color: #e0e0e0;
    font-weight: 600;
    cursor: pointer;
    font-family: "Courier New", monospace;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  button:hover:not(:disabled) {
    background: #444;
    border-color: #666;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>

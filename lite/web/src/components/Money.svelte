<script lang="ts">
  export let value = 0; export let currency = "USD"; export let base = "USD"; export let mode: "native" | "normalised" | "both" = "both"; export let normalisedValue: number | undefined = undefined;
  const format = (amount: number, code: string) => new Intl.NumberFormat(undefined, { style: "currency", currency: code, maximumFractionDigits: 2 }).format(amount);
</script>
<span class="money"><strong class:gain={value > 0} class:loss={value < 0}>{format(value, currency)}</strong>{#if mode !== "native" && (normalisedValue !== undefined || currency !== base)}<small>{format(normalisedValue ?? value, base)}</small>{/if}</span>
<style>
  .money { display: inline-grid; gap: var(--space-1); } strong { color: var(--color-text); font-weight: 600; } strong.gain { color: var(--color-gain); } strong.loss { color: var(--color-loss); } small { color: var(--color-text-muted); font-size: .7rem; }
</style>

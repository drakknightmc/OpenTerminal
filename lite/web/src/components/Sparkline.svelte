<script lang="ts">
  export let points: number[] = []; export let width = 120; export let height = 32;
  $: min = Math.min(...points, 0); $: max = Math.max(...points, 1); $: range = max - min || 1; $: path = points.map((point, i) => `${i ? "L" : "M"}${(i / Math.max(points.length - 1, 1)) * width},${height - ((point - min) / range) * height}`).join(" ");
  let min = 0; let max = 1; let range = 1; let path = "";
</script>
<svg {width} {height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Sparkline"><path d={path} fill="none" stroke="var(--color-accent)" stroke-width="2" /></svg>

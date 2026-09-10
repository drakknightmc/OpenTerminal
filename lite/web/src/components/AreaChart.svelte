<script lang="ts">
  export let points: number[] = []; export let width = 480; export let height = 180;
  $: min = Math.min(...points, 0); $: max = Math.max(...points, 1); $: range = max - min || 1; $: line = points.map((point, i) => `${i ? "L" : "M"}${(i / Math.max(points.length - 1, 1)) * width},${height - ((point - min) / range) * height}`).join(" "); $: area = `${line} L ${width},${height} L 0,${height} Z`;
  let min = 0; let max = 1; let range = 1; let line = ""; let area = "";
</script>
<svg {width} {height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Area chart"><path d={area} fill="var(--color-accent)" opacity=".14" /><path d={line} fill="none" stroke="var(--color-accent)" stroke-width="2" /></svg>

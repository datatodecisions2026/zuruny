import type { MonthlyRevenue } from "@/lib/admin-dashboard";
import { formatUSD } from "@/lib/catalog";

const W = 600;
const H = 180;
const PAD = 28;

/**
 * A single-series area chart, so per the dataviz method it carries no legend
 * (the card title names the series) and one hue does the whole job.
 * ponytail: plain SVG, no charting library — six points, once a day at most.
 */
export function RevenueChart({ data }: { data: MonthlyRevenue[] }) {
  const max = Math.max(...data.map((d) => d.cents), 1);
  const hasData = data.some((d) => d.cents > 0);
  const stepX = (W - PAD * 2) / (data.length - 1);
  const points = data.map((d, i) => ({
    x: PAD + i * stepX,
    y: H - PAD - (d.cents / max) * (H - PAD * 2 - 16),
    ...d,
  }));

  if (!hasData) {
    return <p className="py-16 text-center text-sm text-muted-foreground">No data yet.</p>;
  }

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${line} L${points[points.length - 1].x},${H - PAD} L${points[0].x},${H - PAD} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Revenue over the last 6 months">
      <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--admin-border)" strokeWidth={1} />
      <path d={area} fill="var(--admin-accent)" fillOpacity={0.12} />
      <path d={line} fill="none" stroke="var(--admin-accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p) => (
        <g key={p.month}>
          <circle cx={p.x} cy={p.y} r={4} fill="var(--admin-card)" stroke="var(--admin-accent)" strokeWidth={2}>
            <title>{`${p.month}: ${formatUSD(p.cents)}`}</title>
          </circle>
          <text x={p.x} y={H - 8} textAnchor="middle" fontSize={10} fill="var(--admin-muted-foreground)">
            {p.month}
          </text>
        </g>
      ))}
    </svg>
  );
}

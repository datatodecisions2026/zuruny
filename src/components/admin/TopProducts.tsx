import type { ProductUnits } from "@/lib/admin-dashboard";

/** Ranking by magnitude, one series — length encodes value, one hue does the whole job. */
export function TopProducts({ data }: { data: ProductUnits[] }) {
  if (data.length === 0) {
    return <p className="py-16 text-center text-sm text-muted-foreground">No data yet.</p>;
  }
  const max = Math.max(...data.map((d) => d.units));

  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.name} className="grid grid-cols-[7rem_1fr_2.5rem] items-center gap-3 text-sm">
          <span className="truncate text-foreground">{d.name}</span>
          <span className="h-2 overflow-hidden rounded-full bg-muted">
            <span
              className="block h-full rounded-full bg-accent"
              style={{ width: `${Math.max((d.units / max) * 100, 4)}%` }}
            />
          </span>
          <span className="admin-mono text-right text-xs text-muted-foreground">{d.units}</span>
        </li>
      ))}
    </ul>
  );
}

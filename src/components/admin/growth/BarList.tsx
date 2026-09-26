/** Ranked horizontal bars: one hue, value in text ink next to the bar. */
export function BarList({
  rows,
  emptyLabel,
}: {
  rows: { key: string; label: string; count: number; href?: string }[];
  emptyLabel: string;
}) {
  if (rows.length === 0) return <p className="py-4 text-sm text-dim">{emptyLabel}</p>;
  const max = Math.max(...rows.map((row) => row.count));
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li key={row.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-offwhite" dir="auto" title={row.label}>
              {row.label}
            </span>
            <span className="shrink-0 tabular-nums text-muted">
              {row.count}
              <span className="ms-1.5 text-[0.6875rem] text-dim">{Math.round((row.count / total) * 100)}%</span>
            </span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-graphite">
            <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(2, (row.count / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

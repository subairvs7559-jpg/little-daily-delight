import { dayLabel, formatMoney, type CurrencyCode, type DayGroup } from "@/lib/expenses";
import { ExpenseRow } from "./ExpenseRow";

export function DayGroupList({
  groups,
  currency,
}: {
  groups: DayGroup[];
  currency: CurrencyCode;
}) {
  const today = new Date();
  return (
    <div className="space-y-4">
      {groups.map((g, i) => (
        <section
          key={g.date}
          className="animate-rise rounded-[1.75rem] bg-card p-2 shadow-soft"
          style={{ animationDelay: `${Math.min(i, 6) * 50}ms` }}
        >
          <header className="flex items-center justify-between px-3 pb-1 pt-2">
            <h3 className="text-sm font-semibold text-muted-foreground">
              {dayLabel(g.date, today)}
            </h3>
            <span className="text-xs font-semibold tabular-nums text-muted-foreground">
              {formatMoney(g.total, currency)}
            </span>
          </header>
          {g.items.map((e) => (
            <ExpenseRow key={e.id} expense={e} currency={currency} />
          ))}
        </section>
      ))}
    </div>
  );
}

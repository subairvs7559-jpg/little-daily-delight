import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { addMonths, format, parseISO, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, PieChart } from "lucide-react";
import { CategoryIcon, catStyle } from "@/components/app/CategoryIcon";
import { EmptyState } from "@/components/app/EmptyState";
import { LoadingCards } from "@/components/app/LoadingCards";
import { PageHeader } from "@/components/app/PageHeader";
import {
  byCategory,
  dailyAverage,
  dailyTotals,
  formatMoney,
  inMonth,
  toMonthKey,
  total,
  type CategoryTotal,
} from "@/lib/expenses";
import { cn } from "@/lib/utils";
import { useAppState } from "@/lib/store";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights — Sprout" },
      { name: "description", content: "See where your money goes each month, by category and by day." },
      { property: "og:title", content: "Insights — Sprout" },
      { property: "og:description", content: "See where your money goes each month, by category and by day." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Insights,
});

function Donut({ data, center, sub }: { data: CategoryTotal[]; center: string; sub: string }) {
  const r = 68;
  const c = 2 * Math.PI * r;
  const gap = data.length > 1 ? 4 : 0;
  let offset = 0;
  return (
    <div className="relative mx-auto size-56">
      <svg viewBox="0 0 180 180" className="size-full -rotate-90">
        <circle cx="90" cy="90" r={r} fill="none" strokeWidth="20" className="stroke-muted" />
        {data.map((d) => {
          const len = Math.max(d.share * c - gap, 0.5);
          const el = (
            <circle
              key={d.category.key}
              cx="90"
              cy="90"
              r={r}
              fill="none"
              strokeWidth="20"
              strokeLinecap="round"
              style={{ stroke: d.category.color, transition: "stroke-dasharray .8s ease, stroke-dashoffset .8s ease" }}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
            />
          );
          offset += d.share * c;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{sub}</p>
          <p className="font-display text-2xl font-extrabold tabular-nums">{center}</p>
        </div>
      </div>
    </div>
  );
}

function Insights() {
  const { ready, expenses, settings } = useAppState();
  const [month, setMonth] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  if (!ready) return <div className="pt-24"><LoadingCards /></div>;

  const now = new Date();
  const current = toMonthKey(now);
  const m = month ?? current;
  const monthDate = parseISO(`${m}-01`);
  const list = inMonth(expenses, m);
  const spent = total(list);
  const cats = byCategory(list);
  const days = dailyTotals(expenses, m);
  const max = Math.max(...days, 1);
  const prevSpent = total(inMonth(expenses, toMonthKey(subMonths(monthDate, 1))));
  const change = prevSpent > 0 ? (spent - prevSpent) / prevSpent : null;
  const biggest = [...list].sort((a, b) => b.amount - a.amount)[0];
  const money = (n: number) => formatMoney(n, settings.currency);
  const todayIdx = m === current ? now.getDate() - 1 : -1;
  const shownDay = selectedDay ?? (todayIdx >= 0 ? todayIdx : null);

  const go = (dir: -1 | 1) => {
    const next = toMonthKey(dir < 0 ? subMonths(monthDate, 1) : addMonths(monthDate, 1));
    if (next > current) return;
    setMonth(next);
    setSelectedDay(null);
  };

  return (
    <div>
      <PageHeader title="Insights" subtitle="Where your money goes" />
      <div className="space-y-5 px-5">
        <div className="flex items-center justify-between rounded-full bg-card p-1.5 shadow-soft">
          <button type="button" aria-label="Previous month" onClick={() => go(-1)} className="press grid size-10 place-items-center rounded-full hover:bg-muted">
            <ChevronLeft className="size-5" />
          </button>
          <span key={m} className="animate-pop font-display text-base font-bold">
            {format(monthDate, "MMMM yyyy")}
          </span>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => go(1)}
            disabled={m >= current}
            className="press grid size-10 place-items-center rounded-full hover:bg-muted disabled:opacity-30"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        {list.length === 0 ? (
          <EmptyState icon={PieChart} title="Nothing this month" text="Expenses you add for this month will show up here." />
        ) : (
          <>
            <section key={`d-${m}`} className="animate-rise rounded-[1.75rem] bg-card p-5 shadow-soft">
              <Donut data={cats} center={money(spent)} sub="Total spent" />
              <div className="mt-5 space-y-2.5">
                {cats.map((c) => (
                  <div key={c.category.key} className="flex items-center gap-3">
                    <CategoryIcon category={c.category.key} size="sm" />
                    <span className="flex-1 text-sm font-semibold">
                      {c.category.label}
                      <span className="ml-1.5 text-xs font-medium text-muted-foreground">
                        {c.count} {c.count === 1 ? "item" : "items"}
                      </span>
                    </span>
                    <span className="text-sm font-bold tabular-nums">{money(c.total)}</span>
                    <span
                      style={catStyle(c.category.color)}
                      className="cat-tint w-12 rounded-full py-0.5 text-center text-xs font-bold tabular-nums"
                    >
                      {Math.round(c.share * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-2 gap-3">
              <Stat label="Daily average" value={money(dailyAverage(expenses, m, now))} />
              <Stat
                label="vs last month"
                value={change === null ? "—" : `${change > 0 ? "+" : ""}${Math.round(change * 100)}%`}
                tone={change === null ? undefined : change > 0 ? "bad" : "good"}
              />
              <Stat label="Expenses" value={String(list.length)} />
              <Stat label="Biggest" value={biggest ? money(biggest.amount) : "—"} hint={biggest?.note} />
            </div>

            <section className="animate-rise rounded-[1.75rem] bg-card p-5 shadow-soft">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="text-base font-bold">Day by day</h2>
                {shownDay !== null && (
                  <span className="text-sm font-semibold text-muted-foreground">
                    {format(new Date(monthDate.getFullYear(), monthDate.getMonth(), shownDay + 1), "d MMM")} ·{" "}
                    <span className="text-foreground">{money(days[shownDay] ?? 0)}</span>
                  </span>
                )}
              </div>
              <div className="flex h-32 items-end gap-[3px]">
                {days.map((v, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Day ${i + 1}: ${money(v)}`}
                    onClick={() => setSelectedDay(i)}
                    className="flex h-full flex-1 items-end"
                  >
                    <span
                      className={cn(
                        "w-full rounded-full transition-all duration-500",
                        i === shownDay ? "bg-primary" : v > 0 ? "bg-primary/35" : "bg-muted",
                      )}
                      style={{ height: `${v > 0 ? Math.max((v / max) * 100, 6) : 4}%` }}
                    />
                  </button>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[10px] font-medium text-muted-foreground">
                <span>1</span>
                <span>{Math.ceil(days.length / 2)}</span>
                <span>{days.length}</span>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string | undefined; tone?: "good" | "bad" | undefined }) {
  return (
    <div className="animate-rise rounded-[1.5rem] bg-card p-4 shadow-soft">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 truncate font-display text-xl font-extrabold tabular-nums",
          tone === "good" && "text-success",
          tone === "bad" && "text-destructive",
        )}
      >
        {value}
      </p>
      {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowRight, Sprout as SproutIcon, Wallet } from "lucide-react";
import { CategoryIcon, catStyle } from "@/components/app/CategoryIcon";
import { DayGroupList } from "@/components/app/DayGroupList";
import { EmptyState } from "@/components/app/EmptyState";
import { LoadingCards } from "@/components/app/LoadingCards";
import {
  budgetStatus,
  byCategory,
  CATEGORIES,
  dailyAverage,
  formatMoney,
  groupByDate,
  inMonth,
  onDate,
  toDateKey,
  toMonthKey,
  total,
} from "@/lib/expenses";
import { cn } from "@/lib/utils";
import { sheetActions, useAppState } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sprout — Your spending at a glance" },
      { name: "description", content: "See this month's spending, your budget and recent expenses." },
      { property: "og:title", content: "Sprout — Your spending at a glance" },
      { property: "og:description", content: "See this month's spending, your budget and recent expenses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function greeting(h: number) {
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function Home() {
  const { ready, expenses, settings } = useAppState();
  if (!ready) return <div className="pt-24"><LoadingCards /></div>;

  const now = new Date();
  const month = toMonthKey(now);
  const monthExpenses = inMonth(expenses, month);
  const spent = total(monthExpenses);
  const status = budgetStatus(spent, settings.budget);
  const todaySpent = total(onDate(expenses, toDateKey(now)));
  const avg = dailyAverage(expenses, month, now);
  const top = byCategory(monthExpenses).slice(0, 3);
  const recent = groupByDate([...expenses].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8)).slice(0, 3);
  const money = (n: number) => formatMoney(n, settings.currency);

  return (
    <div>
      <header className="flex items-center justify-between px-5 pb-5 pt-8">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {greeting(now.getHours())}
            {settings.name ? `, ${settings.name}` : ""} 👋
          </p>
          <h1 className="flex items-center gap-1.5 text-[2rem] font-extrabold leading-tight">
            Sprout
            <SproutIcon className="size-6 text-success" strokeWidth={2.4} />
          </h1>
        </div>
        <Link
          to="/settings"
          aria-label="Settings"
          className="press grid size-11 place-items-center rounded-full bg-primary-soft font-display text-lg font-bold text-primary"
        >
          {(settings.name || "S").charAt(0).toUpperCase()}
        </Link>
      </header>

      <div className="space-y-5 px-5">
        {/* Budget hero */}
        <section className="animate-rise relative overflow-hidden rounded-[2rem] bg-hero p-6 text-primary-foreground shadow-glow">
          <div className="absolute -right-10 -top-12 size-40 rounded-full bg-primary-foreground/10" />
          <div className="absolute -bottom-16 right-10 size-32 rounded-full bg-primary-foreground/10" />
          <p className="relative text-sm font-medium opacity-85">Spent in {format(now, "MMMM")}</p>
          <p className="relative mt-1 font-display text-[2.75rem] font-extrabold leading-none tabular-nums">
            {money(spent)}
          </p>
          {settings.budget > 0 ? (
            <div className="relative mt-5">
              <div className="h-2.5 overflow-hidden rounded-full bg-primary-foreground/25">
                <div
                  className="h-full rounded-full bg-primary-foreground transition-[width] duration-700 ease-out"
                  style={{ width: `${Math.max(status.ratio * 100, 3)}%` }}
                />
              </div>
              <p className="mt-2 text-sm font-medium opacity-90">
                {status.over
                  ? `${money(-status.remaining)} over your ${money(settings.budget)} budget`
                  : `${money(status.remaining)} left of ${money(settings.budget)}`}
              </p>
            </div>
          ) : (
            <Link to="/settings" className="relative mt-4 inline-block text-sm font-semibold underline">
              Set a monthly budget
            </Link>
          )}
          <div className="relative mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-primary-foreground/15 px-3 py-2.5 backdrop-blur">
              <p className="text-xs opacity-80">Today</p>
              <p className="font-display text-lg font-bold tabular-nums">{money(todaySpent)}</p>
            </div>
            <div className="rounded-2xl bg-primary-foreground/15 px-3 py-2.5 backdrop-blur">
              <p className="text-xs opacity-80">Daily average</p>
              <p className="font-display text-lg font-bold tabular-nums">{money(avg)}</p>
            </div>
          </div>
        </section>

        {/* Quick add */}
        <section className="animate-rise" style={{ animationDelay: "80ms" }}>
          <h2 className="mb-2.5 px-1 text-base font-bold">Quick add</h2>
          <div className="no-scrollbar -mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => sheetActions.openAdd(c.key)}
                className="press flex shrink-0 flex-col items-center gap-1.5 rounded-[1.25rem] bg-card px-3 py-3 shadow-soft"
              >
                <CategoryIcon category={c.key} />
                <span className="text-xs font-semibold">{c.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Where it goes */}
        {top.length > 0 && (
          <section
            className="animate-rise rounded-[1.75rem] bg-card p-5 shadow-soft"
            style={{ animationDelay: "140ms" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold">Where it goes</h2>
              <Link to="/insights" className="flex items-center gap-1 text-sm font-semibold text-primary">
                Insights <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="space-y-3.5">
              {top.map((t) => (
                <div key={t.category.key} className="flex items-center gap-3">
                  <CategoryIcon category={t.category.key} size="sm" />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold">{t.category.label}</span>
                      <span className="font-semibold tabular-nums">{money(t.total)}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted" style={catStyle(t.category.color)}>
                      <div
                        className="cat-fill h-full rounded-full transition-[width] duration-700"
                        style={{ width: `${Math.max(t.share * 100, 4)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent */}
        <section className="animate-rise" style={{ animationDelay: "200ms" }}>
          <div className="mb-2.5 flex items-center justify-between px-1">
            <h2 className="text-base font-bold">Recent</h2>
            {expenses.length > 0 && (
              <Link to="/history" className="flex items-center gap-1 text-sm font-semibold text-primary">
                See all <ArrowRight className="size-4" />
              </Link>
            )}
          </div>
          {recent.length > 0 ? (
            <DayGroupList groups={recent} currency={settings.currency} />
          ) : (
            <EmptyState
              icon={Wallet}
              title="No expenses yet"
              text="Tap the + button to log what you spend. It takes two seconds."
              action={
                <button
                  type="button"
                  onClick={() => sheetActions.openAdd()}
                  className={cn("press h-11 rounded-full bg-hero px-6 font-semibold text-primary-foreground shadow-glow")}
                >
                  Add your first expense
                </button>
              }
            />
          )}
        </section>
      </div>
    </div>
  );
}

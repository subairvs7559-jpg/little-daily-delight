import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, SearchX, X } from "lucide-react";
import { catStyle } from "@/components/app/CategoryIcon";
import { DayGroupList } from "@/components/app/DayGroupList";
import { EmptyState } from "@/components/app/EmptyState";
import { LoadingCards } from "@/components/app/LoadingCards";
import { PageHeader } from "@/components/app/PageHeader";
import { CATEGORIES, formatMoney, getCategory, groupByDate, total, type CategoryKey } from "@/lib/expenses";
import { cn } from "@/lib/utils";
import { useAppState } from "@/lib/store";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — Sprout" },
      { name: "description", content: "Search and filter every expense you've logged." },
      { property: "og:title", content: "History — Sprout" },
      { property: "og:description", content: "Search and filter every expense you've logged." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { ready, expenses, settings } = useAppState();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CategoryKey | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return expenses.filter(
      (e) =>
        (filter === "all" || e.category === filter) &&
        (!q || e.note.toLowerCase().includes(q) || getCategory(e.category).label.toLowerCase().includes(q)),
    );
  }, [expenses, query, filter]);

  if (!ready) return <div className="pt-24"><LoadingCards /></div>;
  const groups = groupByDate(filtered);

  return (
    <div>
      <PageHeader
        title="History"
        subtitle={`${filtered.length} ${filtered.length === 1 ? "expense" : "expenses"}`}
        right={
          <span className="rounded-full bg-primary-soft px-3 py-1.5 font-display text-sm font-bold text-primary tabular-nums">
            {formatMoney(total(filtered), settings.currency)}
          </span>
        }
      />
      <div className="space-y-4 px-5">
        <label className="flex h-12 items-center gap-2 rounded-2xl bg-card px-4 shadow-soft focus-within:ring-2 focus-within:ring-ring/40">
          <Search className="size-5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes or categories"
            className="h-full flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="press text-muted-foreground">
              <X className="size-4" />
            </button>
          )}
        </label>

        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
          <Chip active={filter === "all"} onClick={() => setFilter("all")}>All</Chip>
          {CATEGORIES.map((c) => (
            <Chip key={c.key} active={filter === c.key} onClick={() => setFilter(c.key)} color={c.color}>
              {c.label}
            </Chip>
          ))}
        </div>

        {groups.length > 0 ? (
          <DayGroupList groups={groups} currency={settings.currency} />
        ) : (
          <EmptyState
            icon={SearchX}
            title={expenses.length ? "No matches" : "Nothing here yet"}
            text={expenses.length ? "Try another word or category." : "Your expenses will appear here once you add some."}
          />
        )}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean;
  onClick: () => void;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={color ? catStyle(color) : undefined}
      className={cn(
        "press flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-all duration-200",
        active ? (color ? "cat-fill shadow-soft" : "bg-foreground text-background") : "bg-card text-muted-foreground shadow-soft",
      )}
    >
      {color && !active && <span className="size-2 rounded-full" style={{ background: color }} />}
      {children}
    </button>
  );
}

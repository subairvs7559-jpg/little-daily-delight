import { Link, useRouterState } from "@tanstack/react-router";
import { History, Home, PieChart, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { sheetActions } from "@/lib/store";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/insights", label: "Insights", icon: PieChart },
  null,
  { to: "/history", label: "History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-4">
      <div className="flex items-center justify-between rounded-[1.75rem] border bg-card/85 px-2 py-2 shadow-float backdrop-blur-xl">
        {items.map((item) => {
          if (!item) {
            return (
              <button
                key="add"
                type="button"
                aria-label="Add expense"
                onClick={() => sheetActions.openAdd()}
                className="press -mt-9 grid size-[3.75rem] place-items-center rounded-full bg-hero text-primary-foreground shadow-glow ring-4 ring-background"
              >
                <Plus className="size-7" strokeWidth={2.6} />
              </button>
            );
          }
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "press flex w-16 flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-semibold transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "grid h-8 w-12 place-items-center rounded-full transition-all duration-300",
                  active && "bg-primary-soft",
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

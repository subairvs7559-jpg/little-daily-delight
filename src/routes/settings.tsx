import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Moon, Smartphone, Sparkles, Sun, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { LoadingCards } from "@/components/app/LoadingCards";
import { PageHeader } from "@/components/app/PageHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CURRENCIES, currencySymbol, formatMoney, toCsv, toDateKey } from "@/lib/expenses";
import { cn } from "@/lib/utils";
import { actions, useAppState, type ThemePref } from "@/lib/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Sprout" },
      { name: "description", content: "Set your name, monthly budget, currency and light or dark look." },
      { property: "og:title", content: "Settings — Sprout" },
      { property: "og:description", content: "Set your name, monthly budget, currency and light or dark look." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

const THEMES: { key: ThemePref; label: string; icon: typeof Sun }[] = [
  { key: "light", label: "Light", icon: Sun },
  { key: "dark", label: "Dark", icon: Moon },
  { key: "system", label: "Auto", icon: Smartphone },
];

function SettingsPage() {
  const { ready, settings, expenses } = useAppState();
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");

  useEffect(() => {
    if (!ready) return;
    setName(settings.name);
    setBudget(settings.budget ? String(settings.budget) : "");
  }, [ready, settings.name, settings.budget]);

  if (!ready) return <div className="pt-24"><LoadingCards /></div>;

  const saveName = () => {
    const v = name.trim();
    if (v === settings.name) return;
    actions.updateSettings({ name: v });
    toast.success(v ? `Nice to meet you, ${v}!` : "Name cleared");
  };
  const saveBudget = () => {
    const v = Math.max(0, Math.round(Number(budget) || 0));
    if (v === settings.budget) return;
    actions.updateSettings({ budget: v });
    toast.success(v ? `Budget set to ${formatMoney(v, settings.currency)}` : "Budget turned off");
  };
  const exportCsv = () => {
    if (!expenses.length) return toast("No expenses to export yet");
    const url = URL.createObjectURL(new Blob([toCsv(expenses)], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `sprout-expenses-${toDateKey(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${expenses.length} expenses`);
  };

  const themeIndex = THEMES.findIndex((t) => t.key === settings.theme);

  return (
    <div>
      <PageHeader title="Settings" subtitle="Make Sprout yours" />
      <div className="space-y-5 px-5">
        <Card title="You">
          <Field label="Your name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              maxLength={24}
              placeholder="What should we call you?"
              className="h-12 w-full rounded-2xl bg-muted px-4 text-[15px] outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
            />
          </Field>
          <Field label="Monthly budget">
            <div className="flex h-12 items-center rounded-2xl bg-muted px-4 focus-within:ring-2 focus-within:ring-ring/40">
              <span className="mr-2 font-display font-bold text-muted-foreground">
                {currencySymbol(settings.currency)}
              </span>
              <input
                value={budget}
                inputMode="numeric"
                onChange={(e) => setBudget(e.target.value.replace(/[^\d]/g, "").slice(0, 9))}
                onBlur={saveBudget}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                placeholder="No budget"
                className="h-full flex-1 bg-transparent text-[15px] font-semibold tabular-nums outline-none placeholder:font-normal placeholder:text-muted-foreground"
              />
            </div>
          </Field>
        </Card>

        <Card title="Appearance">
          <div className="relative grid grid-cols-3 rounded-2xl bg-muted p-1">
            <span
              className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-xl bg-card shadow-soft transition-transform duration-300 ease-out"
              style={{ transform: `translateX(${themeIndex * 100}%)` }}
            />
            {THEMES.map((t) => {
              const Icon = t.icon;
              const active = t.key === settings.theme;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => actions.updateSettings({ theme: t.key })}
                  className={cn(
                    "press relative z-10 flex h-11 items-center justify-center gap-1.5 text-sm font-semibold transition-colors",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  <Icon className={cn("size-4", active && "text-primary")} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </Card>

        <Card title="Currency">
          <div className="grid grid-cols-3 gap-2">
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => actions.updateSettings({ currency: c.code })}
                className={cn(
                  "press flex flex-col items-center rounded-2xl border-2 py-2.5 transition-all",
                  settings.currency === c.code
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-transparent bg-muted text-muted-foreground",
                )}
              >
                <span className="font-display text-lg font-bold">{currencySymbol(c.code)}</span>
                <span className="text-[11px] font-semibold">{c.code}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card title="Your data">
          <p className="-mt-1 mb-2 text-sm text-muted-foreground">
            Everything is saved privately on this phone. {expenses.length} expenses stored.
          </p>
          <Row icon={Download} label="Export as spreadsheet (CSV)" onClick={exportCsv} />
          <Row
            icon={Sparkles}
            label="Load sample expenses"
            onClick={() => {
              actions.loadSamples();
              toast.success("Sample expenses added");
            }}
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Row icon={Trash2} label="Delete all expenses" danger />
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-[22rem] rounded-[1.75rem]">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display">Delete all expenses?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes all {expenses.length} expenses from this phone. Your settings stay. This can't be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-full">Keep them</AlertDialogCancel>
                <AlertDialogAction
                  className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    actions.clearExpenses();
                    toast("All expenses deleted");
                  }}
                >
                  Delete all
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Card>

        <p className="flex items-center justify-center gap-1.5 pb-2 text-xs text-muted-foreground">
          Sprout · made to help your money grow 🌱
        </p>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="animate-rise rounded-[1.75rem] bg-card p-5 shadow-soft">
      <h2 className="mb-3 text-base font-bold">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Row({
  icon: Icon,
  label,
  danger,
  ...props
}: { icon: typeof Sun; label: string; danger?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "press flex w-full items-center gap-3 rounded-2xl bg-muted px-4 py-3.5 text-left text-[15px] font-semibold transition-colors",
        danger ? "text-destructive" : "text-foreground",
      )}
    >
      <Icon className="size-[18px]" />
      {label}
    </button>
  );
}

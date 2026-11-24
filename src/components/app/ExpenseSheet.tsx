import { useEffect, useState } from "react";
import { subDays } from "date-fns";
import { CalendarDays, Delete, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import {
  CATEGORIES,
  currencySymbol,
  formatMoney,
  getCategory,
  newId,
  toDateKey,
  type CategoryKey,
} from "@/lib/expenses";
import { actions, sheetActions, useAppState, useSheet } from "@/lib/store";
import { catStyle } from "./CategoryIcon";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"] as const;

function nextAmount(prev: string, key: (typeof KEYS)[number]) {
  if (key === "back") return prev.slice(0, -1);
  if (key === ".") return prev.includes(".") ? prev : `${prev || "0"}.`;
  const [, decimals] = prev.split(".");
  if (decimals !== undefined && decimals.length >= 2) return prev;
  if (prev === "0") return key;
  if (prev.replace(".", "").length >= 8) return prev;
  return prev + key;
}

export function ExpenseSheet() {
  const { open, editing, presetCategory } = useSheet();
  const { settings } = useAppState();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CategoryKey>("food");
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");
  const [shake, setShake] = useState(0);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setAmount(String(editing.amount));
      setCategory(editing.category);
      setNote(editing.note);
      setDate(editing.date);
    } else {
      setAmount("");
      setCategory(presetCategory ?? "food");
      setNote("");
      setDate(toDateKey(new Date()));
    }
  }, [open, editing, presetCategory]);

  const value = Number(amount || "0");
  const today = toDateKey(new Date());
  const yesterday = toDateKey(subDays(new Date(), 1));

  function save() {
    if (!(value > 0)) {
      setShake((n) => n + 1);
      return;
    }
    const label = `${formatMoney(value, settings.currency)} · ${getCategory(category).label}`;
    if (editing) {
      actions.updateExpense({ ...editing, amount: value, category, note: note.trim(), date });
      toast.success("Expense updated", { description: label });
    } else {
      actions.addExpense({
        id: newId(),
        amount: value,
        category,
        note: note.trim(),
        date,
        createdAt: Date.now(),
      });
      toast.success("Expense added", { description: label });
    }
    sheetActions.close();
  }

  function remove() {
    if (!editing) return;
    const removed = editing;
    actions.deleteExpense(removed.id);
    sheetActions.close();
    toast("Expense deleted", {
      description: formatMoney(removed.amount, settings.currency),
      action: { label: "Undo", onClick: () => actions.addExpense(removed) },
    });
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(o) => !o && sheetActions.close()}
      shouldScaleBackground={false}
    >
      <DrawerContent>
        <div className="no-scrollbar overflow-y-auto px-5 pb-6">
          <div className="flex items-center justify-between pt-3">
            <div>
              <DrawerTitle className="font-display text-xl font-bold">
                {editing ? "Edit expense" : "New expense"}
              </DrawerTitle>
              <DrawerDescription className="text-xs">
                {editing ? "Change anything, then save." : "How much did you spend?"}
              </DrawerDescription>
            </div>
            {editing && (
              <button
                type="button"
                onClick={remove}
                aria-label="Delete expense"
                className="press grid size-10 place-items-center rounded-full bg-destructive/10 text-destructive"
              >
                <Trash2 className="size-[18px]" />
              </button>
            )}
          </div>

          {/* Amount */}
          <div
            key={shake}
            className={cn(
              "mt-4 flex items-baseline justify-center gap-1 py-2",
              shake > 0 && "animate-wiggle",
            )}
          >
            <span className="font-display text-3xl font-bold text-muted-foreground">
              {currencySymbol(settings.currency)}
            </span>
            <span
              key={amount}
              className={cn(
                "animate-pop font-display text-6xl font-extrabold tabular-nums tracking-tight",
                !amount && "text-muted-foreground/50",
              )}
            >
              {amount || "0"}
            </span>
          </div>

          {/* Categories */}
          <div className="mt-3 grid grid-cols-4 gap-2">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const active = c.key === category;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(c.key)}
                  style={catStyle(c.color)}
                  className={cn(
                    "press flex flex-col items-center gap-1 rounded-2xl border-2 py-2 text-[11px] font-semibold transition-all duration-200",
                    active ? "cat-border cat-tint" : "border-transparent bg-muted text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-8 place-items-center rounded-xl transition-colors",
                      active ? "cat-fill" : "cat-text",
                    )}
                  >
                    <Icon className="size-4" strokeWidth={2.3} />
                  </span>
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Note + date */}
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={60}
            placeholder="Add a note (optional)"
            className="mt-3 h-12 w-full rounded-2xl bg-muted px-4 text-[15px] outline-none ring-ring/40 placeholder:text-muted-foreground focus:ring-2"
          />
          <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
            {[
              { key: today, label: "Today" },
              { key: yesterday, label: "Yesterday" },
            ].map((d) => (
              <button
                key={d.label}
                type="button"
                onClick={() => setDate(d.key)}
                className={cn(
                  "press h-9 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors",
                  date === d.key ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
                )}
              >
                {d.label}
              </button>
            ))}
            <label
              className={cn(
                "press relative flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors",
                date !== today && date !== yesterday
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <CalendarDays className="size-4" />
              {date !== today && date !== yesterday ? date : "Pick date"}
              <input
                type="date"
                value={date}
                max={today}
                onChange={(e) => e.target.value && setDate(e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label="Pick a date"
              />
            </label>
          </div>

          {/* Keypad */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {KEYS.map((k) => (
              <button
                key={k}
                type="button"
                aria-label={k === "back" ? "Delete digit" : k}
                onClick={() => setAmount((p) => nextAmount(p, k))}
                className="press grid h-14 place-items-center rounded-2xl bg-secondary font-display text-2xl font-semibold transition-colors active:bg-primary-soft"
              >
                {k === "back" ? <Delete className="size-6" /> : k}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={save}
            className={cn(
              "press mt-4 h-14 w-full rounded-2xl font-display text-lg font-bold transition-all duration-300",
              value > 0
                ? "bg-hero text-primary-foreground shadow-glow"
                : "bg-muted text-muted-foreground",
            )}
          >
            {editing ? "Save changes" : value > 0 ? `Add ${formatMoney(value, settings.currency)}` : "Enter an amount"}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

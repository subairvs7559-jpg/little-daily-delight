import { format, getDaysInMonth, parseISO, subDays } from "date-fns";
import {
  Bus,
  Gamepad2,
  HeartPulse,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Utensils,
  type LucideIcon,
} from "lucide-react";

export type CategoryKey =
  | "food"
  | "groceries"
  | "transport"
  | "shopping"
  | "bills"
  | "fun"
  | "health"
  | "other";

export interface Category {
  key: CategoryKey;
  label: string;
  icon: LucideIcon;
  /** CSS colour value referencing a design token */
  color: string;
}

export const CATEGORIES: Category[] = [
  { key: "food", label: "Food", icon: Utensils, color: "var(--cat-1)" },
  { key: "groceries", label: "Groceries", icon: ShoppingCart, color: "var(--cat-2)" },
  { key: "transport", label: "Transport", icon: Bus, color: "var(--cat-3)" },
  { key: "shopping", label: "Shopping", icon: ShoppingBag, color: "var(--cat-4)" },
  { key: "bills", label: "Bills", icon: Receipt, color: "var(--cat-5)" },
  { key: "fun", label: "Fun", icon: Gamepad2, color: "var(--cat-6)" },
  { key: "health", label: "Health", icon: HeartPulse, color: "var(--cat-7)" },
  { key: "other", label: "Other", icon: Sparkles, color: "var(--cat-8)" },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.key, c])) as Record<
  CategoryKey,
  Category
>;

export function getCategory(key: string): Category {
  return CATEGORY_MAP[key as CategoryKey] ?? CATEGORY_MAP.other;
}

export interface Expense {
  id: string;
  amount: number;
  category: CategoryKey;
  note: string;
  /** yyyy-MM-dd, local date */
  date: string;
  createdAt: number;
}

export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP" | "AED" | "JPY";

export const CURRENCIES: { code: CurrencyCode; label: string; locale: string }[] = [
  { code: "INR", label: "Indian Rupee", locale: "en-IN" },
  { code: "USD", label: "US Dollar", locale: "en-US" },
  { code: "EUR", label: "Euro", locale: "de-DE" },
  { code: "GBP", label: "British Pound", locale: "en-GB" },
  { code: "AED", label: "UAE Dirham", locale: "en-AE" },
  { code: "JPY", label: "Japanese Yen", locale: "ja-JP" },
];

function localeFor(currency: CurrencyCode) {
  return CURRENCIES.find((c) => c.code === currency)?.locale ?? "en-US";
}

export function formatMoney(amount: number, currency: CurrencyCode) {
  const whole = Math.abs(amount % 1) < 0.005;
  return new Intl.NumberFormat(localeFor(currency), {
    style: "currency",
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(amount);
}

export function currencySymbol(currency: CurrencyCode) {
  const parts = new Intl.NumberFormat(localeFor(currency), {
    style: "currency",
    currency,
  }).formatToParts(0);
  return parts.find((p) => p.type === "currency")?.value ?? currency;
}

export const toDateKey = (d: Date) => format(d, "yyyy-MM-dd");
export const toMonthKey = (d: Date) => format(d, "yyyy-MM");

const round2 = (n: number) => Math.round(n * 100) / 100;

export function total(expenses: Expense[]) {
  return round2(expenses.reduce((sum, e) => sum + e.amount, 0));
}

export function inMonth(expenses: Expense[], monthKey: string) {
  return expenses.filter((e) => e.date.startsWith(monthKey));
}

export function onDate(expenses: Expense[], dateKey: string) {
  return expenses.filter((e) => e.date === dateKey);
}

export interface CategoryTotal {
  category: Category;
  total: number;
  share: number;
  count: number;
}

export function byCategory(expenses: Expense[]): CategoryTotal[] {
  const sum = total(expenses);
  const map = new Map<CategoryKey, { total: number; count: number }>();
  for (const e of expenses) {
    const cur = map.get(e.category) ?? { total: 0, count: 0 };
    cur.total += e.amount;
    cur.count += 1;
    map.set(e.category, cur);
  }
  return [...map.entries()]
    .map(([key, v]) => ({
      category: getCategory(key),
      total: round2(v.total),
      count: v.count,
      share: sum > 0 ? v.total / sum : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export function budgetStatus(spent: number, budget: number) {
  const remaining = round2(budget - spent);
  return {
    remaining,
    over: budget > 0 && spent > budget,
    ratio: budget > 0 ? Math.min(spent / budget, 1) : 0,
  };
}

/** Average spend per day: elapsed days for the current month, all days for past months. */
export function dailyAverage(expenses: Expense[], monthKey: string, today: Date) {
  const monthDate = parseISO(`${monthKey}-01`);
  const days = monthKey === toMonthKey(today) ? today.getDate() : getDaysInMonth(monthDate);
  return days > 0 ? round2(total(inMonth(expenses, monthKey)) / days) : 0;
}

export function dailyTotals(expenses: Expense[], monthKey: string) {
  const days = getDaysInMonth(parseISO(`${monthKey}-01`));
  const totals = Array.from({ length: days }, () => 0);
  for (const e of inMonth(expenses, monthKey)) {
    const day = Number(e.date.slice(8, 10));
    if (day >= 1 && day <= days) totals[day - 1] = round2((totals[day - 1] ?? 0) + e.amount);
  }
  return totals;
}

export interface DayGroup {
  date: string;
  items: Expense[];
  total: number;
}

export function groupByDate(expenses: Expense[]): DayGroup[] {
  const map = new Map<string, Expense[]>();
  for (const e of expenses) {
    const list = map.get(e.date) ?? [];
    list.push(e);
    map.set(e.date, list);
  }
  return [...map.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([date, items]) => ({
      date,
      items: items.sort((a, b) => b.createdAt - a.createdAt),
      total: total(items),
    }));
}

export function dayLabel(dateKey: string, today: Date) {
  if (dateKey === toDateKey(today)) return "Today";
  if (dateKey === toDateKey(subDays(today, 1))) return "Yesterday";
  return format(parseISO(dateKey), "EEE, d MMM");
}

export function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function sampleExpenses(today: Date): Expense[] {
  const rows: [number, number, CategoryKey, string][] = [
    [0, 180, "food", "Morning chai & snacks"],
    [0, 60, "transport", "Auto ride"],
    [1, 1240, "groceries", "Weekly groceries"],
    [1, 349, "fun", "Movie night"],
    [2, 499, "bills", "Mobile recharge"],
    [3, 850, "shopping", "New T-shirt"],
    [4, 420, "food", "Dinner with friends"],
    [5, 220, "health", "Pharmacy"],
    [6, 150, "transport", "Metro card top-up"],
    [8, 1800, "bills", "Electricity bill"],
  ];
  return rows.map(([daysAgo, amount, category, note], i) => ({
    id: `sample-${i}`,
    amount,
    category,
    note,
    date: toDateKey(subDays(today, daysAgo)),
    createdAt: subDays(today, daysAgo).getTime() - i * 60000,
  }));
}

export function toCsv(expenses: Expense[]) {
  const header = "Date,Category,Note,Amount";
  const lines = [...expenses]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map(
      (e) =>
        `${e.date},${getCategory(e.category).label},"${e.note.replace(/"/g, '""')}",${e.amount}`,
    );
  return [header, ...lines].join("\n");
}

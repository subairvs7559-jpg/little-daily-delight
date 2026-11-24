import { useSyncExternalStore } from "react";
import { sampleExpenses, type CurrencyCode, type Expense, type CategoryKey } from "./expenses";

export type ThemePref = "light" | "dark" | "system";

export interface Settings {
  name: string;
  currency: CurrencyCode;
  budget: number;
  theme: ThemePref;
}

export interface AppState {
  /** false during SSR/hydration, true once device storage is read */
  ready: boolean;
  expenses: Expense[];
  settings: Settings;
}

export const STORAGE_KEY = "sprout:v1";

export const DEFAULT_SETTINGS: Settings = {
  name: "",
  currency: "INR",
  budget: 20000,
  theme: "system",
};

const SERVER_STATE: AppState = { ready: false, expenses: [], settings: DEFAULT_SETTINGS };

let state: AppState | null = null;
const listeners = new Set<() => void>();

function persist(s: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ expenses: s.expenses, settings: s.settings }));
  } catch {
    /* storage full or blocked */
  }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      return {
        ready: true,
        expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      };
    }
  } catch {
    /* fall through to a fresh start */
  }
  const fresh: AppState = {
    ready: true,
    expenses: sampleExpenses(new Date()),
    settings: DEFAULT_SETTINGS,
  };
  persist(fresh);
  return fresh;
}

function getSnapshot(): AppState {
  if (!state) state = load();
  return state;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setState(updater: (s: AppState) => AppState) {
  state = updater(getSnapshot());
  persist(state);
  listeners.forEach((l) => l());
}

export function useAppState() {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_STATE);
}

export const actions = {
  addExpense(e: Expense) {
    setState((s) => ({ ...s, expenses: [e, ...s.expenses] }));
  },
  updateExpense(e: Expense) {
    setState((s) => ({ ...s, expenses: s.expenses.map((x) => (x.id === e.id ? e : x)) }));
  },
  deleteExpense(id: string) {
    setState((s) => ({ ...s, expenses: s.expenses.filter((x) => x.id !== id) }));
  },
  updateSettings(patch: Partial<Settings>) {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  },
  clearExpenses() {
    setState((s) => ({ ...s, expenses: [] }));
  },
  loadSamples() {
    setState((s) => ({
      ...s,
      expenses: [...sampleExpenses(new Date()), ...s.expenses.filter((e) => !e.id.startsWith("sample-"))],
    }));
  },
};

/* ---------- Add/edit sheet UI state ---------- */

export interface SheetState {
  open: boolean;
  editing: Expense | null;
  presetCategory: CategoryKey | null;
}

const CLOSED: SheetState = { open: false, editing: null, presetCategory: null };
let sheet: SheetState = CLOSED;
const sheetListeners = new Set<() => void>();

function setSheet(next: SheetState) {
  sheet = next;
  sheetListeners.forEach((l) => l());
}

export function useSheet() {
  return useSyncExternalStore(
    (l) => {
      sheetListeners.add(l);
      return () => sheetListeners.delete(l);
    },
    () => sheet,
    () => CLOSED,
  );
}

export const sheetActions = {
  openAdd(presetCategory: CategoryKey | null = null) {
    setSheet({ open: true, editing: null, presetCategory });
  },
  openEdit(expense: Expense) {
    setSheet({ open: true, editing: expense, presetCategory: null });
  },
  close() {
    setSheet({ ...sheet, open: false });
  },
};

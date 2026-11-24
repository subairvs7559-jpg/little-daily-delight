import { getCategory, formatMoney, type CurrencyCode, type Expense } from "@/lib/expenses";
import { sheetActions } from "@/lib/store";
import { CategoryIcon } from "./CategoryIcon";

export function ExpenseRow({ expense, currency }: { expense: Expense; currency: CurrencyCode }) {
  const cat = getCategory(expense.category);
  return (
    <button
      type="button"
      onClick={() => sheetActions.openEdit(expense)}
      className="press flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition-colors hover:bg-muted/70"
    >
      <CategoryIcon category={expense.category} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold">
          {expense.note || cat.label}
        </span>
        <span className="block text-xs text-muted-foreground">{cat.label}</span>
      </span>
      <span className="font-display text-[15px] font-bold tabular-nums">
        −{formatMoney(expense.amount, currency)}
      </span>
    </button>
  );
}

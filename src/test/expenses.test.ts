import { describe, expect, it } from "vitest";
import {
  budgetStatus,
  byCategory,
  dailyAverage,
  dailyTotals,
  inMonth,
  total,
  type Expense,
} from "@/lib/expenses";

const e = (amount: number, category: Expense["category"], date: string): Expense => ({
  id: `${amount}-${date}`,
  amount,
  category,
  note: "",
  date,
  createdAt: 0,
});

const list = [
  e(100, "food", "2026-11-01"),
  e(300, "bills", "2026-11-03"),
  e(100, "food", "2026-11-03"),
  e(999, "fun", "2026-10-31"),
];

describe("expense math", () => {
  it("only counts spending inside the chosen month", () => {
    expect(total(inMonth(list, "2026-11"))).toBe(500);
  });

  it("ranks categories by spend with their share", () => {
    const cats = byCategory(inMonth(list, "2026-11"));
    expect(cats[0]?.category.key).toBe("bills");
    expect(cats[0]?.share).toBeCloseTo(0.6);
    expect(cats[1]?.total).toBe(200);
  });

  it("flags going over the monthly budget", () => {
    expect(budgetStatus(1200, 1000)).toMatchObject({ over: true, remaining: -200, ratio: 1 });
    expect(budgetStatus(250, 1000)).toMatchObject({ over: false, remaining: 750, ratio: 0.25 });
  });

  it("averages the current month over days elapsed so far", () => {
    expect(dailyAverage(list, "2026-11", new Date(2026, 10, 5))).toBe(100);
  });

  it("averages a past month over all of its days", () => {
    expect(dailyAverage(list, "2026-10", new Date(2026, 10, 5))).toBeCloseTo(999 / 31);
  });

  it("adds up each day of the month", () => {
    const days = dailyTotals(list, "2026-11");
    expect(days).toHaveLength(30);
    expect(days[2]).toBe(400);
  });
});

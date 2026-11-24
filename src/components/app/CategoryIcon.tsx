import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { getCategory } from "@/lib/expenses";

export function catStyle(color: string) {
  return { "--hc": color } as CSSProperties;
}

export function CategoryIcon({
  category,
  size = "md",
  filled = false,
  className,
}: {
  category: string;
  size?: "sm" | "md" | "lg";
  filled?: boolean;
  className?: string;
}) {
  const cat = getCategory(category);
  const Icon = cat.icon;
  const box = { sm: "size-9 rounded-xl", md: "size-11 rounded-2xl", lg: "size-14 rounded-[1.25rem]" }[size];
  const icon = { sm: "size-4", md: "size-5", lg: "size-6" }[size];
  return (
    <span
      style={catStyle(cat.color)}
      className={cn(
        "grid shrink-0 place-items-center transition-colors duration-300",
        filled ? "cat-fill" : "cat-tint",
        box,
        className,
      )}
    >
      <Icon className={icon} strokeWidth={2.2} />
    </span>
  );
}

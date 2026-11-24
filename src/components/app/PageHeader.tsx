import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-3 px-5 pb-4 pt-8">
      <div>
        {subtitle && <p className="text-sm font-medium text-muted-foreground">{subtitle}</p>}
        <h1 className="text-[2rem] font-extrabold leading-tight">{title}</h1>
      </div>
      {right}
    </header>
  );
}

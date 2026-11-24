import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="animate-rise flex flex-col items-center rounded-[1.75rem] bg-card px-6 py-10 text-center shadow-soft">
      <span className="animate-float grid size-16 place-items-center rounded-3xl bg-primary-soft text-primary">
        <Icon className="size-7" />
      </span>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-1 max-w-[16rem] text-sm text-muted-foreground">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

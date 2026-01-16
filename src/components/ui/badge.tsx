import * as React from "react";
import { cn } from "@/lib/utils";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export function Badge({ className, ...props }: DivProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-slate-200/70 bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700",
        className,
      )}
      {...props}
    />
  );
}

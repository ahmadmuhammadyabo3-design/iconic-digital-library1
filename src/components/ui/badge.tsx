import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-slate-900 text-slate-50 shadow hover:bg-slate-900/80 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/80",
        secondary:
          "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-800/80",
        destructive:
          "border-transparent bg-rose-500 text-white shadow hover:bg-rose-500/80 dark:bg-rose-900 dark:text-slate-50",
        outline: "text-slate-950 dark:text-slate-50 border-slate-200 dark:border-slate-800",
        institutional:
          "border-transparent bg-blue-900 text-white shadow hover:bg-blue-800 dark:bg-blue-800 dark:text-blue-50",
        teal:
          "border-transparent bg-teal-600 text-white shadow hover:bg-teal-500 dark:bg-teal-700 dark:text-teal-50",
        success:
          "border-transparent bg-emerald-600 text-white shadow hover:bg-emerald-500 dark:bg-emerald-700 dark:text-emerald-50",
        warning:
          "border-transparent bg-amber-500 text-slate-950 shadow hover:bg-amber-400 dark:bg-amber-600 dark:text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

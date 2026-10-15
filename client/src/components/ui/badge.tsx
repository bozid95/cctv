import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-sky-500 text-white shadow hover:bg-sky-400',
        secondary:
          'border-transparent bg-slate-800 text-slate-300 hover:bg-slate-700',
        destructive:
          'border-transparent bg-red-900/60 text-red-200 border-red-800/50 shadow-xs',
        outline: 'text-slate-300 border-slate-800',
        sky: 'border-sky-500/30 bg-sky-500/10 text-sky-400 font-semibold',
        active: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 font-semibold',
      },
    },
    defaultVariants: {
      variant: 'default',
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

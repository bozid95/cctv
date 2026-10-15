import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none',
  {
    variants: {
      variant: {
        default:
          'bg-sky-500 text-white shadow-sm hover:bg-sky-400 active:bg-sky-600 font-semibold',
        destructive:
          'bg-red-600/90 text-white shadow-xs hover:bg-red-600',
        outline:
          'border border-slate-800 bg-slate-900/80 hover:bg-slate-800 hover:text-sky-300 text-slate-300 shadow-xs backdrop-blur-xs',
        secondary:
          'bg-slate-800/90 text-slate-200 hover:bg-slate-700/90 hover:text-white shadow-xs',
        ghost:
          'text-slate-400 hover:bg-slate-800/80 hover:text-sky-300',
        link:
          'text-sky-400 underline-offset-4 hover:underline hover:text-sky-300',
      },
      size: {
        default: 'h-8 px-3 py-1.5',
        sm: 'h-7 rounded-md px-2.5 text-[11px]',
        lg: 'h-9 rounded-md px-5 text-sm',
        icon: 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };

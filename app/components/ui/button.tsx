import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/app/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2.5 rounded-2xl font-semibold transition-all duration-300 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-30 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#a855f7] text-white hover:-translate-y-0.5 hover:shadow-[0_12px_35px_rgba(99,102,241,0.35)]  active:translate-y-0',
        outline: 'border-2 border-[rgba(99,102,241,0.2)] bg-transparent hover:bg-[#1f1f35] hover:border-[rgba(99,102,241,0.4)]',
        ghost: 'hover:bg-[#1f1f35]',
      },
      size: {
        default: 'h-11 px-5 py-2.5 text-sm',
        sm: 'h-9 px-4 text-sm',
        lg: 'h-14 px-8 text-lg',
        full: 'h-14 w-full px-8 text-[1.05rem]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = 'Button';

export { Button, buttonVariants };

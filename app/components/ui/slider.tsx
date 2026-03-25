'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/app/lib/utils';

const Slider = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      type="range"
      className={cn(
        'w-full h-1.5 rounded-full bg-border appearance-none cursor-pointer',
        '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_0_0_3px_oklch(0.09_0.01_260),0_0_0_5px_oklch(0.65_0.15_270_/_0.3)]',
        '[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none',
        className
      )}
      {...props}
    />
  )
);
Slider.displayName = 'Slider';

export { Slider };

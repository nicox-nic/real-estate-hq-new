import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary:
          "bg-ink text-ink-inverse hover:bg-ink/90 shadow-soft active:shadow-none",
        gold:
          "bg-gold text-ink hover:bg-gold-deep hover:text-ink-inverse shadow-soft active:shadow-none",
        secondary:
          "bg-canvas-raised text-ink border border-line hover:bg-canvas-sunken",
        ghost: "text-ink hover:bg-canvas-sunken",
        danger:
          "bg-terracotta text-ink-inverse hover:bg-terracotta-deep shadow-soft",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

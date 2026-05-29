import * as React from "react";
import { cn } from "@/lib/cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** "raised" = white card on canvas; "flat" = no shadow; "sunken" = inset look */
  surface?: "raised" | "flat" | "sunken";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, surface = "raised", ...props }, ref) => {
    const surfaceClasses = {
      raised: "bg-canvas-raised shadow-card border border-line",
      flat: "bg-canvas-raised border border-line",
      sunken: "bg-canvas-sunken border border-line-soft",
    }[surface];

    return (
      <div
        ref={ref}
        className={cn("rounded-2xl p-5", surfaceClasses, className)}
        {...props}
      />
    );
  },
);
Card.displayName = "Card";

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-start justify-between gap-3 mb-4", className)}
      {...props}
    />
  ),
);
CardHeader.displayName = "CardHeader";

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Use serif display face for hero titles */
  display?: boolean;
}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, display, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "text-base font-semibold text-ink",
        display && "font-display text-lg",
        className,
      )}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

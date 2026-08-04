import * as React from "react"

import { cn } from "@/lib/utils"

export interface MarqueeProps extends React.ComponentPropsWithoutRef<"div"> {
  speed?: "slow" | "normal" | "fast"
  direction?: "left" | "right"
  pauseOnHover?: boolean
  bordered?: boolean
  repeat?: number
}
export const Marquee = React.forwardRef<HTMLDivElement, MarqueeProps>(
  (
    {
      className,
      children,
      speed = "normal",
      direction = "left",
      pauseOnHover = true,
      bordered = true,
      repeat = 4,
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      data-direction={direction}
      data-pause-on-hover={pauseOnHover}
      data-speed={speed}
      className={cn("flex overflow-hidden", bordered && "border border-border", className)}
      {...props}
    >
      {[false, true].map((duplicate) => (
        <div
          key={String(duplicate)}
          aria-hidden={duplicate || undefined}
          className="marquee-track flex shrink-0 items-center gap-8 py-3"
        >
          {Array.from({ length: repeat }, (_, index) => (
            <React.Fragment key={index}>{children}</React.Fragment>
          ))}
        </div>
      ))}
    </div>
  )
)
Marquee.displayName = "Marquee"
export const MarqueeItem = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span">
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "inline-flex items-center gap-2 px-4 font-bold whitespace-nowrap uppercase",
      className
    )}
    {...props}
  />
))
MarqueeItem.displayName = "MarqueeItem"
export const MarqueeSeparator = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span">
>(({ className, children = "/", ...props }, ref) => (
  <span ref={ref} className={cn("font-bold text-muted-foreground", className)} {...props}>
    {children}
  </span>
))
MarqueeSeparator.displayName = "MarqueeSeparator"

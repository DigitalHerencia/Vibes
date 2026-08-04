import * as React from "react"

import { cn } from "@/lib/utils"

const presets = {
  "no-data": { title: "No data available", description: "There is nothing to display yet." },
  offline: { title: "You are offline", description: "Check your connection and try again." },
} as const

export interface EmptyStatePresetProps extends React.ComponentPropsWithoutRef<"div"> {
  preset: keyof typeof presets
  customTitle?: string
  customDescription?: string
  action?: React.ReactNode
  variant?: "default" | "filled" | "card"
  size?: "compact" | "sm" | "md" | "lg"
}

export const EmptyStatePreset = React.forwardRef<HTMLDivElement, EmptyStatePresetProps>(
  ({ preset, customTitle, customDescription, action, className, variant, size, ...props }, ref) => {
    const content = presets[preset]
    return (
      <div
        ref={ref}
        data-variant={variant}
        data-size={size}
        className={cn("flex flex-col items-center gap-3 p-6 text-center", className)}
        {...props}
      >
        <h3 className="font-semibold">{customTitle ?? content.title}</h3>
        <p className="text-sm text-muted-foreground">{customDescription ?? content.description}</p>
        {action}
      </div>
    )
  }
)
EmptyStatePreset.displayName = "EmptyStatePreset"

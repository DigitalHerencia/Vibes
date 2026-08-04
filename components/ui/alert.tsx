import * as React from "react"

import { cn } from "@/lib/utils"

export const Alert = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("border border-border bg-muted p-4 text-sm text-muted-foreground", className)}
      role="status"
      {...props}
    />
  )
)
Alert.displayName = "Alert"

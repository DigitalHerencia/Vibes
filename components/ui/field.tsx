import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type FieldProps = {
  children: ReactNode
  className?: string
}

export function Field({ children, className }: FieldProps) {
  return <div className={cn("grid gap-2", className)}>{children}</div>
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null
  return <p className="text-sm text-destructive">{children}</p>
}

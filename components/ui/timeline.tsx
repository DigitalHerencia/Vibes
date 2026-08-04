"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type Status = "completed" | "current" | "upcoming"
const TimelineContext = React.createContext<"vertical" | "horizontal">("vertical")
export const Timeline = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & { orientation?: "vertical" | "horizontal" }
>(({ orientation = "vertical", className, ...props }, ref) => (
  <TimelineContext.Provider value={orientation}>
    <div
      ref={ref}
      className={cn(orientation === "vertical" ? "flex flex-col" : "flex flex-row", className)}
      {...props}
    />
  </TimelineContext.Provider>
))
Timeline.displayName = "Timeline"
export const TimelineItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & { status?: Status }
>(({ status, className, ...props }, ref) => (
  <div ref={ref} data-status={status} className={cn("relative flex gap-4", className)} {...props} />
))
TimelineItem.displayName = "TimelineItem"
export const TimelineDot = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & { status?: Status; size?: "sm" | "md" | "lg" }
>(({ status, size, className, ...props }, ref) => (
  <div
    ref={ref}
    data-status={status}
    data-size={size}
    className={cn(
      "relative z-10 size-8 border border-border bg-muted data-[status=completed]:bg-primary data-[status=current]:bg-primary",
      className
    )}
    {...props}
  />
))
TimelineDot.displayName = "TimelineDot"
export const TimelineConnector = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & { status?: Status }
>(({ status, className, ...props }, ref) => {
  const orientation = React.useContext(TimelineContext)
  return (
    <div
      ref={ref}
      data-status={status}
      className={cn(
        orientation === "vertical" ? "ml-4 min-h-8 w-px" : "mt-4 h-px min-w-8",
        "bg-border",
        className
      )}
      {...props}
    />
  )
})
TimelineConnector.displayName = "TimelineConnector"
export const TimelineContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex-1 pb-8", className)} {...props} />
))
TimelineContent.displayName = "TimelineContent"
export const TimelineHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center gap-2", className)} {...props} />
))
TimelineHeader.displayName = "TimelineHeader"
export const TimelineCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("border border-border p-4", className)} {...props} />
  )
)
TimelineCard.displayName = "TimelineCard"
export const TimelineTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("font-semibold", className)} {...props} />
))
TimelineTitle.displayName = "TimelineTitle"
export const TimelineDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
))
TimelineDescription.displayName = "TimelineDescription"
export const TimelineTime = React.forwardRef<
  HTMLTimeElement,
  React.TimeHTMLAttributes<HTMLTimeElement>
>(({ className, ...props }, ref) => (
  <time ref={ref} className={cn("text-xs text-muted-foreground", className)} {...props} />
))
TimelineTime.displayName = "TimelineTime"

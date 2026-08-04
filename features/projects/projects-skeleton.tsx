import { Skeleton } from "@/components/ui/skeleton"

export function ProjectsSkeleton() {
  return (
    <div className="grid gap-6">
      <Skeleton className="h-36" />
      <div className="grid gap-3 md:grid-cols-2">
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
      </div>
    </div>
  )
}

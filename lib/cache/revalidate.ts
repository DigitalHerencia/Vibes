import "server-only"

import { revalidatePath, revalidateTag } from "next/cache"

import { cacheTags } from "@/lib/cache/cache-tags"

export function revalidateProjectSurfaces(input: { userId: string; projectId?: string }) {
  revalidatePath("/dashboard")
  revalidatePath("/projects")
  revalidateTag(cacheTags.dashboard(input.userId), "max")
  revalidateTag(cacheTags.projectList(input.userId), "max")

  if (input.projectId) {
    revalidateTag(cacheTags.project(input.projectId), "max")
  }
}

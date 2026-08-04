import "server-only"

import { getProjectListState } from "@/lib/fetchers/projectFetchers"
import type { DashboardStateDTO } from "@/types/projectTypes"

export async function getDashboardState(): Promise<DashboardStateDTO> {
  const projectState = await getProjectListState()

  return {
    projectCount: projectState.projects.length,
    recentProjects: projectState.projects.slice(0, 4),
    empty: projectState.empty,
  }
}

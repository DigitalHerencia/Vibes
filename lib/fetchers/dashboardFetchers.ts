import "server-only"

import { getProjectListState } from "@/lib/fetchers/projectFetchers"

export async function getDashboardState() {
  const projectState = await getProjectListState()

  return {
    projectCount: projectState.projects.length,
    recentProjects: projectState.projects.slice(0, 4),
    empty: projectState.empty,
  }
}

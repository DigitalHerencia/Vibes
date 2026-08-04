export const cacheTags = {
  dashboard: (userId: string) => `dashboard:${userId}`,
  projectList: (userId: string) => `projects:${userId}`,
  project: (projectId: string) => `project:${projectId}`,
}

export type LocalUserContext = {
  id: string
  clerkUserId: string
  email: string | null
  displayName: string | null
  status: "active" | "disabled"
}

export type AuthenticatedUserContext = {
  userId: string
  localUser: LocalUserContext
}

"use client"

import { ClerkProvider } from "@clerk/nextjs"
import type { ReactNode } from "react"

type AppProvidersProps = Readonly<{
  children: ReactNode
}>

export function AppProviders({ children }: AppProvidersProps) {
  return <ClerkProvider>{children}</ClerkProvider>
}

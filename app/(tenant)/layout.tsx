import type { ReactNode } from "react"

import { TenantShell } from "@/components/shells/tenant-shell"

export default function TenantLayout({ children }: { children: ReactNode }) {
  return <TenantShell>{children}</TenantShell>
}

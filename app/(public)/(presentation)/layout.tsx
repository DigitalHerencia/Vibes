import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { isPresentationCatalogEnabled } from "@/lib/presentation/catalogAccess"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function PublicReferenceLayout({ children }: { children: React.ReactNode }) {
  if (!isPresentationCatalogEnabled()) notFound()
  return children
}

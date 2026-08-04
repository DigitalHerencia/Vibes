import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="max-w-xl space-y-5 border bg-card p-8">
        <p className="eyebrow text-primary">404</p>
        <h1>Route not found.</h1>
        <p className="text-muted-foreground">This surface is not part of the starter route map.</p>
        <Button asChild>
          <Link href="/">Return home</Link>
        </Button>
      </div>
    </main>
  )
}

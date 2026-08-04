import Link from "next/link"

export function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-3 no-underline">
      <span className="grid size-8 place-items-center border border-primary bg-primary text-sm font-black text-primary-foreground">
        N
      </span>
      <span className="font-display text-2xl leading-none uppercase">Next Stack</span>
    </Link>
  )
}

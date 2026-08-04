import { cn } from "@/lib/utils"

export interface PageHeroProps {
  eyebrow: string
  title: string
  description: string
  className?: string
}

export function PageHero({ eyebrow, title, description, className }: PageHeroProps) {
  return (
    <header className={cn("space-y-4 py-8", className)}>
      <p className="text-xs font-semibold tracking-widest text-primary uppercase">{eyebrow}</p>
      <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">{title}</h1>
      <p className="max-w-3xl text-base text-muted-foreground md:text-lg">{description}</p>
    </header>
  )
}

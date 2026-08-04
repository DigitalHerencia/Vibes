import { PageHero } from "@/components/blocks/page-hero"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const questions = [
  {
    question: "Does this use Clerk organizations?",
    answer: "No. Clerk identifies users. Local Prisma rows authorize access to resources.",
  },
  {
    question: "Where do mutations live?",
    answer:
      "Internal app writes use Server Actions under lib/actions. API routes are reserved for webhooks.",
  },
  {
    question: "Can public pages compose components directly?",
    answer:
      "Yes, static public pages can compose blocks directly when they do not call backend operations.",
  },
]

export default function FaqPage() {
  return (
    <div className="grid gap-8">
      <PageHero
        eyebrow="Architecture FAQ"
        title="Boundaries before features."
        description="This starter keeps the default decisions explicit so implementation work lands in the right layer."
      />
      <section className="grid gap-3">
        {questions.map((item) => (
          <Card key={item.question}>
            <CardHeader>
              <CardTitle>{item.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{item.answer}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  )
}

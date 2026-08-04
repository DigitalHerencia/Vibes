import type { Prisma } from "@/prisma/generated/prisma/client"

import type { CreateProjectInput, UpdateProjectInput } from "@/schemas/projectSchemas"

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96)
}

export async function createProjectTx(
  tx: Prisma.TransactionClient,
  input: CreateProjectInput & { ownerId: string }
) {
  const slug = `${slugify(input.name)}-${crypto.randomUUID().slice(0, 8)}`

  const project = await tx.project.create({
    data: {
      ownerId: input.ownerId,
      name: input.name,
      slug,
      description: input.description || null,
      memberships: {
        create: {
          userId: input.ownerId,
          role: "owner",
        },
      },
    },
    select: { id: true, slug: true },
  })

  await tx.auditEvent.create({
    data: {
      eventName: "project.created",
      actorType: "user",
      actorUserId: input.ownerId,
      entityType: "project",
      entityId: project.id,
      projectId: project.id,
      metadata: { slug: project.slug },
    },
  })

  return project
}

export async function updateProjectTx(
  tx: Prisma.TransactionClient,
  input: UpdateProjectInput & { actorUserId: string }
) {
  const project = await tx.project.update({
    where: { id: input.projectId },
    data: {
      name: input.name,
      description: input.description || null,
    },
    select: { id: true, slug: true },
  })

  await tx.auditEvent.create({
    data: {
      eventName: "project.updated",
      actorType: "user",
      actorUserId: input.actorUserId,
      entityType: "project",
      entityId: project.id,
      projectId: project.id,
      metadata: { slug: project.slug },
    },
  })

  return project
}

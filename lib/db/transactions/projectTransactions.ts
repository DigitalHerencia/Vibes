import "server-only"

import type { Prisma } from "@/prisma/generated/prisma/client"

import { recordAuditEventTx } from "@/lib/db/transactions/auditTransactions"
import type {
  CreateProjectInput,
  TransitionProjectStatusInput,
  UpdateProjectInput,
} from "@/schemas/projectSchemas"

type ProjectAuthorizationRecord = {
  organizationId: string
  status: "active" | "archived"
}

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
  input: CreateProjectInput & { organizationId: string; ownerId: string }
) {
  const slug = `${slugify(input.name)}-${crypto.randomUUID().slice(0, 8)}`
  const project = await tx.project.create({
    data: {
      organizationId: input.organizationId,
      ownerId: input.ownerId,
      name: input.name,
      slug,
      description: input.description || null,
    },
    select: { id: true, slug: true },
  })

  await recordAuditEventTx(tx, {
    eventName: "project.created",
    actorUserId: input.ownerId,
    entityType: "project",
    entityId: project.id,
    organizationId: input.organizationId,
    projectId: project.id,
    metadata: { slug: project.slug },
  })
  return project
}

export async function updateProjectTx(
  tx: Prisma.TransactionClient,
  input: UpdateProjectInput & { organizationId: string; actorUserId: string },
  authorize: (project: ProjectAuthorizationRecord) => void
) {
  const current = await tx.project.findFirst({
    where: { id: input.projectId, organizationId: input.organizationId },
    select: { organizationId: true, status: true },
  })
  if (!current) throw new Error("Project not found.")
  authorize(current)

  const project = await tx.project.update({
    where: { id: input.projectId, organizationId: input.organizationId },
    data: { name: input.name, description: input.description || null },
    select: { id: true, slug: true },
  })
  await recordAuditEventTx(tx, {
    eventName: "project.updated",
    actorUserId: input.actorUserId,
    entityType: "project",
    entityId: project.id,
    organizationId: input.organizationId,
    projectId: project.id,
    metadata: { slug: project.slug },
  })
  return project
}

export async function transitionProjectStatusTx(
  tx: Prisma.TransactionClient,
  input: TransitionProjectStatusInput & { organizationId: string; actorUserId: string },
  authorize: (project: ProjectAuthorizationRecord) => void
) {
  const current = await tx.project.findFirst({
    where: { id: input.projectId, organizationId: input.organizationId },
    select: { organizationId: true, status: true },
  })
  if (!current) throw new Error("Project not found.")
  authorize(current)

  const project = await tx.project.update({
    where: { id: input.projectId, organizationId: input.organizationId },
    data: { status: input.status },
    select: { id: true, status: true },
  })
  await recordAuditEventTx(tx, {
    eventName: "project.status_changed",
    actorUserId: input.actorUserId,
    entityType: "project",
    entityId: project.id,
    organizationId: input.organizationId,
    projectId: project.id,
    metadata: { previousStatus: current.status, nextStatus: project.status },
  })
  return project
}

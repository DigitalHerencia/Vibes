import { PrismaPg } from "@prisma/adapter-pg"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { withTenantContext } from "@/lib/db/withTenantContext"
import { PrismaClient } from "@/prisma/generated/prisma/client"

const adminUrl = process.env.TEST_DATABASE_ADMIN_URL
const runtimePassword = process.env.TEST_DATABASE_RUNTIME_PASSWORD
const hasDatabase = Boolean(adminUrl && runtimePassword)

describe.skipIf(!hasDatabase)("PostgreSQL tenant containment", () => {
  const organizationA = "organization_a"
  const organizationB = "organization_b"
  const userA = "user_a"
  const userB = "user_b"
  let admin: PrismaClient
  let runtime: PrismaClient

  beforeAll(async () => {
    if (!adminUrl || !runtimePassword)
      throw new Error("Database security test configuration missing.")
    if (!/^[a-f0-9-]{36}$/i.test(runtimePassword)) {
      throw new Error("Runtime test password must be an ephemeral UUID.")
    }

    admin = new PrismaClient({ adapter: new PrismaPg({ connectionString: adminUrl }) })
    await admin.$executeRawUnsafe(
      `CREATE ROLE vibes_test_runtime LOGIN PASSWORD '${runtimePassword}' IN ROLE vibes_runtime`
    )

    await admin.user.createMany({
      data: [
        { id: userA, clerkUserId: "clerk_a", updatedAt: new Date() },
        { id: userB, clerkUserId: "clerk_b", updatedAt: new Date() },
      ],
    })
    await admin.organization.createMany({
      data: [
        {
          id: organizationA,
          name: "Organization A",
          slug: "organization-a",
          updatedAt: new Date(),
        },
        {
          id: organizationB,
          name: "Organization B",
          slug: "organization-b",
          updatedAt: new Date(),
        },
      ],
    })
    await admin.membership.createMany({
      data: [
        {
          id: "membership_a",
          organizationId: organizationA,
          userId: userA,
          role: "owner",
          updatedAt: new Date(),
        },
        {
          id: "membership_b",
          organizationId: organizationB,
          userId: userB,
          role: "owner",
          updatedAt: new Date(),
        },
      ],
    })
    await admin.project.createMany({
      data: [
        {
          id: "project_a",
          organizationId: organizationA,
          ownerId: userA,
          name: "Project A",
          slug: "project-a",
          updatedAt: new Date(),
        },
        {
          id: "project_b",
          organizationId: organizationB,
          ownerId: userB,
          name: "Project B",
          slug: "project-b",
          updatedAt: new Date(),
        },
      ],
    })
    await admin.billingCustomer.createMany({
      data: [
        {
          id: "billing_customer_a",
          organizationId: organizationA,
          stripeCustomerId: "cus_rls_a",
          updatedAt: new Date(),
        },
        {
          id: "billing_customer_b",
          organizationId: organizationB,
          stripeCustomerId: "cus_rls_b",
          updatedAt: new Date(),
        },
      ],
    })
    await admin.billingSubscription.createMany({
      data: [
        {
          id: "billing_subscription_a",
          organizationId: organizationA,
          billingCustomerId: "billing_customer_a",
          stripeSubscriptionId: "sub_rls_a",
          status: "active",
          stripePriceId: "price_core",
          providerCreatedAt: new Date(),
          providerUpdatedAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "billing_subscription_b",
          organizationId: organizationB,
          billingCustomerId: "billing_customer_b",
          stripeSubscriptionId: "sub_rls_b",
          status: "active",
          stripePriceId: "price_core",
          providerCreatedAt: new Date(),
          providerUpdatedAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    })
    await admin.billingSubscriptionItem.createMany({
      data: [
        {
          id: "billing_item_a",
          billingSubscriptionId: "billing_subscription_a",
          stripeSubscriptionItemId: "si_rls_a",
          stripePriceId: "price_core",
          updatedAt: new Date(),
        },
        {
          id: "billing_item_b",
          billingSubscriptionId: "billing_subscription_b",
          stripeSubscriptionItemId: "si_rls_b",
          stripePriceId: "price_core",
          updatedAt: new Date(),
        },
      ],
    })
    await admin.billingEntitlement.createMany({
      data: [
        {
          id: "billing_entitlement_a",
          organizationId: organizationA,
          billingSubscriptionId: "billing_subscription_a",
          key: "core",
          active: true,
          updatedAt: new Date(),
        },
        {
          id: "billing_entitlement_b",
          organizationId: organizationB,
          billingSubscriptionId: "billing_subscription_b",
          key: "core",
          active: true,
          updatedAt: new Date(),
        },
      ],
    })
    await admin.connectAccount.createMany({
      data: [
        {
          id: "connect_account_a",
          organizationId: organizationA,
          stripeAccountId: "acct_rls_a",
          country: "US",
          status: "ready",
          detailsSubmitted: true,
          chargesEnabled: true,
          payoutsEnabled: true,
          providerUpdatedAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "connect_account_b",
          organizationId: organizationB,
          stripeAccountId: "acct_rls_b",
          country: "US",
          status: "ready",
          detailsSubmitted: true,
          chargesEnabled: true,
          payoutsEnabled: true,
          providerUpdatedAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    })
    await admin.connectPayment.createMany({
      data: [
        {
          id: "connect_payment_a",
          organizationId: organizationA,
          connectAccountId: "connect_account_a",
          reference: "rls-a",
          amountMinor: 1000,
          currency: "usd",
          platformFeeMinor: 100,
          status: "succeeded",
          amountReceivedMinor: 1000,
          providerUpdatedAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "connect_payment_b",
          organizationId: organizationB,
          connectAccountId: "connect_account_b",
          reference: "rls-b",
          amountMinor: 1000,
          currency: "usd",
          platformFeeMinor: 100,
          status: "succeeded",
          amountReceivedMinor: 1000,
          providerUpdatedAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    })
    await admin.connectRefund.createMany({
      data: [
        {
          id: "connect_refund_a",
          organizationId: organizationA,
          connectPaymentId: "connect_payment_a",
          stripeRefundId: "re_rls_a",
          amountMinor: 1000,
          status: "succeeded",
          providerUpdatedAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "connect_refund_b",
          organizationId: organizationB,
          connectPaymentId: "connect_payment_b",
          stripeRefundId: "re_rls_b",
          amountMinor: 1000,
          status: "succeeded",
          providerUpdatedAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    })
    await admin.connectRecoverySnapshot.createMany({
      data: [
        {
          id: "connect_recovery_a",
          organizationId: organizationA,
          connectPaymentId: "connect_payment_a",
          operation: "refund",
          outcome: "synchronized",
          providerObjectId: "re_rls_a",
          providerStatus: "succeeded",
        },
        {
          id: "connect_recovery_b",
          organizationId: organizationB,
          connectPaymentId: "connect_payment_b",
          operation: "refund",
          outcome: "synchronized",
          providerObjectId: "re_rls_b",
          providerStatus: "succeeded",
        },
      ],
    })

    const runtimeUrl = new URL(adminUrl)
    runtimeUrl.username = "vibes_test_runtime"
    runtimeUrl.password = runtimePassword
    runtime = new PrismaClient({
      adapter: new PrismaPg({ connectionString: runtimeUrl.toString() }),
    })
  })

  afterAll(async () => {
    await runtime?.$disconnect()
    await admin?.$disconnect()
  })

  it("keeps the runtime role restricted and off protected-table ownership", async () => {
    const [role] = await admin.$queryRaw<
      Array<{
        rolbypassrls: boolean
        rolcreatedb: boolean
        rolcreaterole: boolean
        rolcanlogin: boolean
        rolsuper: boolean
      }>
    >`SELECT rolbypassrls, rolcreatedb, rolcreaterole, rolcanlogin, rolsuper
      FROM pg_catalog.pg_roles WHERE rolname = 'vibes_runtime'`

    expect(role).toEqual({
      rolbypassrls: false,
      rolcreatedb: false,
      rolcreaterole: false,
      rolcanlogin: false,
      rolsuper: false,
    })

    const owned = await admin.$queryRaw<Array<{ table_name: string }>>`
      SELECT c.relname AS table_name
      FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_roles r ON r.oid = c.relowner
      WHERE c.relkind = 'r' AND r.rolname = 'vibes_runtime'`
    expect(owned).toEqual([])
  })

  it("fails closed when tenant context is absent and does not leak it after commit", async () => {
    await expect(runtime.project.findMany()).resolves.toEqual([])
    await expect(runtime.billingCustomer.findMany()).resolves.toEqual([])
    await expect(runtime.billingSubscriptionItem.findMany()).resolves.toEqual([])
    await expect(runtime.connectAccount.findMany()).resolves.toEqual([])
    await expect(runtime.connectPayment.findMany()).resolves.toEqual([])
    await expect(runtime.connectRefund.findMany()).resolves.toEqual([])
    await expect(runtime.connectRecoverySnapshot.findMany()).resolves.toEqual([])
    await expect(
      runtime.project.create({
        data: {
          id: "missing_context",
          organizationId: organizationA,
          ownerId: userA,
          name: "Missing context",
          slug: "missing-context",
        },
      })
    ).rejects.toThrow()

    await withTenantContext(organizationA, (tx) => tx.project.findMany(), undefined, runtime)
    await expect(runtime.project.findMany()).resolves.toEqual([])
  })

  it("contains broad Prisma reads to the transaction tenant", async () => {
    const result = await withTenantContext(
      organizationA,
      async (tx) => ({
        organizations: await tx.organization.findMany({ select: { id: true } }),
        memberships: await tx.membership.findMany({ select: { organizationId: true } }),
        projects: await tx.project.findMany({ select: { organizationId: true } }),
        billingCustomers: await tx.billingCustomer.findMany({ select: { organizationId: true } }),
        billingSubscriptions: await tx.billingSubscription.findMany({
          select: { organizationId: true },
        }),
        billingItems: await tx.billingSubscriptionItem.findMany({ select: { id: true } }),
        entitlements: await tx.billingEntitlement.findMany({ select: { organizationId: true } }),
        connectAccounts: await tx.connectAccount.findMany({ select: { organizationId: true } }),
        connectPayments: await tx.connectPayment.findMany({ select: { organizationId: true } }),
        connectRefunds: await tx.connectRefund.findMany({ select: { organizationId: true } }),
        connectRecovery: await tx.connectRecoverySnapshot.findMany({
          select: { organizationId: true },
        }),
      }),
      undefined,
      runtime
    )

    expect(result.organizations).toEqual([{ id: organizationA }])
    expect(result.memberships).toEqual([{ organizationId: organizationA }])
    expect(result.projects).toEqual([{ organizationId: organizationA }])
    expect(result.billingCustomers).toEqual([{ organizationId: organizationA }])
    expect(result.billingSubscriptions).toEqual([{ organizationId: organizationA }])
    expect(result.billingItems).toEqual([{ id: "billing_item_a" }])
    expect(result.entitlements).toEqual([{ organizationId: organizationA }])
    expect(result.connectAccounts).toEqual([{ organizationId: organizationA }])
    expect(result.connectPayments).toEqual([{ organizationId: organizationA }])
    expect(result.connectRefunds).toEqual([{ organizationId: organizationA }])
    expect(result.connectRecovery).toEqual([{ organizationId: organizationA }])
  })

  it("permits same-tenant DML while keeping audit records immutable", async () => {
    await withTenantContext(
      organizationA,
      async (tx) => {
        await expect(
          tx.project.create({
            data: {
              id: "same_tenant",
              organizationId: organizationA,
              ownerId: userA,
              name: "Same tenant",
              slug: "same-tenant",
            },
          })
        ).resolves.toEqual(expect.objectContaining({ id: "same_tenant" }))
        await expect(
          tx.project.update({ where: { id: "same_tenant" }, data: { name: "Updated" } })
        ).resolves.toEqual(expect.objectContaining({ name: "Updated" }))
        await expect(tx.project.delete({ where: { id: "same_tenant" } })).resolves.toEqual(
          expect.objectContaining({ id: "same_tenant" })
        )

        await expect(
          tx.auditEvent.create({
            data: {
              id: "audit_a",
              eventName: "test.created",
              actorType: "user",
              actorUserId: userA,
              entityType: "test",
              entityId: "same_tenant",
              organizationId: organizationA,
            },
          })
        ).resolves.toEqual(expect.objectContaining({ id: "audit_a" }))
      },
      undefined,
      runtime
    )

    await expect(
      withTenantContext(
        organizationA,
        (tx) => tx.auditEvent.delete({ where: { id: "audit_a" } }),
        undefined,
        runtime
      )
    ).rejects.toThrow()
  })

  it("denies cross-tenant INSERT, UPDATE, and DELETE", async () => {
    await expect(
      withTenantContext(
        organizationA,
        (tx) =>
          tx.project.create({
            data: {
              id: "cross_insert",
              organizationId: organizationB,
              ownerId: userA,
              name: "Cross insert",
              slug: "cross-insert",
            },
          }),
        undefined,
        runtime
      )
    ).rejects.toThrow()

    await expect(
      withTenantContext(
        organizationA,
        (tx) =>
          tx.project.updateMany({
            where: { organizationId: organizationB },
            data: { name: "Cross update" },
          }),
        undefined,
        runtime
      )
    ).resolves.toEqual({ count: 0 })

    await expect(
      withTenantContext(
        organizationA,
        (tx) =>
          tx.connectRefund.create({
            data: {
              organizationId: organizationB,
              connectPaymentId: "connect_payment_b",
              stripeRefundId: "re_cross",
              amountMinor: 100,
              status: "pending",
              providerUpdatedAt: new Date(),
            },
          }),
        undefined,
        runtime
      )
    ).rejects.toThrow()

    await expect(
      withTenantContext(
        organizationA,
        (tx) =>
          tx.billingEntitlement.create({
            data: { organizationId: organizationB, key: "cross", active: true },
          }),
        undefined,
        runtime
      )
    ).rejects.toThrow()

    await expect(
      withTenantContext(
        organizationA,
        (tx) =>
          tx.billingEntitlement.updateMany({
            where: { organizationId: organizationB },
            data: { active: false },
          }),
        undefined,
        runtime
      )
    ).resolves.toEqual({ count: 0 })

    await expect(
      withTenantContext(
        organizationA,
        (tx) => tx.project.deleteMany({ where: { organizationId: organizationB } }),
        undefined,
        runtime
      )
    ).resolves.toEqual({ count: 0 })

    expect(await admin.project.findUnique({ where: { id: "project_b" } })).toEqual(
      expect.objectContaining({ name: "Project B" })
    )
  })
})

import "server-only"

import { PrismaNeon } from "@prisma/adapter-neon"

import { PrismaClient } from "@/prisma/generated/prisma/client"

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient
}

let prismaSingleton = globalForPrisma.prisma

export function getPrisma(): PrismaClient {
  if (prismaSingleton) return prismaSingleton

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL is required")
  }

  const adapter = new PrismaNeon({ connectionString })
  prismaSingleton = new PrismaClient({ adapter })

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prismaSingleton
  }

  return prismaSingleton
}

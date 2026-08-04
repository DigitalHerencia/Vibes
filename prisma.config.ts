import { config } from "dotenv"
import { defineConfig } from "prisma/config"

if (process.env.VIBES_SKIP_DOTENV !== "1") {
  config({ path: ".env" })
  config({ path: ".env.local", override: true })
}

const migrationDatabaseUrl =
  process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  ...(migrationDatabaseUrl
    ? {
        datasource: {
          url: migrationDatabaseUrl,
          ...(process.env.SHADOW_DATABASE_URL
            ? { shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL }
            : {}),
        },
      }
    : {}),
})

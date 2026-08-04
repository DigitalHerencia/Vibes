import { defineConfig } from "vitest/config"
import { join } from "node:path"

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      "server-only": join(process.cwd(), "tests/helpers/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["tests/integration/**/*.test.ts"],
  },
})

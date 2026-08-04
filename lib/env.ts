import "server-only"

type RuntimeEnv = {
  databaseUrl: string
  appUrl: string
  clerkSecretKey: string | undefined
  clerkWebhookSigningSecret: string | undefined
}

export function getRequiredEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

export function getOptionalEnv(name: string): string | undefined {
  return process.env[name]
}

export function getRuntimeEnv(): RuntimeEnv {
  return {
    databaseUrl: getRequiredEnv("DATABASE_URL"),
    appUrl:
      getOptionalEnv("NEXT_PUBLIC_APP_URL") ??
      (getOptionalEnv("VERCEL_URL")
        ? `https://${getOptionalEnv("VERCEL_URL")}`
        : "http://localhost:3000"),
    clerkSecretKey: getOptionalEnv("CLERK_SECRET_KEY"),
    clerkWebhookSigningSecret: getOptionalEnv("CLERK_WEBHOOK_SIGNING_SECRET"),
  }
}

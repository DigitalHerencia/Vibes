import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { isPresentationCatalogEnabled } from "@/lib/presentation/catalogAccess"

const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing(.*)",
  "/faq(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/clerk/webhooks",
  "/api/stripe/webhooks",
  "/api/stripe/connect/webhooks",
])

const isAuthRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"])

const isPresentationRoute = createRouteMatcher([
  "/catalog",
  "/auth-forms",
  "/config-page",
  "/cta-section",
  "/error-pages",
  "/faq-section",
  "/feature-grid",
  "/hero-section",
  "/invoice",
  "/onboarding-flow",
  "/process-panel",
  "/settings-page",
  "/stats-section",
  "/status",
  "/D1",
  "/pA",
  "/pB",
  "/pC",
  "/tA",
  "/tB",
  "/tC",
])

function isInternalRedirect(value: string | null): value is string {
  return !!value && value.startsWith("/") && !value.startsWith("//") && !value.includes("://")
}

function requestedRedirect(req: Request): string | null {
  const url = new URL(req.url)
  const requested =
    url.searchParams.get("return_to") ??
    url.searchParams.get("returnTo") ??
    url.searchParams.get("redirect_url") ??
    url.searchParams.get("redirectUrl")

  return isInternalRedirect(requested) ? requested : null
}

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()
  const { pathname, search } = req.nextUrl

  if (isAuthRoute(req) && userId) {
    return NextResponse.redirect(new URL(requestedRedirect(req) ?? "/dashboard", req.url))
  }

  if (isPublicRoute(req) || (isPresentationRoute(req) && isPresentationCatalogEnabled())) {
    return NextResponse.next()
  }

  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url)
    signInUrl.searchParams.set("return_to", `${pathname}${search}`)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}

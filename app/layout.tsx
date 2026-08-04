import type { Metadata, Viewport } from "next"
import { Archivo_Black, Bebas_Neue, JetBrains_Mono } from "next/font/google"
import type { ReactNode } from "react"

import { AppProviders } from "@/components/app/app-providers"
import "./globals.css"

const archivoBlack = Archivo_Black({
  variable: "--font-brand",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
})

const bebasNeue = Bebas_Neue({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
})

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
})

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  applicationName: "Next Stack Template",
  title: {
    default: "Next Stack Template",
    template: "%s - Next Stack Template",
  },
  description:
    "A strict App Router SaaS template with Clerk auth, row-level RBAC, Prisma, Neon, Server Actions, and Tailwind CSS v4.",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/icon.svg",
  },
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
}

type RootLayoutProps = Readonly<{
  children: ReactNode
}>

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${archivoBlack.variable} ${bebasNeue.variable} ${jetBrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh overflow-x-hidden bg-background">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}

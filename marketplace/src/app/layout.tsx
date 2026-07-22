import type { Metadata } from "next"
import { Space_Grotesk, Space_Mono } from "next/font/google"
import "./globals.css"
import { Topbar } from "@/components/layout/Topbar"
import { EcosystemNav } from "@/components/dashboard/EcosystemNav"

const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"], weight: ["400","500","600","700"] })
const spaceMono = Space_Mono({ variable: "--font-space-mono", subsets: ["latin"], weight: ["400","700"] })

export const metadata: Metadata = {
  title: "Kestrel Marketplace — Discover x402 APIs",
  description: "Discover, compare and use x402-enabled APIs paying with USDC on Arc",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${spaceMono.variable} h-full`}>
      <body className="min-h-full bg-background text-foreground antialiased flex flex-col">
        <EcosystemNav current="marketplace" />
        <Topbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  )
}

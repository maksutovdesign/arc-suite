import type { Metadata } from "next"
import { Space_Grotesk, Space_Mono } from "next/font/google"
import "./globals.css"
import { RepSidebar } from "@/components/dashboard/RepSidebar"
import { EcosystemNav } from "@/components/dashboard/EcosystemNav"

const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"], weight: ["400","500","600","700"] })
const spaceMono = Space_Mono({ variable: "--font-space-mono", subsets: ["latin"], weight: ["400","700"] })

export const metadata: Metadata = {
  title: "Kestrel Reputation — Agent Trust Layer",
  description: "On-chain reputation and trust scores for AI agents on Arc",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${spaceMono.variable} h-full`}>
      <body className="h-full bg-background text-foreground antialiased flex flex-col">
        <EcosystemNav current="reputation" />
        <div className="flex flex-1 overflow-hidden">
          <RepSidebar />
          <main className="min-w-0 flex-1 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  )
}

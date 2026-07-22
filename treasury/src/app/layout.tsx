import type { Metadata } from "next"
import { Space_Grotesk, Space_Mono } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { EcosystemNav } from "@/components/dashboard/EcosystemNav"
import { DemoModeBanner } from "@/components/dashboard/DemoModeBanner"
import { isTreasuryDemoMode } from "@/lib/treasury-session-server"

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
})

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
})

export const metadata: Metadata = {
  title: "Kestrel Treasury — Agent Budget Manager",
  description: "Manage, monitor and control AI agent spending on Arc",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const isDemo = await isTreasuryDemoMode()

  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${spaceMono.variable} h-full`}>
      <body className="h-full bg-background text-foreground antialiased flex flex-col">
        <EcosystemNav current="treasury" />
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar isDemo={isDemo} />
          <main className="min-w-0 flex-1 overflow-auto">
            {isDemo && <DemoModeBanner />}
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}

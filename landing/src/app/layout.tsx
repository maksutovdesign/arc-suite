import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Arc Suite — AI Agent Infrastructure for the Onchain Economy",
  description:
    "Arc Suite gives AI agents spend controls, reputation scoring, and x402 API access for autonomous USDC commerce.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

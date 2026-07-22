import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Kestrel — Agent Money Control Plane",
  description:
    "Kestrel gives AI agents policy-controlled wallets, multichain USDC movement, compliance checks and verifiable payment proofs. Built on Arc.",
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

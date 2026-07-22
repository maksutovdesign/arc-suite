import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL("https://arcsuite-app.vercel.app"),
  applicationName: "Kestrel",
  title: "Kestrel — Agent Money Control Plane",
  description:
    "Kestrel gives AI agents policy-controlled wallets, multichain USDC movement, compliance checks and verifiable payment proofs. Built on Arc.",
  icons: { icon: "/icon.svg" },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Kestrel — Agent Money Control Plane",
    description: "Move money, apply policy and keep verifiable proof with Circle App Kit. Built on Arc.",
    siteName: "Kestrel",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kestrel — Agent Money Control Plane",
    description: "Policy-controlled multichain USDC movement with verifiable execution proofs.",
  },
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

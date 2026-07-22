import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kestrel — Agent Money Control Plane",
    short_name: "Kestrel",
    description: "Policy-controlled multichain USDC movement with verifiable execution proofs. Built on Arc.",
    start_url: "/",
    display: "standalone",
    background_color: "#080d18",
    theme_color: "#101826",
    icons: [{ src: "/kestrel-mark.svg", sizes: "any", type: "image/svg+xml" }],
  }
}

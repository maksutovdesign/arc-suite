import { createArcVerifierHandler } from "@/lib/arc-verifier-api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 20
export const GET = createArcVerifierHandler()

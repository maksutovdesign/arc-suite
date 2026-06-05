import { createHmac, timingSafeEqual } from "crypto"
import { NextResponse } from "next/server"

const ADMIN_KEY = process.env.ARC_TREASURY_ADMIN_KEY
export const TREASURY_SESSION_COOKIE = "arc_treasury_session"
export const TREASURY_DEMO_COOKIE = "arc_treasury_demo"
const SESSION_TTL_MS = 12 * 60 * 60 * 1000
const DEMO_TTL_MS = 4 * 60 * 60 * 1000

type TreasurySessionMode = "admin" | "demo" | "public"

export function requireTreasuryAdmin(request: Request) {
  if (getTreasurySessionMode(request) === "admin") return null

  return NextResponse.json(
    { error: "Unauthorized", message: "A Treasury admin session is required." },
    { status: 401 },
  )
}

export function requireTreasuryViewer(request: Request) {
  const mode = getTreasurySessionMode(request)
  if (mode === "admin" || mode === "demo") return null

  return NextResponse.json(
    { error: "Unauthorized", message: "A Treasury admin or demo session is required." },
    { status: 401 },
  )
}

export function requireWritableTreasuryAdmin(request: Request) {
  const mode = getTreasurySessionMode(request)
  if (mode === "admin") return null

  if (mode === "demo") {
    return NextResponse.json(
      { error: "Demo workspace is read-only", message: "This demo session can run safe checks, but cannot mutate workspace state." },
      { status: 403 },
    )
  }

  return requireTreasuryAdmin(request)
}

export function getTreasurySessionMode(request: Request): TreasurySessionMode {
  if (!ADMIN_KEY && process.env.NODE_ENV !== "production") return "admin"

  const providedKey = request.headers.get("x-arc-treasury-admin-key") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (ADMIN_KEY && providedKey === ADMIN_KEY) return "admin"
  if (isTreasuryAdminSessionValue(readCookie(request, TREASURY_SESSION_COOKIE))) return "admin"
  if (isTreasuryDemoSessionValue(readCookie(request, TREASURY_DEMO_COOKIE))) return "demo"

  return "public"
}

export function isValidTreasuryAdminKey(value: unknown) {
  return typeof value === "string" && Boolean(ADMIN_KEY) && value === ADMIN_KEY
}

export function setTreasurySession(response: NextResponse) {
  const createdAt = Date.now()
  response.cookies.set(TREASURY_SESSION_COOKIE, `${createdAt}.${signSession(createdAt, "admin")}`, {
    httpOnly: true,
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
  response.cookies.set(TREASURY_DEMO_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

export function setTreasuryDemoSession(response: NextResponse) {
  const createdAt = Date.now()
  response.cookies.set(TREASURY_SESSION_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
  response.cookies.set(TREASURY_DEMO_COOKIE, `${createdAt}.${signSession(createdAt, "demo")}`, {
    httpOnly: true,
    maxAge: DEMO_TTL_MS / 1000,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

export function clearTreasurySession(response: NextResponse) {
  response.cookies.set(TREASURY_SESSION_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
  response.cookies.set(TREASURY_DEMO_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

export function isTreasuryDemoSessionValue(value: string | null | undefined) {
  return isValidSignedSession(value ?? null, "demo", DEMO_TTL_MS)
}

export function isTreasuryAdminSessionValue(value: string | null | undefined) {
  return Boolean(ADMIN_KEY) && isValidSignedSession(value ?? null, "admin", SESSION_TTL_MS)
}

function isValidSignedSession(value: string | null, mode: "admin" | "demo", ttlMs: number) {
  if (!sessionSecret() || !value) return false

  const [createdAtRaw, signature] = value.split(".")
  const createdAt = Number(createdAtRaw)
  if (!Number.isFinite(createdAt) || Date.now() - createdAt > ttlMs) return false

  const expected = signSession(createdAt, mode)
  return safeEqual(signature, expected)
}

function signSession(createdAt: number, mode: "admin" | "demo") {
  return createHmac("sha256", sessionSecret()).update(`treasury-${mode}:${createdAt}`).digest("hex")
}

function sessionSecret() {
  return process.env.ARC_TREASURY_SESSION_SECRET ?? ADMIN_KEY ?? ""
}

function safeEqual(left: string | undefined, right: string) {
  if (!left) return false
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

function readCookie(request: Request, name: string) {
  const cookie = request.headers.get("cookie")
  if (!cookie) return null
  return cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`))
    ?.slice(name.length + 1) ?? null
}

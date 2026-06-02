import { createHmac, timingSafeEqual } from "crypto"
import { NextResponse } from "next/server"

const ADMIN_KEY = process.env.ARC_TREASURY_ADMIN_KEY
const SESSION_COOKIE = "arc_treasury_session"
const SESSION_TTL_MS = 12 * 60 * 60 * 1000

export function requireTreasuryAdmin(request: Request) {
  if (!ADMIN_KEY && process.env.NODE_ENV !== "production") return null

  const providedKey = request.headers.get("x-arc-treasury-admin-key") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (ADMIN_KEY && providedKey === ADMIN_KEY) return null
  if (ADMIN_KEY && isValidSession(readCookie(request, SESSION_COOKIE))) return null

  return NextResponse.json(
    { error: "Unauthorized", message: "A Treasury admin session is required." },
    { status: 401 },
  )
}

export function isValidTreasuryAdminKey(value: unknown) {
  return typeof value === "string" && Boolean(ADMIN_KEY) && value === ADMIN_KEY
}

export function setTreasurySession(response: NextResponse) {
  const createdAt = Date.now()
  response.cookies.set(SESSION_COOKIE, `${createdAt}.${signSession(createdAt)}`, {
    httpOnly: true,
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

export function clearTreasurySession(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

function isValidSession(value: string | null) {
  if (!ADMIN_KEY || !value) return false

  const [createdAtRaw, signature] = value.split(".")
  const createdAt = Number(createdAtRaw)
  if (!Number.isFinite(createdAt) || Date.now() - createdAt > SESSION_TTL_MS) return false

  const expected = signSession(createdAt)
  return safeEqual(signature, expected)
}

function signSession(createdAt: number) {
  return createHmac("sha256", ADMIN_KEY ?? "").update(`treasury-admin:${createdAt}`).digest("hex")
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

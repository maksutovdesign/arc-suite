import { cookies } from "next/headers"
import {
  isTreasuryAdminSessionValue,
  isTreasuryDemoSessionValue,
  TREASURY_DEMO_COOKIE,
  TREASURY_SESSION_COOKIE,
} from "@/lib/treasury-auth"

export type TreasuryServerSessionMode = "admin" | "demo" | "public"

export async function getTreasuryServerSessionMode(): Promise<TreasuryServerSessionMode> {
  if (!process.env.ARC_TREASURY_ADMIN_KEY && process.env.NODE_ENV !== "production") return "admin"

  const cookieStore = await cookies()
  if (isTreasuryAdminSessionValue(cookieStore.get(TREASURY_SESSION_COOKIE)?.value)) return "admin"
  if (isTreasuryDemoSessionValue(cookieStore.get(TREASURY_DEMO_COOKIE)?.value)) return "demo"

  return "public"
}

export async function isTreasuryDemoMode() {
  return (await getTreasuryServerSessionMode()) === "demo"
}

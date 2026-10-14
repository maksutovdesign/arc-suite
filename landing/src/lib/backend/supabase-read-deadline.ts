const SUPABASE_READ_TIMEOUT_MS = 5_000

export class SupabaseReadTimeoutError extends Error {
  constructor() {
    super("Supabase read timed out")
    this.name = "SupabaseReadTimeoutError"
  }
}

// Keep the deadline active through body decoding, not just response headers.
// No retry: the caller decides whether unavailable data permits a fallback.
export async function withSupabaseReadDeadline<T>(
  read: (signal: AbortSignal) => Promise<T>,
  timeoutMs = SUPABASE_READ_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController()
  let timeout: ReturnType<typeof setTimeout> | undefined
  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      const error = new SupabaseReadTimeoutError()
      reject(error)
      controller.abort(error)
    }, timeoutMs)
  })

  try {
    return await Promise.race([read(controller.signal), deadline])
  } finally {
    clearTimeout(timeout)
  }
}

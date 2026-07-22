// When the app is served under the Kestrel domain it runs with a basePath
// (e.g. "/marketplace"). next/link and next/image handle that automatically, but raw
// fetch() calls do not — prefix same-origin API paths with this helper.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

export function apiPath(path: string): string {
  return `${BASE_PATH}${path}`
}

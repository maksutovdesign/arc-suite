export function assertEmbeddingPolicy(headers, landing) {
  const csp = headers.get("content-security-policy") ?? ""
  const directives = csp.split(";").map((part) => part.trim()).filter((part) => /^frame-ancestors(?:\s|$)/.test(part))
  const expected = landing ? "frame-ancestors 'self' https://maksutovdesign.ru" : "frame-ancestors 'none'"
  if (directives.length !== 1 || directives[0] !== expected) throw new Error(`Unexpected embedding policy: expected ${expected}`)
  const frameOptions = headers.get("x-frame-options")
  if (landing ? frameOptions !== null : frameOptions !== "DENY") throw new Error("X-Frame-Options conflicts with the configured embedding policy")
}

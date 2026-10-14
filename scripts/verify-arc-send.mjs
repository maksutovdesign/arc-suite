import { createHash } from "node:crypto"
import { readFile, writeFile } from "node:fs/promises"
import { createArcReadRpc, probeArcMainnet, verifyArcSend } from "./arc-send-verification.mjs"

const usage = `Read-only Arc mainnet USDC Send verification.

  npm run verify:arc-send -- --probe
  npm run verify:arc-send -- --proof /path/to/proof.json [--tx 0xHASH] [--out /path/to/verification.json]

Accepts a Kestrel money-proof/1 export for a direct Send between distinct addresses.
Uses the fixed official Arc mainnet RPC. No private keys, signing or payments.
Exit codes: 0 verified (or probe passed), 2 pending/mismatch, 1 input/RPC/I/O failure.
An output file is created only with --out and must not already exist.
`

try {
  const args = process.argv.slice(2)
  const options = {}
  for (let i = 0; i < args.length; i++) {
    const flag = args[i]
    if (!["--help", "--probe", "--proof", "--tx", "--out"].includes(flag) || flag in options) throw new Error("Unknown or repeated option. Use --help.")
    if (flag === "--help" || flag === "--probe") options[flag] = true
    else {
      const value = args[++i]
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${flag}.`)
      options[flag] = value
    }
  }
  if (options["--help"]) {
    console.log(usage)
  } else {
    const rpc = createArcReadRpc()
    let report
    if (options["--probe"]) {
      if (Object.keys(options).length !== 1) throw new Error("Use --probe by itself.")
      report = await probeArcMainnet(rpc)
    } else {
      if (!options["--proof"]) throw new Error("A --proof file is required. Use --help.")
      const source = await readFile(options["--proof"], "utf8")
      const proof = JSON.parse(source)
      report = await verifyArcSend(proof, { rpc, txHash: options["--tx"] })
      report.sourceProofSha256 = createHash("sha256").update(source).digest("hex")
      if (options["--out"]) await writeFile(options["--out"], JSON.stringify(report, null, 2) + "\n", { flag: "wx", mode: 0o600 })
      if (!report.verified) process.exitCode = 2
    }
    console.log(JSON.stringify(report, null, 2))
  }
} catch (error) {
  console.error(JSON.stringify({ verified: false, error: error instanceof Error ? error.message : "verification_failed" }))
  process.exitCode = 1
}

import { readFile } from "node:fs/promises"
import solc from "solc"

const contractPath = new URL("../contracts/ArcEscrow.sol", import.meta.url)
const source = await readFile(contractPath, "utf8")
const input = {
  language: "Solidity",
  sources: {
    "ArcEscrow.sol": { content: source },
  },
  settings: {
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object"],
      },
    },
  },
}

const output = JSON.parse(solc.compile(JSON.stringify(input)))
const errors = (output.errors ?? []).filter((entry) => entry.severity === "error")
if (errors.length > 0) {
  for (const error of errors) console.error(error.formattedMessage)
  process.exit(1)
}

const artifact = output.contracts?.["ArcEscrow.sol"]?.ArcEscrow
if (!artifact?.evm?.bytecode?.object) throw new Error("ArcEscrow bytecode was not generated")

const abiNames = new Set(artifact.abi.map((entry) => entry.name).filter(Boolean))
for (const requiredName of [
  "fundMilestone",
  "submitMilestone",
  "disputeMilestone",
  "releaseMilestone",
  "refundMilestone",
  "MilestoneFunded",
  "MilestoneReleased",
  "MilestoneRefunded",
]) {
  if (!abiNames.has(requiredName)) throw new Error(`ArcEscrow ABI is missing ${requiredName}`)
}

console.log(`ArcEscrow compiled with solc ${solc.version()} (${artifact.abi.length} ABI entries)`)

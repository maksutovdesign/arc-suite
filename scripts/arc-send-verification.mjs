// Read-only verification for the first direct, browser-wallet Arc Send pilot.
// RPC observations verify chain inclusion and transfer facts, not policy signatures
// or provider fulfillment. Never import a signer or broadcast a transaction here.
export const ARC_RPC_URL = "https://rpc.mainnet.arc.io"
export const ARC_FALLBACK_RPC_URL = "https://rpc.drpc.mainnet.arc.io"
export const ARC_CHAIN_ID = 5042n
export const USDC_ERC20 = "0x3600000000000000000000000000000000000000"
export const USDC_SYSTEM_EMITTER = "0xfffffffffffffffffffffffffffffffffffffffe"
export const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"

const hashPattern = /^0x[0-9a-f]{64}$/i
const addressPattern = /^0x[0-9a-f]{40}$/i
const readMethods = new Set(["eth_chainId", "eth_getTransactionByHash", "eth_getTransactionReceipt", "eth_getBlockByNumber"])
const lower = (value) => typeof value === "string" ? value.toLowerCase() : ""
const sameHash = (a, b) => hashPattern.test(a ?? "") && lower(a) === lower(b)

function quantity(value) {
  if (typeof value !== "string" || !/^0x(?:0|[1-9a-f][0-9a-f]{0,63})$/i.test(value)) return null
  return BigInt(value)
}

function decimalUnits(value, decimals) {
  if (typeof value !== "string" || !/^(0|[1-9]\d{0,30})(\.\d{1,6})?$/.test(value)) {
    throw new Error("Amount must be a positive decimal string with at most six fractional digits.")
  }
  const [whole, fraction = ""] = value.split(".")
  const units = BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, "0"))
  if (units <= 0n) throw new Error("Amount must be positive.")
  return units
}

function formatUnits(value, decimals) {
  const scale = 10n ** BigInt(decimals)
  const fraction = (value % scale).toString().padStart(decimals, "0").replace(/0+$/, "")
  return `${value / scale}${fraction ? `.${fraction}` : ""}`
}

export function parseArcSendProof(proof, selectedHash) {
  if (proof?.schemaVersion !== "kestrel-money-proof/1" || proof.operation !== "send") {
    throw new Error("Use a Kestrel money-proof/1 Send export.")
  }
  for (const side of ["source", "destination"]) {
    const network = proof.networks?.[side]
    if (network?.chain !== "Arc" || network.chainId !== Number(ARC_CHAIN_ID) || network.environment !== "mainnet") {
      throw new Error("Both recorded networks must explicitly identify Arc mainnet (5042).")
    }
  }
  const intent = proof.intent
  if (intent?.token !== "USDC" || !addressPattern.test(intent.walletAddress ?? "") || !addressPattern.test(intent.recipient ?? "")) {
    throw new Error("The export must record USDC, a sender address and a recipient address.")
  }
  const sender = lower(intent.walletAddress)
  const recipient = lower(intent.recipient)
  const zero = `0x${"0".repeat(40)}`
  if ([sender, recipient].includes(zero) || sender === recipient) {
    throw new Error("The first verified Send requires distinct, nonzero sender and recipient addresses.")
  }
  const amountNative = decimalUnits(intent.amount, 18)
  const amountErc20 = decimalUnits(intent.amount, 6)
  if (!Array.isArray(proof.txHashes) || !proof.txHashes.length || proof.txHashes.some((value) => typeof value !== "string" || !hashPattern.test(value))) {
    throw new Error("The export must include valid EVM transaction hashes.")
  }
  const hashes = [...new Set(proof.txHashes.map(lower))]
  const txHash = selectedHash ? lower(selectedHash) : hashes.length === 1 ? hashes[0] : null
  if (!txHash || !hashPattern.test(txHash) || !hashes.includes(txHash)) {
    throw new Error("Select one recorded transaction with --tx when the export contains multiple hashes.")
  }
  return { sender, recipient, amount: intent.amount, amountNative, amountErc20, txHash }
}

export function createArcReadRpc(fetchImpl = fetch, { signal, rpcUrl = ARC_RPC_URL } = {}) {
  if (![ARC_RPC_URL, ARC_FALLBACK_RPC_URL].includes(rpcUrl)) throw new Error("Only fixed Arc mainnet read endpoints are permitted.")
  let nextId = 0
  const rpc = async (method, params = []) => {
    if (!readMethods.has(method)) throw new Error("Only allowlisted read-only RPC methods are permitted.")
    const id = ++nextId
    const requestSignal = signal ? AbortSignal.any([signal, AbortSignal.timeout(15_000)]) : AbortSignal.timeout(15_000)
    const response = await fetchImpl(rpcUrl, {
      method: "POST", redirect: "error", cache: "no-store",
      signal: requestSignal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
    })
    if (!response.ok) throw new Error(`Arc RPC returned HTTP ${response.status}.`)
    const payload = await readRpcJson(response, requestSignal)
    if (payload?.jsonrpc !== "2.0" || payload.id !== id || payload.error || !("result" in payload)) {
      throw new Error(`Arc RPC could not complete ${method}.`)
    }
    return payload.result
  }
  return Object.assign(rpc, { rpcUrl })
}

async function readRpcJson(response, signal) {
  const limit = 2 * 1024 * 1024
  if (Number(response.headers.get("content-length")) > limit) throw new Error("Arc RPC response exceeded the read limit.")
  if (!response.body) throw new Error("Arc RPC returned an empty body.")
  const reader = response.body.getReader(), decoder = new TextDecoder()
  let bytes = 0, text = ""
  try {
    while (true) {
      signal.throwIfAborted()
      const { done, value } = await reader.read()
      if (done) break
      bytes += value.byteLength
      if (bytes > limit) { await reader.cancel(); throw new Error("Arc RPC response exceeded the read limit.") }
      text += decoder.decode(value, { stream: true })
    }
    signal.throwIfAborted()
    return JSON.parse(text + decoder.decode())
  } finally { reader.releaseLock() }
}

export async function probeArcMainnet(rpc) {
  const chainId = quantity(await rpc("eth_chainId"))
  if (chainId !== ARC_CHAIN_ID) throw new Error("RPC does not report Arc mainnet chain ID 5042.")
  return { rpcUrl: rpc.rpcUrl ?? ARC_RPC_URL, chainId: Number(chainId), readOnly: true, transactionVerified: false }
}

function systemTransfer(log) {
  if (lower(log?.address) !== USDC_SYSTEM_EMITTER || lower(log.topics?.[0]) !== TRANSFER_TOPIC || log.removed === true) return null
  if (log.topics.length !== 3 || !/^0x0{24}[0-9a-f]{40}$/i.test(log.topics[1]) || !/^0x0{24}[0-9a-f]{40}$/i.test(log.topics[2]) || !hashPattern.test(log.data ?? "")) return null
  return { sender: `0x${log.topics[1].slice(-40).toLowerCase()}`, recipient: `0x${log.topics[2].slice(-40).toLowerCase()}`, amount: BigInt(log.data), transactionHash: log.transactionHash, blockHash: log.blockHash, blockNumber: log.blockNumber }
}

function directSendRoute(tx, intent) {
  const value = quantity(tx.value)
  const input = lower(tx.input)
  if (lower(tx.to) === intent.recipient && value === intent.amountNative && input === "0x") return "native"
  const transferInput = `0xa9059cbb${intent.recipient.slice(2).padStart(64, "0")}${intent.amountErc20.toString(16).padStart(64, "0")}`
  if (lower(tx.to) === USDC_ERC20 && value === 0n && input === transferInput) return "erc20"
  return null
}

export async function verifyArcSend(proof, { rpc, txHash: selectedHash, checkedAt = new Date().toISOString() }) {
  const intent = parseArcSendProof(proof, selectedHash)
  await probeArcMainnet(rpc)
  const [tx, receipt] = await Promise.all([
    rpc("eth_getTransactionByHash", [intent.txHash]),
    rpc("eth_getTransactionReceipt", [intent.txHash]),
  ])
  return verifyObservedSend(intent, tx, receipt, { rpc, checkedAt })
}

async function verifyObservedSend(intent, tx, receipt, { rpc, checkedAt }) {
  const report = {
    schemaVersion: "kestrel-arc-send-verification/1", checkedAt,
    verificationMethod: "rpc-observation", rpcUrl: rpc.rpcUrl ?? ARC_RPC_URL,
    verified: false, status: "pending_or_not_found",
    network: { chain: "Arc", chainId: Number(ARC_CHAIN_ID), environment: "mainnet" },
    transactionHash: intent.txHash, explorerUrl: `https://explorer.arc.io/tx/${intent.txHash}`,
    intent: { sender: intent.sender, recipient: intent.recipient, amountUsdc: intent.amount },
    policySignatureVerified: false, providerFulfillmentVerified: false,
    limitations: "RPC observation of a direct Send only. Does not establish policy approval, identity, API fulfillment, revenue, or authenticity of the browser export.",
    checks: {}, observation: null,
  }
  if (!tx || !receipt) return report
  const blockNumber = quantity(receipt.blockNumber)
  const block = blockNumber !== null ? await rpc("eth_getBlockByNumber", [receipt.blockNumber, false]) : null
  const route = directSendRoute(tx, intent)
  // The system stream covers native and ERC-20 USDC at 18 decimals. Do not add
  // the parallel six-decimal ERC-20 Transfer log to this amount.
  const transfers = Array.isArray(receipt.logs) ? receipt.logs.map(systemTransfer).filter(Boolean) : []
  const outgoing = transfers.filter((transfer) => transfer.sender === intent.sender)
  const checks = {
    transactionHash: sameHash(tx.hash, intent.txHash) && sameHash(receipt.transactionHash, intent.txHash),
    transactionChain: quantity(tx.chainId) === ARC_CHAIN_ID,
    receiptSucceeded: quantity(receipt.status) === 1n,
    sender: lower(tx.from) === intent.sender && lower(receipt.from) === intent.sender,
    receiptTarget: addressPattern.test(tx.to ?? "") && lower(receipt.to) === lower(tx.to),
    directSendRoute: route !== null,
    includedInCanonicalBlock: blockNumber !== null && sameHash(tx.blockHash, receipt.blockHash)
      && sameHash(block?.hash, receipt.blockHash) && quantity(tx.blockNumber) === blockNumber
      && quantity(block?.number) === blockNumber && Array.isArray(block?.transactions)
      && block.transactions.some((hash) => sameHash(hash, intent.txHash)),
    exactUsdcTransfer: outgoing.length === 1 && outgoing[0].recipient === intent.recipient && outgoing[0].amount === intent.amountNative
      && sameHash(outgoing[0].transactionHash, intent.txHash) && sameHash(outgoing[0].blockHash, receipt.blockHash)
      && blockNumber !== null && quantity(outgoing[0].blockNumber) === blockNumber,
  }
  const gasUsed = quantity(receipt.gasUsed)
  const gasPrice = quantity(receipt.effectiveGasPrice)
  const verified = Object.values(checks).every(Boolean)
  return {
    ...report, verified, checks, status: verified ? "confirmed_send" : "verification_failed",
    observation: {
      route, blockNumber: blockNumber?.toString() ?? null, blockHash: receipt.blockHash ?? null,
      receiptStatus: receipt.status ?? null,
      actualGasUsdc: gasUsed !== null && gasPrice !== null ? formatUnits(gasUsed * gasPrice, 18) : null,
      matchingSystemTransfers: outgoing.filter((transfer) => transfer.recipient === intent.recipient && transfer.amount === intent.amountNative).length,
    },
  }
}


// Hash-only inspection derives transfer facts from calldata/value. It does not
// compare a user-supplied intent or establish who initiated the transaction.
export async function inspectArcTransaction(txHash, { rpc, checkedAt = new Date().toISOString() }) {
  if (typeof txHash !== "string" || !hashPattern.test(txHash)) throw new Error("Enter a 0x-prefixed transaction hash with 64 hexadecimal characters.")
  txHash = lower(txHash)
  await probeArcMainnet(rpc)
  const [tx, receipt] = await Promise.all([
    rpc("eth_getTransactionByHash", [txHash]), rpc("eth_getTransactionReceipt", [txHash]),
  ])
  const base = {
    schemaVersion: "kestrel-arc-transaction-inspection/1", checkedAt,
    verificationMethod: "rpc-observation", rpcUrl: rpc.rpcUrl ?? ARC_RPC_URL, readOnly: true,
    verified: false, status: "pending_or_not_found",
    network: { chain: "Arc", chainId: Number(ARC_CHAIN_ID), environment: "mainnet" },
    transactionHash: txHash, explorerUrl: `https://explorer.arc.io/tx/${txHash}`,
    transfer: null, checks: {}, observation: null,
    intentCompared: false, kestrelProvenanceVerified: false,
    policySignatureVerified: false, providerFulfillmentVerified: false,
    limitations: "One RPC's observation of a direct USDC transfer. No independently supplied intent, wallet ownership, Kestrel origin, policy approval, API fulfillment or revenue is verified. Canonical inclusion is checked at the time of this request; this is not an independent consensus proof.",
  }
  if (!tx || !receipt) return base
  const value = quantity(tx.value)
  const input = lower(tx.input)
  let recipient = lower(tx.to), amountNative = value, amountErc20 = null
  if (recipient === USDC_ERC20 && value === 0n && /^0xa9059cbb0{24}[0-9a-f]{40}[0-9a-f]{64}$/.test(input)) {
    recipient = `0x${input.slice(34, 74)}`
    amountErc20 = BigInt(`0x${input.slice(74)}`)
    amountNative = amountErc20 * 10n ** 12n
  } else if (input !== "0x") {
    return { ...base, status: "unsupported_transfer" }
  }
  const sender = lower(tx.from), zero = `0x${"0".repeat(40)}`
  if (!addressPattern.test(sender) || !addressPattern.test(recipient) || sender === recipient || [sender, recipient].includes(zero) || amountNative === null || amountNative <= 0n) {
    return { ...base, status: "unsupported_transfer" }
  }
  const amount = formatUnits(amountNative, 18)
  const intent = { sender, recipient, amount, amountNative, amountErc20: amountErc20 ?? amountNative / 10n ** 12n, txHash }
  const report = await verifyObservedSend(intent, tx, receipt, { rpc, checkedAt })
  return {
    ...base, verified: report.verified, status: report.status, checks: report.checks,
    transfer: { sender, recipient, amountUsdc: amount }, observation: report.observation,
  }
}

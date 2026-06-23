import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

const API_BASE_URL = "https://api.circle.com";
const BLOCKCHAIN = "ARC-TESTNET";
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
const DEFAULT_OPERATOR_WALLET_ID = "07ec819d-00d5-51df-bb56-5ed6a7028910";
const DEFAULT_OPERATOR_ADDRESS = "0xe587fe4875e8ce65a5473c66488b6bc7d54b80a8";

const execute = process.argv.includes("--execute");
const readSecret = async (value, filePath) => {
  if (value) return value;
  if (!filePath) return undefined;
  return (await readFile(filePath, "utf8")).trim();
};

const apiKey = await readSecret(
  process.env.CIRCLE_API_KEY,
  process.env.CIRCLE_API_KEY_FILE,
);
const entitySecret = await readSecret(
  process.env.CIRCLE_ENTITY_SECRET,
  process.env.CIRCLE_ENTITY_SECRET_FILE,
);
const walletId = process.env.ARC_ESCROW_OPERATOR_WALLET_ID ?? DEFAULT_OPERATOR_WALLET_ID;
const operatorAddress = process.env.ARC_ESCROW_OPERATOR_ADDRESS ?? DEFAULT_OPERATOR_ADDRESS;

if (!apiKey || !entitySecret) {
  throw new Error("CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET are required.");
}

const artifactDir = process.env.ARC_ESCROW_ARTIFACT_DIR ?? "/tmp/arc-escrow-build";
const [abiJson, bytecodeValue] = await Promise.all([
  readFile(`${artifactDir}/contracts_ArcEscrow_sol_ArcEscrow.abi`, "utf8"),
  readFile(`${artifactDir}/contracts_ArcEscrow_sol_ArcEscrow.bin`, "utf8"),
]);
const bytecode = bytecodeValue.trim().startsWith("0x")
  ? bytecodeValue.trim()
  : `0x${bytecodeValue.trim()}`;

const request = async (path, body) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Request-Id": randomUUID(),
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`Circle ${response.status}: ${JSON.stringify(payload)}`);
  }
  return payload;
};

const constructorParameters = [USDC_ADDRESS, operatorAddress];
const estimate = await request("/v1/w3s/contracts/deploy/estimateFee", {
  walletId,
  bytecode,
  constructorSignature: "constructor(address usdcAddress, address operatorAddress)",
  constructorParameters,
});

console.log(JSON.stringify({
  mode: execute ? "execute" : "estimate",
  blockchain: BLOCKCHAIN,
  walletId,
  operatorAddress,
  usdcAddress: USDC_ADDRESS,
  bytecodeBytes: (bytecode.length - 2) / 2,
  estimate: estimate.data,
}, null, 2));

if (!execute) {
  console.log("Estimate complete. Re-run with --execute to submit deployment.");
  process.exit(0);
}

const client = initiateDeveloperControlledWalletsClient({ apiKey, entitySecret });
const entitySecretCiphertext = await client.generateEntitySecretCiphertext();
const deployment = await request("/v1/w3s/contracts/deploy", {
  idempotencyKey: randomUUID(),
  name: "Arc Escrow",
  description: "Arc Suite programmable USDC milestone escrow on Arc Testnet",
  walletId,
  blockchain: BLOCKCHAIN,
  abiJson,
  bytecode,
  constructorParameters,
  feeLevel: "MEDIUM",
  entitySecretCiphertext,
  refId: "arc-suite-escrow-v1",
});

console.log(JSON.stringify({
  contractId: deployment.data?.contractId,
  transactionId: deployment.data?.transactionId,
}, null, 2));

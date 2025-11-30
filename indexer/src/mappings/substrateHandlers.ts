/**
 * Substrate Handlers
 *
 * Handlers for native Substrate extrinsics and events.
 */

import { SubstrateExtrinsic, SubstrateEvent } from "@subql/types";
import {
  Account,
  Transaction,
  Event,
  TransactionType,
  TransactionStatus,
} from "../types";
import {
  getOrCreateAccount,
  ss58ToHex,
  hexToSs58,
  SELENDRA_SS58_PREFIX,
} from "./utils";

/**
 * Handle all Substrate extrinsics
 */
export async function handleExtrinsic(
  extrinsic: SubstrateExtrinsic
): Promise<void> {
  const blockNumber = extrinsic.block.block.header.number.toNumber();
  const timestamp = extrinsic.block.timestamp
    ? new Date(extrinsic.block.timestamp.getTime())
    : new Date();

  // Get signer
  const signer = extrinsic.extrinsic.signer?.toString();
  if (!signer) return; // Skip unsigned extrinsics

  // Create or get sender account
  const fromAccount = await getOrCreateAccount(signer, blockNumber, timestamp);

  // Determine success/failure
  const success = !extrinsic.events.find(
    (e) => e.event.section === "system" && e.event.method === "ExtrinsicFailed"
  );

  // Calculate fee from events
  let fee = BigInt(0);
  const feeEvent = extrinsic.events.find(
    (e) =>
      e.event.section === "transactionPayment" &&
      e.event.method === "TransactionFeePaid"
  );
  if (feeEvent) {
    fee = BigInt(feeEvent.event.data[1]?.toString() || "0");
  }

  // Extract method info
  const section = extrinsic.extrinsic.method.section;
  const method = extrinsic.extrinsic.method.method;

  // Get recipient if this is a transfer
  let toAccount: Account | undefined;
  let value = BigInt(0);

  if (
    section === "balances" &&
    (method === "transfer" ||
      method === "transferKeepAlive" ||
      method === "transferAllowDeath")
  ) {
    const dest = extrinsic.extrinsic.args[0]?.toString();
    value = BigInt(extrinsic.extrinsic.args[1]?.toString() || "0");
    if (dest) {
      toAccount = await getOrCreateAccount(dest, blockNumber, timestamp);
    }
  }

  // Create transaction record
  const txRecord = Transaction.create({
    id: extrinsic.extrinsic.hash.toString(),
    type: TransactionType.SUBSTRATE,
    blockId: blockNumber.toString(),
    blockNumber,
    index: extrinsic.idx,
    timestamp,
    hash: extrinsic.extrinsic.hash.toString(),
    fromId: fromAccount.id,
    toId: toAccount?.id,
    value,
    fee,
    status: success ? TransactionStatus.SUCCESS : TransactionStatus.FAILED,
    palletName: section,
    methodName: method,
    isContractCreation: false,
  });

  await txRecord.save();

  // Update account stats
  fromAccount.transactionCount += 1;
  fromAccount.lastActiveBlock = blockNumber;
  fromAccount.lastActiveAt = timestamp;
  fromAccount.substrateNonce += 1;
  await fromAccount.save();
}

/**
 * Handle Balances.Transfer events
 * Simplified for faster initial sync
 */
export async function handleBalanceTransfer(
  event: SubstrateEvent
): Promise<void> {
  const blockNumber = event.block.block.header.number.toNumber();
  const timestamp = event.block.timestamp
    ? new Date(event.block.timestamp.getTime())
    : new Date();

  const [from, to, amount] = event.event.data;

  // Create event record only (skip account creation for speed)
  const eventRecord = Event.create({
    id: `${blockNumber}-${event.idx}`,
    transactionId:
      event.extrinsic?.extrinsic.hash.toString() ||
      `${blockNumber}-${event.idx}`,
    blockNumber,
    eventIndex: event.idx,
    palletName: "balances",
    methodName: "Transfer",
    data: JSON.stringify({
      from: from.toString(),
      to: to.toString(),
      amount: amount.toString(),
    }),
    timestamp,
  });

  await eventRecord.save();
}

/**
 * Handle EVM Executed events (from pallet-ethereum)
 */
export async function handleEvmExecuted(event: SubstrateEvent): Promise<void> {
  const blockNumber = event.block.block.header.number.toNumber();
  const timestamp = event.block.timestamp
    ? new Date(event.block.timestamp.getTime())
    : new Date();

  // Event data: (address, topics, data)
  const [from, to, transactionHash, exitReason] = event.event.data;

  // This is an EVM transaction wrapped in a Substrate extrinsic
  // The actual EVM details are handled by the Frontier EVM handlers

  const eventRecord = Event.create({
    id: `${blockNumber}-${event.idx}`,
    transactionId: transactionHash.toString(),
    blockNumber,
    eventIndex: event.idx,
    palletName: "ethereum",
    methodName: "Executed",
    data: JSON.stringify({
      from: from.toString(),
      to: to.toString(),
      transactionHash: transactionHash.toString(),
      exitReason: exitReason.toString(),
    }),
    timestamp,
  });

  await eventRecord.save();
}

/**
 * Handle Unified Accounts claim events
 */
export async function handleAccountClaimed(
  event: SubstrateEvent
): Promise<void> {
  const blockNumber = event.block.block.header.number.toNumber();
  const timestamp = event.block.timestamp
    ? new Date(event.block.timestamp.getTime())
    : new Date();

  const [substrateAddress, evmAddress] = event.event.data;

  // Get or create the account and mark as unified
  const account = await getOrCreateAccount(
    substrateAddress.toString(),
    blockNumber,
    timestamp
  );
  account.evmAddress = evmAddress.toString().toLowerCase();
  account.isUnified = true;
  await account.save();

  logger.info(`Account unified: ${substrateAddress} <-> ${evmAddress}`);
}

/**
 * Handle Identity Set events
 */
export async function handleIdentitySet(event: SubstrateEvent): Promise<void> {
  const blockNumber = event.block.block.header.number.toNumber();
  const timestamp = event.block.timestamp
    ? new Date(event.block.timestamp.getTime())
    : new Date();

  const [who] = event.event.data;

  // Get account and fetch identity info from storage
  const account = await getOrCreateAccount(
    who.toString(),
    blockNumber,
    timestamp
  );

  // Query identity from storage
  // Note: In production, you'd query api.query.identity.identityOf(who)
  // For now, we just mark that identity was set

  await account.save();
}

/**
 * Handle Identity Cleared events
 */
export async function handleIdentityCleared(
  event: SubstrateEvent
): Promise<void> {
  const blockNumber = event.block.block.header.number.toNumber();
  const timestamp = event.block.timestamp
    ? new Date(event.block.timestamp.getTime())
    : new Date();

  const [who] = event.event.data;

  const account = await getOrCreateAccount(
    who.toString(),
    blockNumber,
    timestamp
  );
  account.identityDisplay = undefined;
  account.identityEmail = undefined;
  account.identityWeb = undefined;
  account.identityTwitter = undefined;
  account.identityVerified = false;
  await account.save();
}

/**
 * EVM Handlers
 *
 * Handlers for Frontier EVM transactions and events.
 */

import {
  FrontierEvmCall,
  FrontierEvmEvent,
} from "@subql/frontier-evm-processor";
import {
  Account,
  Transaction,
  Contract,
  TransactionType,
  TransactionStatus,
  ContractType,
} from "../types";
import { getOrCreateAccountByEvmAddress } from "./utils";

/**
 * Handle EVM transactions
 */
export async function handleEvmTransaction(
  call: FrontierEvmCall
): Promise<void> {
  // FrontierEvmCall extends TransactionResponse from ethers v5
  const blockNumber = call.blockNumber ?? 0;
  const timestamp = call.timestamp
    ? new Date(call.timestamp * 1000)
    : new Date();

  const fromAddress = call.from.toLowerCase();
  const toAddress = call.to?.toLowerCase();

  // Get or create accounts
  const fromAccount = await getOrCreateAccountByEvmAddress(
    fromAddress,
    blockNumber,
    timestamp
  );
  let toAccount: Account | undefined;
  let createdContract: Contract | undefined;

  const isContractCreation = !toAddress && !!call.data && call.data.length > 2;

  if (isContractCreation) {
    // For contract creation, we'd need to calculate the address
    // In SubQuery, this is typically done via events
    // Skip contract creation tracking for now
  } else if (toAddress) {
    toAccount = await getOrCreateAccountByEvmAddress(
      toAddress,
      blockNumber,
      timestamp
    );

    // Check if interacting with a contract
    const existingContract = await Contract.get(toAddress);
    if (existingContract) {
      existingContract.transactionCount += 1;
      existingContract.lastInteractionAt = timestamp;
      await existingContract.save();
    }
  }

  // Parse method signature from input data
  let methodSignature: string | undefined;
  if (call.data && call.data.length >= 10) {
    methodSignature = call.data.slice(0, 10); // First 4 bytes (8 hex chars + 0x)
  }

  // Create transaction record
  const txRecord = Transaction.create({
    id: call.hash,
    type: TransactionType.EVM,
    blockId: blockNumber.toString(),
    blockNumber: blockNumber,
    index: call.nonce, // Use nonce as index since transactionIndex isn't available
    timestamp,
    hash: call.hash,
    fromId: fromAccount.id,
    toId: toAccount?.id,
    value: BigInt(call.value?.toString() || "0"),
    fee: BigInt(0), // Fee calculated from events
    status: call.success ? TransactionStatus.SUCCESS : TransactionStatus.FAILED,
    methodSignature,
    gasUsed: undefined,
    gasPrice: call.gasPrice ? BigInt(call.gasPrice.toString()) : undefined,
    gasLimit: call.gasLimit ? BigInt(call.gasLimit.toString()) : undefined,
    inputData: call.data,
    isContractCreation: isContractCreation,
    createdContractId: createdContract?.id,
  });

  await txRecord.save();

  // Update account stats
  fromAccount.transactionCount += 1;
  fromAccount.lastActiveBlock = blockNumber;
  fromAccount.lastActiveAt = timestamp;
  fromAccount.evmNonce += 1;
  await fromAccount.save();

  // Update block stats
  const block = await import("../types").then((m) =>
    m.Block.get(blockNumber.toString())
  );
  if (block) {
    block.evmTransactionCount += 1;
    await block.save();
  }
}

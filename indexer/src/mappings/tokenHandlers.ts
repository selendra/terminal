/**
 * Token Handlers
 *
 * Handlers for ERC-20, ERC-721, and ERC-1155 token events.
 * Simplified for faster initial sync.
 */

import { FrontierEvmEvent } from "@subql/frontier-evm-processor";
import { Token, TokenTransfer, TokenStandard } from "../types";

/**
 * Handle ERC-20 Transfer events
 * Simplified: just record the transfer, skip balance tracking
 */
export async function handleErc20Transfer(
  event: FrontierEvmEvent
): Promise<void> {
  const blockNumber = event.blockNumber ?? 0;
  const timestamp = event.blockTimestamp;

  const tokenAddress = event.address.toLowerCase();
  const [from, to, value] = event.args as [string, string, bigint];

  // Get or create token (lightweight)
  let token = await Token.get(tokenAddress);
  if (!token) {
    token = Token.create({
      id: tokenAddress,
      standard: TokenStandard.ERC20,
      holderCount: 0,
      transferCount: 0,
      createdAt: timestamp,
    });
  }
  token.transferCount += 1;
  await token.save();

  // Create transfer record (minimal data)
  const transfer = TokenTransfer.create({
    id: `${event.transactionHash}-${event.logIndex}`,
    tokenId: tokenAddress,
    transactionId: event.transactionHash ?? `block-${blockNumber}`,
    blockNumber,
    fromId: from.toLowerCase(),
    toId: to.toLowerCase(),
    amount: BigInt(value.toString()),
    timestamp,
  });
  await transfer.save();
}

/**
 * Handle ERC-721 Transfer events
 */
export async function handleErc721Transfer(
  event: FrontierEvmEvent
): Promise<void> {
  const blockNumber = event.blockNumber ?? 0;
  const timestamp = event.blockTimestamp;

  const tokenAddress = event.address.toLowerCase();
  const [from, to, nftTokenId] = event.args as [string, string, bigint];

  // Get or create token
  let token = await Token.get(tokenAddress);
  if (!token) {
    token = Token.create({
      id: tokenAddress,
      standard: TokenStandard.ERC721,
      holderCount: 0,
      transferCount: 0,
      createdAt: timestamp,
    });
  }
  token.transferCount += 1;
  await token.save();

  // Create transfer record
  const transfer = TokenTransfer.create({
    id: `${event.transactionHash}-${event.logIndex}`,
    tokenId: tokenAddress,
    transactionId: event.transactionHash ?? `block-${blockNumber}`,
    blockNumber,
    fromId: from.toLowerCase(),
    toId: to.toLowerCase(),
    amount: BigInt(1),
    nftTokenId: nftTokenId.toString(),
    timestamp,
  });
  await transfer.save();
}

/**
 * Handle ERC-1155 TransferSingle events
 */
export async function handleErc1155TransferSingle(
  event: FrontierEvmEvent
): Promise<void> {
  const blockNumber = event.blockNumber ?? 0;
  const timestamp = event.blockTimestamp;

  const tokenAddress = event.address.toLowerCase();
  const [operator, from, to, id, value] = event.args as [
    string,
    string,
    string,
    bigint,
    bigint
  ];

  // Get or create token
  let token = await Token.get(tokenAddress);
  if (!token) {
    token = Token.create({
      id: tokenAddress,
      standard: TokenStandard.ERC1155,
      holderCount: 0,
      transferCount: 0,
      createdAt: timestamp,
    });
  }
  token.transferCount += 1;
  await token.save();

  // Create transfer record
  const transfer = TokenTransfer.create({
    id: `${event.transactionHash}-${event.logIndex}`,
    tokenId: tokenAddress,
    transactionId: event.transactionHash ?? `block-${blockNumber}`,
    blockNumber,
    fromId: from.toLowerCase(),
    toId: to.toLowerCase(),
    amount: BigInt(value.toString()),
    nftTokenId: id.toString(),
    timestamp,
  });
  await transfer.save();
}

/**
 * Handle ERC-1155 TransferBatch events
 */
export async function handleErc1155TransferBatch(
  event: FrontierEvmEvent
): Promise<void> {
  const blockNumber = event.blockNumber ?? 0;
  const timestamp = event.blockTimestamp;

  const tokenAddress = event.address.toLowerCase();
  const [operator, from, to, ids, values] = event.args as [
    string,
    string,
    string,
    bigint[],
    bigint[]
  ];

  // Get or create token
  let token = await Token.get(tokenAddress);
  if (!token) {
    token = Token.create({
      id: tokenAddress,
      standard: TokenStandard.ERC1155,
      holderCount: 0,
      transferCount: 0,
      createdAt: timestamp,
    });
  }
  token.transferCount += ids.length;
  await token.save();

  // Create transfer records for each token in batch
  for (let i = 0; i < ids.length; i++) {
    const transfer = TokenTransfer.create({
      id: `${event.transactionHash}-${event.logIndex}-${i}`,
      tokenId: tokenAddress,
      transactionId: event.transactionHash ?? `block-${blockNumber}`,
      blockNumber,
      fromId: from.toLowerCase(),
      toId: to.toLowerCase(),
      amount: BigInt(values[i].toString()),
      nftTokenId: ids[i].toString(),
      timestamp,
    });
    await transfer.save();
  }
}

/**
 * Token Handlers
 *
 * Handlers for ERC-20, ERC-721, and ERC-1155 token events.
 */

import { FrontierEvmEvent } from "@subql/frontier-evm-processor";
import { Token, TokenTransfer, TokenBalance, TokenStandard } from "../types";
import { getOrCreateAccountByEvmAddress, getOrCreateToken } from "./utils";

/**
 * Handle ERC-20 Transfer events
 */
export async function handleErc20Transfer(
  event: FrontierEvmEvent
): Promise<void> {
  const blockNumber = event.blockNumber ?? 0;
  const timestamp = event.blockTimestamp;

  const tokenAddress = event.address.toLowerCase();
  const [from, to, value] = event.args as [string, string, bigint];

  // Get or create token
  const token = await getOrCreateToken(
    tokenAddress,
    TokenStandard.ERC20,
    blockNumber,
    timestamp
  );

  // Handle accounts
  const fromAccount =
    from !== "0x0000000000000000000000000000000000000000"
      ? await getOrCreateAccountByEvmAddress(
          from.toLowerCase(),
          blockNumber,
          timestamp
        )
      : null;
  const toAccount =
    to !== "0x0000000000000000000000000000000000000000"
      ? await getOrCreateAccountByEvmAddress(
          to.toLowerCase(),
          blockNumber,
          timestamp
        )
      : null;

  // Create transfer record
  const transfer = TokenTransfer.create({
    id: `${event.transactionHash}-${event.logIndex}`,
    tokenId: token.id,
    transactionId: event.transactionHash ?? `block-${blockNumber}`,
    blockNumber,
    fromId: fromAccount?.id || "zero",
    toId: toAccount?.id || "zero",
    amount: BigInt(value.toString()),
    timestamp,
  });
  await transfer.save();

  // Update token stats
  token.transferCount += 1;
  await token.save();

  // Update balances
  if (fromAccount) {
    await updateTokenBalance(
      fromAccount.id,
      token.id,
      -BigInt(value.toString()),
      blockNumber,
      timestamp
    );
  }
  if (toAccount) {
    await updateTokenBalance(
      toAccount.id,
      token.id,
      BigInt(value.toString()),
      blockNumber,
      timestamp
    );
  }
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

  // Get or create token collection
  const token = await getOrCreateToken(
    tokenAddress,
    TokenStandard.ERC721,
    blockNumber,
    timestamp
  );

  // Handle accounts
  const fromAccount =
    from !== "0x0000000000000000000000000000000000000000"
      ? await getOrCreateAccountByEvmAddress(
          from.toLowerCase(),
          blockNumber,
          timestamp
        )
      : null;
  const toAccount =
    to !== "0x0000000000000000000000000000000000000000"
      ? await getOrCreateAccountByEvmAddress(
          to.toLowerCase(),
          blockNumber,
          timestamp
        )
      : null;

  // Create transfer record
  const transfer = TokenTransfer.create({
    id: `${event.transactionHash}-${event.logIndex}`,
    tokenId: token.id,
    transactionId: event.transactionHash ?? `block-${blockNumber}`,
    blockNumber,
    fromId: fromAccount?.id || "zero",
    toId: toAccount?.id || "zero",
    amount: BigInt(1),
    nftTokenId: nftTokenId.toString(),
    timestamp,
  });
  await transfer.save();

  // Update token stats
  token.transferCount += 1;
  await token.save();

  // Update NFT ownership
  if (fromAccount) {
    await updateNftOwnership(
      fromAccount.id,
      token.id,
      nftTokenId.toString(),
      false,
      blockNumber,
      timestamp
    );
  }
  if (toAccount) {
    await updateNftOwnership(
      toAccount.id,
      token.id,
      nftTokenId.toString(),
      true,
      blockNumber,
      timestamp
    );
  }
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
  const token = await getOrCreateToken(
    tokenAddress,
    TokenStandard.ERC1155,
    blockNumber,
    timestamp
  );

  // Handle accounts
  const fromAccount =
    from !== "0x0000000000000000000000000000000000000000"
      ? await getOrCreateAccountByEvmAddress(
          from.toLowerCase(),
          blockNumber,
          timestamp
        )
      : null;
  const toAccount =
    to !== "0x0000000000000000000000000000000000000000"
      ? await getOrCreateAccountByEvmAddress(
          to.toLowerCase(),
          blockNumber,
          timestamp
        )
      : null;

  // Create transfer record
  const transfer = TokenTransfer.create({
    id: `${event.transactionHash}-${event.logIndex}`,
    tokenId: token.id,
    transactionId: event.transactionHash ?? `block-${blockNumber}`,
    blockNumber,
    fromId: fromAccount?.id || "zero",
    toId: toAccount?.id || "zero",
    amount: BigInt(value.toString()),
    nftTokenId: id.toString(),
    timestamp,
  });
  await transfer.save();

  // Update token stats
  token.transferCount += 1;
  await token.save();
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
  const token = await getOrCreateToken(
    tokenAddress,
    TokenStandard.ERC1155,
    blockNumber,
    timestamp
  );

  // Handle accounts
  const fromAccount =
    from !== "0x0000000000000000000000000000000000000000"
      ? await getOrCreateAccountByEvmAddress(
          from.toLowerCase(),
          blockNumber,
          timestamp
        )
      : null;
  const toAccount =
    to !== "0x0000000000000000000000000000000000000000"
      ? await getOrCreateAccountByEvmAddress(
          to.toLowerCase(),
          blockNumber,
          timestamp
        )
      : null;

  // Create transfer records for each token in batch
  for (let i = 0; i < ids.length; i++) {
    const transfer = TokenTransfer.create({
      id: `${event.transactionHash}-${event.logIndex}-${i}`,
      tokenId: token.id,
      transactionId: event.transactionHash ?? `block-${blockNumber}`,
      blockNumber,
      fromId: fromAccount?.id || "zero",
      toId: toAccount?.id || "zero",
      amount: BigInt(values[i].toString()),
      nftTokenId: ids[i].toString(),
      timestamp,
    });
    await transfer.save();
  }

  // Update token stats
  token.transferCount += ids.length;
  await token.save();
}

/**
 * Update token balance for an account
 */
async function updateTokenBalance(
  accountId: string,
  tokenId: string,
  change: bigint,
  blockNumber: number,
  timestamp: Date
): Promise<void> {
  const balanceId = `${accountId}-${tokenId}`;
  let balance = await TokenBalance.get(balanceId);

  if (!balance) {
    balance = TokenBalance.create({
      id: balanceId,
      accountId,
      tokenId,
      balance: BigInt(0),
      lastUpdatedBlock: blockNumber,
      lastUpdatedAt: timestamp,
    });

    // Update holder count
    const token = await Token.get(tokenId);
    if (token) {
      token.holderCount += 1;
      await token.save();
    }
  }

  balance.balance = balance.balance + change;
  balance.lastUpdatedBlock = blockNumber;
  balance.lastUpdatedAt = timestamp;

  // Remove balance if zero
  if (balance.balance <= BigInt(0)) {
    // Decrement holder count
    const token = await Token.get(tokenId);
    if (token && token.holderCount > 0) {
      token.holderCount -= 1;
      await token.save();
    }
  }

  await balance.save();
}

/**
 * Update NFT ownership for an account
 */
async function updateNftOwnership(
  accountId: string,
  tokenId: string,
  nftTokenId: string,
  isReceiving: boolean,
  blockNumber: number,
  timestamp: Date
): Promise<void> {
  const balanceId = `${accountId}-${tokenId}`;
  let balance = await TokenBalance.get(balanceId);

  if (!balance) {
    balance = TokenBalance.create({
      id: balanceId,
      accountId,
      tokenId,
      balance: BigInt(0),
      tokenIds: [],
      lastUpdatedBlock: blockNumber,
      lastUpdatedAt: timestamp,
    });

    // Update holder count
    const token = await Token.get(tokenId);
    if (token) {
      token.holderCount += 1;
      await token.save();
    }
  }

  const tokenIds = balance.tokenIds || [];

  if (isReceiving) {
    if (!tokenIds.includes(nftTokenId)) {
      tokenIds.push(nftTokenId);
    }
    balance.balance = BigInt(tokenIds.length);
  } else {
    const index = tokenIds.indexOf(nftTokenId);
    if (index > -1) {
      tokenIds.splice(index, 1);
    }
    balance.balance = BigInt(tokenIds.length);

    // Remove holder if no more NFTs
    if (tokenIds.length === 0) {
      const token = await Token.get(tokenId);
      if (token && token.holderCount > 0) {
        token.holderCount -= 1;
        await token.save();
      }
    }
  }

  balance.tokenIds = tokenIds;
  balance.lastUpdatedBlock = blockNumber;
  balance.lastUpdatedAt = timestamp;
  await balance.save();
}

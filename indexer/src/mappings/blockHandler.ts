/**
 * Block Handler
 *
 * Handles block-level events and statistics aggregation.
 */

import { SubstrateBlock } from "@subql/types";
import { Block, DailyStats } from "../types";

/**
 * Handle new blocks (processed every 100th block for stats)
 */
export async function handleBlock(block: SubstrateBlock): Promise<void> {
  const blockNumber = block.block.header.number.toNumber();
  const timestamp = block.timestamp
    ? new Date(block.timestamp.getTime())
    : new Date();

  // Create block record
  const blockRecord = Block.create({
    id: blockNumber.toString(),
    number: blockNumber,
    hash: block.block.hash.toString(),
    parentHash: block.block.header.parentHash.toString(),
    stateRoot: block.block.header.stateRoot.toString(),
    extrinsicsRoot: block.block.header.extrinsicsRoot.toString(),
    timestamp,
    extrinsicCount: block.block.extrinsics.length,
    evmTransactionCount: 0, // Updated by EVM handler
    eventCount: block.events.length,
    isFinalized: true, // Selendra has instant finality with AlephBFT
    specVersion: block.specVersion,
  });

  await blockRecord.save();

  // Update daily stats
  await updateDailyStats(timestamp, block);
}

/**
 * Update daily statistics
 */
async function updateDailyStats(
  timestamp: Date,
  block: SubstrateBlock
): Promise<void> {
  const dateStr = timestamp.toISOString().split("T")[0]; // YYYY-MM-DD

  let stats = await DailyStats.get(dateStr);

  if (!stats) {
    stats = DailyStats.create({
      id: dateStr,
      date: new Date(dateStr),
      blocksProduced: 0,
      substrateExtrinsics: 0,
      evmTransactions: 0,
      totalTransactions: 0,
      feesCollected: BigInt(0),
      newAccounts: 0,
      activeAccounts: 0,
      newContracts: 0,
      valueTransferred: BigInt(0),
      stakingRewards: BigInt(0),
    });
  }

  // Increment block count (note: we're sampling every 100th block)
  stats.blocksProduced += 100;
  stats.substrateExtrinsics += block.block.extrinsics.length * 100; // Estimate

  await stats.save();
}

/**
 * Staking Handlers
 *
 * Handlers for staking-related events (bond, unbond, rewards).
 */

import { SubstrateEvent } from "@subql/types";
import { StakingInfo, StakingReward, StakingStatus } from "../types";
import { getOrCreateAccount } from "./utils";

/**
 * Handle Staking.Bonded events
 */
export async function handleStakingBonded(
  event: SubstrateEvent
): Promise<void> {
  const blockNumber = event.block.block.header.number.toNumber();
  const timestamp = event.block.timestamp
    ? new Date(event.block.timestamp.getTime())
    : new Date();

  const [stash, amount] = event.event.data;

  // Get or create account
  const account = await getOrCreateAccount(
    stash.toString(),
    blockNumber,
    timestamp
  );

  // Get or create staking info
  let stakingInfo = await StakingInfo.get(account.id);

  if (!stakingInfo) {
    stakingInfo = StakingInfo.create({
      id: account.id,
      accountId: account.id,
      status: StakingStatus.NOMINATING,
      bonded: BigInt(0),
      activeStake: BigInt(0),
      isSlashed: false,
      totalRewards: BigInt(0),
    });
  }

  stakingInfo.bonded = stakingInfo.bonded + BigInt(amount.toString());
  stakingInfo.status = StakingStatus.NOMINATING;
  await stakingInfo.save();

  logger.info(`Staking bonded: ${stash} bonded ${amount}`);
}

/**
 * Handle Staking.Unbonded events
 */
export async function handleStakingUnbonded(
  event: SubstrateEvent
): Promise<void> {
  const blockNumber = event.block.block.header.number.toNumber();
  const timestamp = event.block.timestamp
    ? new Date(event.block.timestamp.getTime())
    : new Date();

  const [stash, amount] = event.event.data;

  const account = await getOrCreateAccount(
    stash.toString(),
    blockNumber,
    timestamp
  );
  let stakingInfo = await StakingInfo.get(account.id);

  if (stakingInfo) {
    stakingInfo.bonded = stakingInfo.bonded - BigInt(amount.toString());

    // Update status if fully unbonded
    if (stakingInfo.bonded <= BigInt(0)) {
      stakingInfo.status = StakingStatus.IDLE;
      stakingInfo.bonded = BigInt(0);
    }

    await stakingInfo.save();
  }

  logger.info(`Staking unbonded: ${stash} unbonded ${amount}`);
}

/**
 * Handle Staking.Rewarded events
 */
export async function handleStakingRewarded(
  event: SubstrateEvent
): Promise<void> {
  const blockNumber = event.block.block.header.number.toNumber();
  const timestamp = event.block.timestamp
    ? new Date(event.block.timestamp.getTime())
    : new Date();

  const [stash, amount] = event.event.data;

  const account = await getOrCreateAccount(
    stash.toString(),
    blockNumber,
    timestamp
  );
  let stakingInfo = await StakingInfo.get(account.id);

  if (!stakingInfo) {
    stakingInfo = StakingInfo.create({
      id: account.id,
      accountId: account.id,
      status: StakingStatus.NOMINATING,
      bonded: BigInt(0),
      activeStake: BigInt(0),
      isSlashed: false,
      totalRewards: BigInt(0),
    });
  }

  const rewardAmount = BigInt(amount.toString());
  stakingInfo.totalRewards = stakingInfo.totalRewards + rewardAmount;
  await stakingInfo.save();

  // Create reward record
  // Note: In production, you'd get the actual era from storage
  const era = Math.floor(blockNumber / 14400); // Approximate era calculation

  const rewardRecord = StakingReward.create({
    id: `${era}-${account.id}`,
    accountId: stakingInfo.id,
    era,
    amount: rewardAmount,
    blockNumber,
    timestamp,
  });
  await rewardRecord.save();

  // Update daily stats
  const dateStr = timestamp.toISOString().split("T")[0];
  const { DailyStats } = await import("../types");
  let stats = await DailyStats.get(dateStr);
  if (stats) {
    stats.stakingRewards = stats.stakingRewards + rewardAmount;
    await stats.save();
  }

  logger.info(`Staking reward: ${stash} received ${amount}`);
}

/**
 * Governance Handlers
 *
 * Handlers for democracy and governance events.
 */

import { SubstrateEvent } from "@subql/types";
import { Proposal, Vote, ProposalStatus, VoteType } from "../types";
import { getOrCreateAccount } from "./utils";

/**
 * Handle Democracy.Proposed events
 */
export async function handleDemocracyProposed(
  event: SubstrateEvent
): Promise<void> {
  const blockNumber = event.block.block.header.number.toNumber();
  const timestamp = event.block.timestamp
    ? new Date(event.block.timestamp.getTime())
    : new Date();

  const [proposalIndex, deposit] = event.event.data;

  // Get proposer from extrinsic
  const proposer = event.extrinsic?.extrinsic.signer?.toString();
  if (!proposer) return;

  const proposerAccount = await getOrCreateAccount(
    proposer,
    blockNumber,
    timestamp
  );

  // Create proposal record
  const proposal = Proposal.create({
    id: proposalIndex.toString(),
    index: Number(proposalIndex.toString()),
    proposerId: proposerAccount.id,
    status: ProposalStatus.ACTIVE,
    deposit: BigInt(deposit.toString()),
    ayeVotes: BigInt(0),
    nayVotes: BigInt(0),
    turnout: BigInt(0),
    createdAtBlock: blockNumber,
    createdAt: timestamp,
  });

  await proposal.save();

  logger.info(`New proposal #${proposalIndex} by ${proposer}`);
}

/**
 * Handle Democracy.Voted events
 */
export async function handleDemocracyVoted(
  event: SubstrateEvent
): Promise<void> {
  const blockNumber = event.block.block.header.number.toNumber();
  const timestamp = event.block.timestamp
    ? new Date(event.block.timestamp.getTime())
    : new Date();

  const [voter, refIndex, vote] = event.event.data;

  const voterAccount = await getOrCreateAccount(
    voter.toString(),
    blockNumber,
    timestamp
  );

  // Parse vote data
  const voteData = vote.toJSON() as any;
  const isAye =
    voteData?.Standard?.vote?.aye ||
    voteData?.Split?.aye > voteData?.Split?.nay;
  const balance = BigInt(voteData?.Standard?.balance?.toString() || "0");
  const conviction = voteData?.Standard?.vote?.conviction || 0;

  // Create vote record
  const voteRecord = Vote.create({
    id: `${refIndex}-${voterAccount.id}`,
    proposalId: refIndex.toString(),
    voterId: voterAccount.id,
    voteType: isAye ? VoteType.AYE : VoteType.NAY,
    balance,
    conviction,
    blockNumber,
    timestamp,
  });

  await voteRecord.save();

  // Update proposal totals
  const proposal = await Proposal.get(refIndex.toString());
  if (proposal) {
    if (isAye) {
      proposal.ayeVotes = proposal.ayeVotes + balance;
    } else {
      proposal.nayVotes = proposal.nayVotes + balance;
    }
    proposal.turnout = proposal.ayeVotes + proposal.nayVotes;
    await proposal.save();
  }

  logger.info(
    `Vote on referendum #${refIndex}: ${isAye ? "AYE" : "NAY"} from ${voter}`
  );
}

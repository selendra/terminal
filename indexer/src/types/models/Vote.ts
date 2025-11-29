// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';


import {
    VoteType,
} from '../enums';

export type VoteProps = Omit<Vote, NonNullable<FunctionPropertyNames<Vote>> | '_name'>;

/*
 * Compat types allows for support of alternative `id` types without refactoring the node
 */
type CompatVoteProps = Omit<VoteProps, 'id'> & { id: string; };
type CompatEntity = Omit<Entity, 'id'> & { id: string; };

export class Vote implements CompatEntity {

    constructor(
        
        id: string,
        proposalId: string,
        voterId: string,
        voteType: VoteType,
        balance: bigint,
        blockNumber: number,
        timestamp: Date,
    ) {
        this.id = id;
        this.proposalId = proposalId;
        this.voterId = voterId;
        this.voteType = voteType;
        this.balance = balance;
        this.blockNumber = blockNumber;
        this.timestamp = timestamp;
        
    }

    public id: string;
    public proposalId: string;
    public voterId: string;
    public voteType: VoteType;
    public balance: bigint;
    public conviction?: number;
    public blockNumber: number;
    public timestamp: Date;
    

    get _name(): string {
        return 'Vote';
    }

    async save(): Promise<void> {
        const id = this.id;
        assert(id !== null, "Cannot save Vote entity without an ID");
        await store.set('Vote', id.toString(), this as unknown as CompatVoteProps);
    }

    static async remove(id: string): Promise<void> {
        assert(id !== null, "Cannot remove Vote entity without an ID");
        await store.remove('Vote', id.toString());
    }

    static async get(id: string): Promise<Vote | undefined> {
        assert((id !== null && id !== undefined), "Cannot get Vote entity without an ID");
        const record = await store.get('Vote', id.toString());
        if (record) {
            return this.create(record as unknown as VoteProps);
        } else {
            return;
        }
    }

    static async getByProposalId(proposalId: string, options: GetOptions<CompatVoteProps>): Promise<Vote[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatVoteProps>('Vote', 'proposalId', proposalId, options);
        return records.map(record => this.create(record as unknown as VoteProps));
    }
    

    static async getByVoterId(voterId: string, options: GetOptions<CompatVoteProps>): Promise<Vote[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatVoteProps>('Vote', 'voterId', voterId, options);
        return records.map(record => this.create(record as unknown as VoteProps));
    }
    


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<VoteProps>[], options: GetOptions<VoteProps>): Promise<Vote[]> {
        const records = await store.getByFields<CompatVoteProps>('Vote', filter  as unknown as FieldsExpression<CompatVoteProps>[], options as unknown as GetOptions<CompatVoteProps>);
        return records.map(record => this.create(record as unknown as VoteProps));
    }

    static create(record: VoteProps): Vote {
        assert(record.id !== undefined && record.id !== null, "id must be provided");
        const entity = new this(
            record.id,
            record.proposalId,
            record.voterId,
            record.voteType,
            record.balance,
            record.blockNumber,
            record.timestamp,
        );
        Object.assign(entity,record);
        return entity;
    }
}

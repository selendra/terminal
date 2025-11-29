// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type StakingRewardProps = Omit<StakingReward, NonNullable<FunctionPropertyNames<StakingReward>> | '_name'>;

/*
 * Compat types allows for support of alternative `id` types without refactoring the node
 */
type CompatStakingRewardProps = Omit<StakingRewardProps, 'id'> & { id: string; };
type CompatEntity = Omit<Entity, 'id'> & { id: string; };

export class StakingReward implements CompatEntity {

    constructor(
        
        id: string,
        accountId: string,
        era: number,
        amount: bigint,
        blockNumber: number,
        timestamp: Date,
    ) {
        this.id = id;
        this.accountId = accountId;
        this.era = era;
        this.amount = amount;
        this.blockNumber = blockNumber;
        this.timestamp = timestamp;
        
    }

    public id: string;
    public accountId: string;
    public era: number;
    public amount: bigint;
    public blockNumber: number;
    public timestamp: Date;
    

    get _name(): string {
        return 'StakingReward';
    }

    async save(): Promise<void> {
        const id = this.id;
        assert(id !== null, "Cannot save StakingReward entity without an ID");
        await store.set('StakingReward', id.toString(), this as unknown as CompatStakingRewardProps);
    }

    static async remove(id: string): Promise<void> {
        assert(id !== null, "Cannot remove StakingReward entity without an ID");
        await store.remove('StakingReward', id.toString());
    }

    static async get(id: string): Promise<StakingReward | undefined> {
        assert((id !== null && id !== undefined), "Cannot get StakingReward entity without an ID");
        const record = await store.get('StakingReward', id.toString());
        if (record) {
            return this.create(record as unknown as StakingRewardProps);
        } else {
            return;
        }
    }

    static async getByAccountId(accountId: string, options: GetOptions<CompatStakingRewardProps>): Promise<StakingReward[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatStakingRewardProps>('StakingReward', 'accountId', accountId, options);
        return records.map(record => this.create(record as unknown as StakingRewardProps));
    }
    

    static async getByEra(era: number, options: GetOptions<CompatStakingRewardProps>): Promise<StakingReward[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatStakingRewardProps>('StakingReward', 'era', era, options);
        return records.map(record => this.create(record as unknown as StakingRewardProps));
    }
    

    static async getByTimestamp(timestamp: Date, options: GetOptions<CompatStakingRewardProps>): Promise<StakingReward[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatStakingRewardProps>('StakingReward', 'timestamp', timestamp, options);
        return records.map(record => this.create(record as unknown as StakingRewardProps));
    }
    


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<StakingRewardProps>[], options: GetOptions<StakingRewardProps>): Promise<StakingReward[]> {
        const records = await store.getByFields<CompatStakingRewardProps>('StakingReward', filter  as unknown as FieldsExpression<CompatStakingRewardProps>[], options as unknown as GetOptions<CompatStakingRewardProps>);
        return records.map(record => this.create(record as unknown as StakingRewardProps));
    }

    static create(record: StakingRewardProps): StakingReward {
        assert(record.id !== undefined && record.id !== null, "id must be provided");
        const entity = new this(
            record.id,
            record.accountId,
            record.era,
            record.amount,
            record.blockNumber,
            record.timestamp,
        );
        Object.assign(entity,record);
        return entity;
    }
}

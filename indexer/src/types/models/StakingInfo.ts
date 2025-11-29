// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';


import {
    StakingStatus,
} from '../enums';

export type StakingInfoProps = Omit<StakingInfo, NonNullable<FunctionPropertyNames<StakingInfo>> | '_name'>;

/*
 * Compat types allows for support of alternative `id` types without refactoring the node
 */
type CompatStakingInfoProps = Omit<StakingInfoProps, 'id'> & { id: string; };
type CompatEntity = Omit<Entity, 'id'> & { id: string; };

export class StakingInfo implements CompatEntity {

    constructor(
        
        id: string,
        accountId: string,
        status: StakingStatus,
        bonded: bigint,
        activeStake: bigint,
        isSlashed: boolean,
        totalRewards: bigint,
    ) {
        this.id = id;
        this.accountId = accountId;
        this.status = status;
        this.bonded = bonded;
        this.activeStake = activeStake;
        this.isSlashed = isSlashed;
        this.totalRewards = totalRewards;
        
    }

    public id: string;
    public accountId: string;
    public status: StakingStatus;
    public bonded: bigint;
    public activeStake: bigint;
    public ownStake?: bigint;
    public totalNominatorStake?: bigint;
    public commission?: number;
    public nominatorCount?: number;
    public nominations?: string[];
    public rewardDestination?: string;
    public isSlashed: boolean;
    public lastRewardEra?: number;
    public totalRewards: bigint;
    

    get _name(): string {
        return 'StakingInfo';
    }

    async save(): Promise<void> {
        const id = this.id;
        assert(id !== null, "Cannot save StakingInfo entity without an ID");
        await store.set('StakingInfo', id.toString(), this as unknown as CompatStakingInfoProps);
    }

    static async remove(id: string): Promise<void> {
        assert(id !== null, "Cannot remove StakingInfo entity without an ID");
        await store.remove('StakingInfo', id.toString());
    }

    static async get(id: string): Promise<StakingInfo | undefined> {
        assert((id !== null && id !== undefined), "Cannot get StakingInfo entity without an ID");
        const record = await store.get('StakingInfo', id.toString());
        if (record) {
            return this.create(record as unknown as StakingInfoProps);
        } else {
            return;
        }
    }

    static async getByAccountId(accountId: string, options: GetOptions<CompatStakingInfoProps>): Promise<StakingInfo[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatStakingInfoProps>('StakingInfo', 'accountId', accountId, options);
        return records.map(record => this.create(record as unknown as StakingInfoProps));
    }
    


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<StakingInfoProps>[], options: GetOptions<StakingInfoProps>): Promise<StakingInfo[]> {
        const records = await store.getByFields<CompatStakingInfoProps>('StakingInfo', filter  as unknown as FieldsExpression<CompatStakingInfoProps>[], options as unknown as GetOptions<CompatStakingInfoProps>);
        return records.map(record => this.create(record as unknown as StakingInfoProps));
    }

    static create(record: StakingInfoProps): StakingInfo {
        assert(record.id !== undefined && record.id !== null, "id must be provided");
        const entity = new this(
            record.id,
            record.accountId,
            record.status,
            record.bonded,
            record.activeStake,
            record.isSlashed,
            record.totalRewards,
        );
        Object.assign(entity,record);
        return entity;
    }
}

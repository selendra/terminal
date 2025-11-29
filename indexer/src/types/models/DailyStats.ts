// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type DailyStatsProps = Omit<DailyStats, NonNullable<FunctionPropertyNames<DailyStats>> | '_name'>;

/*
 * Compat types allows for support of alternative `id` types without refactoring the node
 */
type CompatDailyStatsProps = Omit<DailyStatsProps, 'id'> & { id: string; };
type CompatEntity = Omit<Entity, 'id'> & { id: string; };

export class DailyStats implements CompatEntity {

    constructor(
        
        id: string,
        date: Date,
        blocksProduced: number,
        substrateExtrinsics: number,
        evmTransactions: number,
        totalTransactions: number,
        feesCollected: bigint,
        newAccounts: number,
        activeAccounts: number,
        newContracts: number,
        valueTransferred: bigint,
        stakingRewards: bigint,
    ) {
        this.id = id;
        this.date = date;
        this.blocksProduced = blocksProduced;
        this.substrateExtrinsics = substrateExtrinsics;
        this.evmTransactions = evmTransactions;
        this.totalTransactions = totalTransactions;
        this.feesCollected = feesCollected;
        this.newAccounts = newAccounts;
        this.activeAccounts = activeAccounts;
        this.newContracts = newContracts;
        this.valueTransferred = valueTransferred;
        this.stakingRewards = stakingRewards;
        
    }

    public id: string;
    public date: Date;
    public blocksProduced: number;
    public substrateExtrinsics: number;
    public evmTransactions: number;
    public totalTransactions: number;
    public feesCollected: bigint;
    public newAccounts: number;
    public activeAccounts: number;
    public newContracts: number;
    public valueTransferred: bigint;
    public stakingRewards: bigint;
    public avgGasPrice?: bigint;
    public avgBlockTime?: number;
    

    get _name(): string {
        return 'DailyStats';
    }

    async save(): Promise<void> {
        const id = this.id;
        assert(id !== null, "Cannot save DailyStats entity without an ID");
        await store.set('DailyStats', id.toString(), this as unknown as CompatDailyStatsProps);
    }

    static async remove(id: string): Promise<void> {
        assert(id !== null, "Cannot remove DailyStats entity without an ID");
        await store.remove('DailyStats', id.toString());
    }

    static async get(id: string): Promise<DailyStats | undefined> {
        assert((id !== null && id !== undefined), "Cannot get DailyStats entity without an ID");
        const record = await store.get('DailyStats', id.toString());
        if (record) {
            return this.create(record as unknown as DailyStatsProps);
        } else {
            return;
        }
    }

    static async getByDate(date: Date, options: GetOptions<CompatDailyStatsProps>): Promise<DailyStats[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatDailyStatsProps>('DailyStats', 'date', date, options);
        return records.map(record => this.create(record as unknown as DailyStatsProps));
    }
    


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<DailyStatsProps>[], options: GetOptions<DailyStatsProps>): Promise<DailyStats[]> {
        const records = await store.getByFields<CompatDailyStatsProps>('DailyStats', filter  as unknown as FieldsExpression<CompatDailyStatsProps>[], options as unknown as GetOptions<CompatDailyStatsProps>);
        return records.map(record => this.create(record as unknown as DailyStatsProps));
    }

    static create(record: DailyStatsProps): DailyStats {
        assert(record.id !== undefined && record.id !== null, "id must be provided");
        const entity = new this(
            record.id,
            record.date,
            record.blocksProduced,
            record.substrateExtrinsics,
            record.evmTransactions,
            record.totalTransactions,
            record.feesCollected,
            record.newAccounts,
            record.activeAccounts,
            record.newContracts,
            record.valueTransferred,
            record.stakingRewards,
        );
        Object.assign(entity,record);
        return entity;
    }
}

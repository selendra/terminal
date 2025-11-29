// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type AccountProps = Omit<Account, NonNullable<FunctionPropertyNames<Account>> | '_name'>;

/*
 * Compat types allows for support of alternative `id` types without refactoring the node
 */
type CompatAccountProps = Omit<AccountProps, 'id'> & { id: string; };
type CompatEntity = Omit<Entity, 'id'> & { id: string; };

export class Account implements CompatEntity {

    constructor(
        
        id: string,
        substrateAddress: string,
        isUnified: boolean,
        freeBalance: bigint,
        reservedBalance: bigint,
        substrateNonce: number,
        evmNonce: number,
        identityVerified: boolean,
        firstSeenBlock: number,
        firstSeenAt: Date,
        lastActiveBlock: number,
        lastActiveAt: Date,
        transactionCount: number,
    ) {
        this.id = id;
        this.substrateAddress = substrateAddress;
        this.isUnified = isUnified;
        this.freeBalance = freeBalance;
        this.reservedBalance = reservedBalance;
        this.substrateNonce = substrateNonce;
        this.evmNonce = evmNonce;
        this.identityVerified = identityVerified;
        this.firstSeenBlock = firstSeenBlock;
        this.firstSeenAt = firstSeenAt;
        this.lastActiveBlock = lastActiveBlock;
        this.lastActiveAt = lastActiveAt;
        this.transactionCount = transactionCount;
        
    }

    public id: string;
    public substrateAddress: string;
    public evmAddress?: string;
    public isUnified: boolean;
    public freeBalance: bigint;
    public reservedBalance: bigint;
    public substrateNonce: number;
    public evmNonce: number;
    public identityDisplay?: string;
    public identityEmail?: string;
    public identityWeb?: string;
    public identityTwitter?: string;
    public identityVerified: boolean;
    public firstSeenBlock: number;
    public firstSeenAt: Date;
    public lastActiveBlock: number;
    public lastActiveAt: Date;
    public transactionCount: number;
    

    get _name(): string {
        return 'Account';
    }

    async save(): Promise<void> {
        const id = this.id;
        assert(id !== null, "Cannot save Account entity without an ID");
        await store.set('Account', id.toString(), this as unknown as CompatAccountProps);
    }

    static async remove(id: string): Promise<void> {
        assert(id !== null, "Cannot remove Account entity without an ID");
        await store.remove('Account', id.toString());
    }

    static async get(id: string): Promise<Account | undefined> {
        assert((id !== null && id !== undefined), "Cannot get Account entity without an ID");
        const record = await store.get('Account', id.toString());
        if (record) {
            return this.create(record as unknown as AccountProps);
        } else {
            return;
        }
    }

    static async getBySubstrateAddress(substrateAddress: string, options: GetOptions<CompatAccountProps>): Promise<Account[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatAccountProps>('Account', 'substrateAddress', substrateAddress, options);
        return records.map(record => this.create(record as unknown as AccountProps));
    }
    

    static async getByEvmAddress(evmAddress: string, options: GetOptions<CompatAccountProps>): Promise<Account[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatAccountProps>('Account', 'evmAddress', evmAddress, options);
        return records.map(record => this.create(record as unknown as AccountProps));
    }
    


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<AccountProps>[], options: GetOptions<AccountProps>): Promise<Account[]> {
        const records = await store.getByFields<CompatAccountProps>('Account', filter  as unknown as FieldsExpression<CompatAccountProps>[], options as unknown as GetOptions<CompatAccountProps>);
        return records.map(record => this.create(record as unknown as AccountProps));
    }

    static create(record: AccountProps): Account {
        assert(record.id !== undefined && record.id !== null, "id must be provided");
        const entity = new this(
            record.id,
            record.substrateAddress,
            record.isUnified,
            record.freeBalance,
            record.reservedBalance,
            record.substrateNonce,
            record.evmNonce,
            record.identityVerified,
            record.firstSeenBlock,
            record.firstSeenAt,
            record.lastActiveBlock,
            record.lastActiveAt,
            record.transactionCount,
        );
        Object.assign(entity,record);
        return entity;
    }
}

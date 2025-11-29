// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type TokenBalanceProps = Omit<TokenBalance, NonNullable<FunctionPropertyNames<TokenBalance>> | '_name'>;

/*
 * Compat types allows for support of alternative `id` types without refactoring the node
 */
type CompatTokenBalanceProps = Omit<TokenBalanceProps, 'id'> & { id: string; };
type CompatEntity = Omit<Entity, 'id'> & { id: string; };

export class TokenBalance implements CompatEntity {

    constructor(
        
        id: string,
        accountId: string,
        tokenId: string,
        balance: bigint,
        lastUpdatedBlock: number,
        lastUpdatedAt: Date,
    ) {
        this.id = id;
        this.accountId = accountId;
        this.tokenId = tokenId;
        this.balance = balance;
        this.lastUpdatedBlock = lastUpdatedBlock;
        this.lastUpdatedAt = lastUpdatedAt;
        
    }

    public id: string;
    public accountId: string;
    public tokenId: string;
    public balance: bigint;
    public tokenIds?: string[];
    public lastUpdatedBlock: number;
    public lastUpdatedAt: Date;
    

    get _name(): string {
        return 'TokenBalance';
    }

    async save(): Promise<void> {
        const id = this.id;
        assert(id !== null, "Cannot save TokenBalance entity without an ID");
        await store.set('TokenBalance', id.toString(), this as unknown as CompatTokenBalanceProps);
    }

    static async remove(id: string): Promise<void> {
        assert(id !== null, "Cannot remove TokenBalance entity without an ID");
        await store.remove('TokenBalance', id.toString());
    }

    static async get(id: string): Promise<TokenBalance | undefined> {
        assert((id !== null && id !== undefined), "Cannot get TokenBalance entity without an ID");
        const record = await store.get('TokenBalance', id.toString());
        if (record) {
            return this.create(record as unknown as TokenBalanceProps);
        } else {
            return;
        }
    }

    static async getByAccountId(accountId: string, options: GetOptions<CompatTokenBalanceProps>): Promise<TokenBalance[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatTokenBalanceProps>('TokenBalance', 'accountId', accountId, options);
        return records.map(record => this.create(record as unknown as TokenBalanceProps));
    }
    

    static async getByTokenId(tokenId: string, options: GetOptions<CompatTokenBalanceProps>): Promise<TokenBalance[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatTokenBalanceProps>('TokenBalance', 'tokenId', tokenId, options);
        return records.map(record => this.create(record as unknown as TokenBalanceProps));
    }
    


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<TokenBalanceProps>[], options: GetOptions<TokenBalanceProps>): Promise<TokenBalance[]> {
        const records = await store.getByFields<CompatTokenBalanceProps>('TokenBalance', filter  as unknown as FieldsExpression<CompatTokenBalanceProps>[], options as unknown as GetOptions<CompatTokenBalanceProps>);
        return records.map(record => this.create(record as unknown as TokenBalanceProps));
    }

    static create(record: TokenBalanceProps): TokenBalance {
        assert(record.id !== undefined && record.id !== null, "id must be provided");
        const entity = new this(
            record.id,
            record.accountId,
            record.tokenId,
            record.balance,
            record.lastUpdatedBlock,
            record.lastUpdatedAt,
        );
        Object.assign(entity,record);
        return entity;
    }
}

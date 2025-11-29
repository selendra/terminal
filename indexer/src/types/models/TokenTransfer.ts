// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type TokenTransferProps = Omit<TokenTransfer, NonNullable<FunctionPropertyNames<TokenTransfer>> | '_name'>;

/*
 * Compat types allows for support of alternative `id` types without refactoring the node
 */
type CompatTokenTransferProps = Omit<TokenTransferProps, 'id'> & { id: string; };
type CompatEntity = Omit<Entity, 'id'> & { id: string; };

export class TokenTransfer implements CompatEntity {

    constructor(
        
        id: string,
        tokenId: string,
        transactionId: string,
        blockNumber: number,
        fromId: string,
        toId: string,
        amount: bigint,
        timestamp: Date,
    ) {
        this.id = id;
        this.tokenId = tokenId;
        this.transactionId = transactionId;
        this.blockNumber = blockNumber;
        this.fromId = fromId;
        this.toId = toId;
        this.amount = amount;
        this.timestamp = timestamp;
        
    }

    public id: string;
    public tokenId: string;
    public transactionId: string;
    public blockNumber: number;
    public fromId: string;
    public toId: string;
    public amount: bigint;
    public nftTokenId?: string;
    public timestamp: Date;
    

    get _name(): string {
        return 'TokenTransfer';
    }

    async save(): Promise<void> {
        const id = this.id;
        assert(id !== null, "Cannot save TokenTransfer entity without an ID");
        await store.set('TokenTransfer', id.toString(), this as unknown as CompatTokenTransferProps);
    }

    static async remove(id: string): Promise<void> {
        assert(id !== null, "Cannot remove TokenTransfer entity without an ID");
        await store.remove('TokenTransfer', id.toString());
    }

    static async get(id: string): Promise<TokenTransfer | undefined> {
        assert((id !== null && id !== undefined), "Cannot get TokenTransfer entity without an ID");
        const record = await store.get('TokenTransfer', id.toString());
        if (record) {
            return this.create(record as unknown as TokenTransferProps);
        } else {
            return;
        }
    }

    static async getByTokenId(tokenId: string, options: GetOptions<CompatTokenTransferProps>): Promise<TokenTransfer[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatTokenTransferProps>('TokenTransfer', 'tokenId', tokenId, options);
        return records.map(record => this.create(record as unknown as TokenTransferProps));
    }
    

    static async getByTransactionId(transactionId: string, options: GetOptions<CompatTokenTransferProps>): Promise<TokenTransfer[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatTokenTransferProps>('TokenTransfer', 'transactionId', transactionId, options);
        return records.map(record => this.create(record as unknown as TokenTransferProps));
    }
    

    static async getByBlockNumber(blockNumber: number, options: GetOptions<CompatTokenTransferProps>): Promise<TokenTransfer[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatTokenTransferProps>('TokenTransfer', 'blockNumber', blockNumber, options);
        return records.map(record => this.create(record as unknown as TokenTransferProps));
    }
    

    static async getByFromId(fromId: string, options: GetOptions<CompatTokenTransferProps>): Promise<TokenTransfer[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatTokenTransferProps>('TokenTransfer', 'fromId', fromId, options);
        return records.map(record => this.create(record as unknown as TokenTransferProps));
    }
    

    static async getByToId(toId: string, options: GetOptions<CompatTokenTransferProps>): Promise<TokenTransfer[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatTokenTransferProps>('TokenTransfer', 'toId', toId, options);
        return records.map(record => this.create(record as unknown as TokenTransferProps));
    }
    

    static async getByTimestamp(timestamp: Date, options: GetOptions<CompatTokenTransferProps>): Promise<TokenTransfer[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatTokenTransferProps>('TokenTransfer', 'timestamp', timestamp, options);
        return records.map(record => this.create(record as unknown as TokenTransferProps));
    }
    


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<TokenTransferProps>[], options: GetOptions<TokenTransferProps>): Promise<TokenTransfer[]> {
        const records = await store.getByFields<CompatTokenTransferProps>('TokenTransfer', filter  as unknown as FieldsExpression<CompatTokenTransferProps>[], options as unknown as GetOptions<CompatTokenTransferProps>);
        return records.map(record => this.create(record as unknown as TokenTransferProps));
    }

    static create(record: TokenTransferProps): TokenTransfer {
        assert(record.id !== undefined && record.id !== null, "id must be provided");
        const entity = new this(
            record.id,
            record.tokenId,
            record.transactionId,
            record.blockNumber,
            record.fromId,
            record.toId,
            record.amount,
            record.timestamp,
        );
        Object.assign(entity,record);
        return entity;
    }
}

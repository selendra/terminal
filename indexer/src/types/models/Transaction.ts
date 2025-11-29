// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';


import {
    TransactionType,

    TransactionStatus,
} from '../enums';

export type TransactionProps = Omit<Transaction, NonNullable<FunctionPropertyNames<Transaction>> | '_name'>;

/*
 * Compat types allows for support of alternative `id` types without refactoring the node
 */
type CompatTransactionProps = Omit<TransactionProps, 'id'> & { id: string; };
type CompatEntity = Omit<Entity, 'id'> & { id: string; };

export class Transaction implements CompatEntity {

    constructor(
        
        id: string,
        type: TransactionType,
        blockId: string,
        blockNumber: number,
        index: number,
        timestamp: Date,
        hash: string,
        fromId: string,
        value: bigint,
        fee: bigint,
        status: TransactionStatus,
        isContractCreation: boolean,
    ) {
        this.id = id;
        this.type = type;
        this.blockId = blockId;
        this.blockNumber = blockNumber;
        this.index = index;
        this.timestamp = timestamp;
        this.hash = hash;
        this.fromId = fromId;
        this.value = value;
        this.fee = fee;
        this.status = status;
        this.isContractCreation = isContractCreation;
        
    }

    public id: string;
    public type: TransactionType;
    public blockId: string;
    public blockNumber: number;
    public index: number;
    public timestamp: Date;
    public hash: string;
    public fromId: string;
    public toId?: string;
    public value: bigint;
    public fee: bigint;
    public status: TransactionStatus;
    public palletName?: string;
    public methodName?: string;
    public methodSignature?: string;
    public gasUsed?: bigint;
    public gasPrice?: bigint;
    public gasLimit?: bigint;
    public inputData?: string;
    public errorMessage?: string;
    public isContractCreation: boolean;
    public createdContractId?: string;
    

    get _name(): string {
        return 'Transaction';
    }

    async save(): Promise<void> {
        const id = this.id;
        assert(id !== null, "Cannot save Transaction entity without an ID");
        await store.set('Transaction', id.toString(), this as unknown as CompatTransactionProps);
    }

    static async remove(id: string): Promise<void> {
        assert(id !== null, "Cannot remove Transaction entity without an ID");
        await store.remove('Transaction', id.toString());
    }

    static async get(id: string): Promise<Transaction | undefined> {
        assert((id !== null && id !== undefined), "Cannot get Transaction entity without an ID");
        const record = await store.get('Transaction', id.toString());
        if (record) {
            return this.create(record as unknown as TransactionProps);
        } else {
            return;
        }
    }

    static async getByBlockId(blockId: string, options: GetOptions<CompatTransactionProps>): Promise<Transaction[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatTransactionProps>('Transaction', 'blockId', blockId, options);
        return records.map(record => this.create(record as unknown as TransactionProps));
    }
    

    static async getByBlockNumber(blockNumber: number, options: GetOptions<CompatTransactionProps>): Promise<Transaction[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatTransactionProps>('Transaction', 'blockNumber', blockNumber, options);
        return records.map(record => this.create(record as unknown as TransactionProps));
    }
    

    static async getByTimestamp(timestamp: Date, options: GetOptions<CompatTransactionProps>): Promise<Transaction[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatTransactionProps>('Transaction', 'timestamp', timestamp, options);
        return records.map(record => this.create(record as unknown as TransactionProps));
    }
    

    static async getByHash(hash: string, options: GetOptions<CompatTransactionProps>): Promise<Transaction[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatTransactionProps>('Transaction', 'hash', hash, options);
        return records.map(record => this.create(record as unknown as TransactionProps));
    }
    

    static async getByFromId(fromId: string, options: GetOptions<CompatTransactionProps>): Promise<Transaction[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatTransactionProps>('Transaction', 'fromId', fromId, options);
        return records.map(record => this.create(record as unknown as TransactionProps));
    }
    

    static async getByToId(toId: string, options: GetOptions<CompatTransactionProps>): Promise<Transaction[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatTransactionProps>('Transaction', 'toId', toId, options);
        return records.map(record => this.create(record as unknown as TransactionProps));
    }
    

    static async getByCreatedContractId(createdContractId: string, options: GetOptions<CompatTransactionProps>): Promise<Transaction[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatTransactionProps>('Transaction', 'createdContractId', createdContractId, options);
        return records.map(record => this.create(record as unknown as TransactionProps));
    }
    


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<TransactionProps>[], options: GetOptions<TransactionProps>): Promise<Transaction[]> {
        const records = await store.getByFields<CompatTransactionProps>('Transaction', filter  as unknown as FieldsExpression<CompatTransactionProps>[], options as unknown as GetOptions<CompatTransactionProps>);
        return records.map(record => this.create(record as unknown as TransactionProps));
    }

    static create(record: TransactionProps): Transaction {
        assert(record.id !== undefined && record.id !== null, "id must be provided");
        const entity = new this(
            record.id,
            record.type,
            record.blockId,
            record.blockNumber,
            record.index,
            record.timestamp,
            record.hash,
            record.fromId,
            record.value,
            record.fee,
            record.status,
            record.isContractCreation,
        );
        Object.assign(entity,record);
        return entity;
    }
}

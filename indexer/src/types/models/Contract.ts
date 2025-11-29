// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';


import {
    ContractType,
} from '../enums';

export type ContractProps = Omit<Contract, NonNullable<FunctionPropertyNames<Contract>> | '_name'>;

/*
 * Compat types allows for support of alternative `id` types without refactoring the node
 */
type CompatContractProps = Omit<ContractProps, 'id'> & { id: string; };
type CompatEntity = Omit<Entity, 'id'> & { id: string; };

export class Contract implements CompatEntity {

    constructor(
        
        id: string,
        type: ContractType,
        creatorId: string,
        creationTransactionId: string,
        creationBlock: number,
        createdAt: Date,
        isVerified: boolean,
        isProxy: boolean,
        transactionCount: number,
    ) {
        this.id = id;
        this.type = type;
        this.creatorId = creatorId;
        this.creationTransactionId = creationTransactionId;
        this.creationBlock = creationBlock;
        this.createdAt = createdAt;
        this.isVerified = isVerified;
        this.isProxy = isProxy;
        this.transactionCount = transactionCount;
        
    }

    public id: string;
    public type: ContractType;
    public creatorId: string;
    public creationTransactionId: string;
    public creationBlock: number;
    public createdAt: Date;
    public codeHash?: string;
    public isVerified: boolean;
    public name?: string;
    public sourceCode?: string;
    public abi?: string;
    public compilerVersion?: string;
    public isProxy: boolean;
    public implementationId?: string;
    public transactionCount: number;
    public lastInteractionAt?: Date;
    

    get _name(): string {
        return 'Contract';
    }

    async save(): Promise<void> {
        const id = this.id;
        assert(id !== null, "Cannot save Contract entity without an ID");
        await store.set('Contract', id.toString(), this as unknown as CompatContractProps);
    }

    static async remove(id: string): Promise<void> {
        assert(id !== null, "Cannot remove Contract entity without an ID");
        await store.remove('Contract', id.toString());
    }

    static async get(id: string): Promise<Contract | undefined> {
        assert((id !== null && id !== undefined), "Cannot get Contract entity without an ID");
        const record = await store.get('Contract', id.toString());
        if (record) {
            return this.create(record as unknown as ContractProps);
        } else {
            return;
        }
    }

    static async getByCreatorId(creatorId: string, options: GetOptions<CompatContractProps>): Promise<Contract[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatContractProps>('Contract', 'creatorId', creatorId, options);
        return records.map(record => this.create(record as unknown as ContractProps));
    }
    

    static async getByCreationTransactionId(creationTransactionId: string, options: GetOptions<CompatContractProps>): Promise<Contract[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatContractProps>('Contract', 'creationTransactionId', creationTransactionId, options);
        return records.map(record => this.create(record as unknown as ContractProps));
    }
    

    static async getByCreationBlock(creationBlock: number, options: GetOptions<CompatContractProps>): Promise<Contract[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatContractProps>('Contract', 'creationBlock', creationBlock, options);
        return records.map(record => this.create(record as unknown as ContractProps));
    }
    

    static async getByCreatedAt(createdAt: Date, options: GetOptions<CompatContractProps>): Promise<Contract[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatContractProps>('Contract', 'createdAt', createdAt, options);
        return records.map(record => this.create(record as unknown as ContractProps));
    }
    

    static async getByImplementationId(implementationId: string, options: GetOptions<CompatContractProps>): Promise<Contract[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatContractProps>('Contract', 'implementationId', implementationId, options);
        return records.map(record => this.create(record as unknown as ContractProps));
    }
    


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<ContractProps>[], options: GetOptions<ContractProps>): Promise<Contract[]> {
        const records = await store.getByFields<CompatContractProps>('Contract', filter  as unknown as FieldsExpression<CompatContractProps>[], options as unknown as GetOptions<CompatContractProps>);
        return records.map(record => this.create(record as unknown as ContractProps));
    }

    static create(record: ContractProps): Contract {
        assert(record.id !== undefined && record.id !== null, "id must be provided");
        const entity = new this(
            record.id,
            record.type,
            record.creatorId,
            record.creationTransactionId,
            record.creationBlock,
            record.createdAt,
            record.isVerified,
            record.isProxy,
            record.transactionCount,
        );
        Object.assign(entity,record);
        return entity;
    }
}

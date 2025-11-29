// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';


import {
    TokenStandard,
} from '../enums';

export type TokenProps = Omit<Token, NonNullable<FunctionPropertyNames<Token>> | '_name'>;

/*
 * Compat types allows for support of alternative `id` types without refactoring the node
 */
type CompatTokenProps = Omit<TokenProps, 'id'> & { id: string; };
type CompatEntity = Omit<Entity, 'id'> & { id: string; };

export class Token implements CompatEntity {

    constructor(
        
        id: string,
        standard: TokenStandard,
        holderCount: number,
        transferCount: number,
        createdAt: Date,
    ) {
        this.id = id;
        this.standard = standard;
        this.holderCount = holderCount;
        this.transferCount = transferCount;
        this.createdAt = createdAt;
        
    }

    public id: string;
    public standard: TokenStandard;
    public name?: string;
    public symbol?: string;
    public decimals?: number;
    public totalSupply?: bigint;
    public contractId?: string;
    public holderCount: number;
    public transferCount: number;
    public createdAt: Date;
    

    get _name(): string {
        return 'Token';
    }

    async save(): Promise<void> {
        const id = this.id;
        assert(id !== null, "Cannot save Token entity without an ID");
        await store.set('Token', id.toString(), this as unknown as CompatTokenProps);
    }

    static async remove(id: string): Promise<void> {
        assert(id !== null, "Cannot remove Token entity without an ID");
        await store.remove('Token', id.toString());
    }

    static async get(id: string): Promise<Token | undefined> {
        assert((id !== null && id !== undefined), "Cannot get Token entity without an ID");
        const record = await store.get('Token', id.toString());
        if (record) {
            return this.create(record as unknown as TokenProps);
        } else {
            return;
        }
    }

    static async getByContractId(contractId: string, options: GetOptions<CompatTokenProps>): Promise<Token[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatTokenProps>('Token', 'contractId', contractId, options);
        return records.map(record => this.create(record as unknown as TokenProps));
    }
    


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<TokenProps>[], options: GetOptions<TokenProps>): Promise<Token[]> {
        const records = await store.getByFields<CompatTokenProps>('Token', filter  as unknown as FieldsExpression<CompatTokenProps>[], options as unknown as GetOptions<CompatTokenProps>);
        return records.map(record => this.create(record as unknown as TokenProps));
    }

    static create(record: TokenProps): Token {
        assert(record.id !== undefined && record.id !== null, "id must be provided");
        const entity = new this(
            record.id,
            record.standard,
            record.holderCount,
            record.transferCount,
            record.createdAt,
        );
        Object.assign(entity,record);
        return entity;
    }
}

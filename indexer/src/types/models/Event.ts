// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type EventProps = Omit<Event, NonNullable<FunctionPropertyNames<Event>> | '_name'>;

/*
 * Compat types allows for support of alternative `id` types without refactoring the node
 */
type CompatEventProps = Omit<EventProps, 'id'> & { id: string; };
type CompatEntity = Omit<Entity, 'id'> & { id: string; };

export class Event implements CompatEntity {

    constructor(
        
        id: string,
        transactionId: string,
        blockNumber: number,
        eventIndex: number,
        timestamp: Date,
    ) {
        this.id = id;
        this.transactionId = transactionId;
        this.blockNumber = blockNumber;
        this.eventIndex = eventIndex;
        this.timestamp = timestamp;
        
    }

    public id: string;
    public transactionId: string;
    public blockNumber: number;
    public eventIndex: number;
    public palletName?: string;
    public methodName?: string;
    public contractAddress?: string;
    public topics?: string[];
    public data?: string;
    public timestamp: Date;
    

    get _name(): string {
        return 'Event';
    }

    async save(): Promise<void> {
        const id = this.id;
        assert(id !== null, "Cannot save Event entity without an ID");
        await store.set('Event', id.toString(), this as unknown as CompatEventProps);
    }

    static async remove(id: string): Promise<void> {
        assert(id !== null, "Cannot remove Event entity without an ID");
        await store.remove('Event', id.toString());
    }

    static async get(id: string): Promise<Event | undefined> {
        assert((id !== null && id !== undefined), "Cannot get Event entity without an ID");
        const record = await store.get('Event', id.toString());
        if (record) {
            return this.create(record as unknown as EventProps);
        } else {
            return;
        }
    }

    static async getByTransactionId(transactionId: string, options: GetOptions<CompatEventProps>): Promise<Event[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatEventProps>('Event', 'transactionId', transactionId, options);
        return records.map(record => this.create(record as unknown as EventProps));
    }
    

    static async getByBlockNumber(blockNumber: number, options: GetOptions<CompatEventProps>): Promise<Event[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatEventProps>('Event', 'blockNumber', blockNumber, options);
        return records.map(record => this.create(record as unknown as EventProps));
    }
    

    static async getByPalletName(palletName: string, options: GetOptions<CompatEventProps>): Promise<Event[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatEventProps>('Event', 'palletName', palletName, options);
        return records.map(record => this.create(record as unknown as EventProps));
    }
    

    static async getByMethodName(methodName: string, options: GetOptions<CompatEventProps>): Promise<Event[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatEventProps>('Event', 'methodName', methodName, options);
        return records.map(record => this.create(record as unknown as EventProps));
    }
    

    static async getByContractAddress(contractAddress: string, options: GetOptions<CompatEventProps>): Promise<Event[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatEventProps>('Event', 'contractAddress', contractAddress, options);
        return records.map(record => this.create(record as unknown as EventProps));
    }
    


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<EventProps>[], options: GetOptions<EventProps>): Promise<Event[]> {
        const records = await store.getByFields<CompatEventProps>('Event', filter  as unknown as FieldsExpression<CompatEventProps>[], options as unknown as GetOptions<CompatEventProps>);
        return records.map(record => this.create(record as unknown as EventProps));
    }

    static create(record: EventProps): Event {
        assert(record.id !== undefined && record.id !== null, "id must be provided");
        const entity = new this(
            record.id,
            record.transactionId,
            record.blockNumber,
            record.eventIndex,
            record.timestamp,
        );
        Object.assign(entity,record);
        return entity;
    }
}

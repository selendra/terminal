// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';


import {
    ProposalStatus,
} from '../enums';

export type ProposalProps = Omit<Proposal, NonNullable<FunctionPropertyNames<Proposal>> | '_name'>;

/*
 * Compat types allows for support of alternative `id` types without refactoring the node
 */
type CompatProposalProps = Omit<ProposalProps, 'id'> & { id: string; };
type CompatEntity = Omit<Entity, 'id'> & { id: string; };

export class Proposal implements CompatEntity {

    constructor(
        
        id: string,
        index: number,
        proposerId: string,
        status: ProposalStatus,
        deposit: bigint,
        ayeVotes: bigint,
        nayVotes: bigint,
        turnout: bigint,
        createdAtBlock: number,
        createdAt: Date,
    ) {
        this.id = id;
        this.index = index;
        this.proposerId = proposerId;
        this.status = status;
        this.deposit = deposit;
        this.ayeVotes = ayeVotes;
        this.nayVotes = nayVotes;
        this.turnout = turnout;
        this.createdAtBlock = createdAtBlock;
        this.createdAt = createdAt;
        
    }

    public id: string;
    public index: number;
    public proposerId: string;
    public status: ProposalStatus;
    public title?: string;
    public description?: string;
    public preimageHash?: string;
    public deposit: bigint;
    public ayeVotes: bigint;
    public nayVotes: bigint;
    public turnout: bigint;
    public threshold?: string;
    public track?: string;
    public createdAtBlock: number;
    public createdAt: Date;
    public votingEndBlock?: number;
    public executionBlock?: number;
    

    get _name(): string {
        return 'Proposal';
    }

    async save(): Promise<void> {
        const id = this.id;
        assert(id !== null, "Cannot save Proposal entity without an ID");
        await store.set('Proposal', id.toString(), this as unknown as CompatProposalProps);
    }

    static async remove(id: string): Promise<void> {
        assert(id !== null, "Cannot remove Proposal entity without an ID");
        await store.remove('Proposal', id.toString());
    }

    static async get(id: string): Promise<Proposal | undefined> {
        assert((id !== null && id !== undefined), "Cannot get Proposal entity without an ID");
        const record = await store.get('Proposal', id.toString());
        if (record) {
            return this.create(record as unknown as ProposalProps);
        } else {
            return;
        }
    }

    static async getByIndex(index: number, options: GetOptions<CompatProposalProps>): Promise<Proposal[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatProposalProps>('Proposal', 'index', index, options);
        return records.map(record => this.create(record as unknown as ProposalProps));
    }
    

    static async getByProposerId(proposerId: string, options: GetOptions<CompatProposalProps>): Promise<Proposal[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatProposalProps>('Proposal', 'proposerId', proposerId, options);
        return records.map(record => this.create(record as unknown as ProposalProps));
    }
    

    static async getByCreatedAt(createdAt: Date, options: GetOptions<CompatProposalProps>): Promise<Proposal[]> {
        // Inputs must be cast as the store interface has not been updated to support alternative ID types
        const records = await store.getByField<CompatProposalProps>('Proposal', 'createdAt', createdAt, options);
        return records.map(record => this.create(record as unknown as ProposalProps));
    }
    


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<ProposalProps>[], options: GetOptions<ProposalProps>): Promise<Proposal[]> {
        const records = await store.getByFields<CompatProposalProps>('Proposal', filter  as unknown as FieldsExpression<CompatProposalProps>[], options as unknown as GetOptions<CompatProposalProps>);
        return records.map(record => this.create(record as unknown as ProposalProps));
    }

    static create(record: ProposalProps): Proposal {
        assert(record.id !== undefined && record.id !== null, "id must be provided");
        const entity = new this(
            record.id,
            record.index,
            record.proposerId,
            record.status,
            record.deposit,
            record.ayeVotes,
            record.nayVotes,
            record.turnout,
            record.createdAtBlock,
            record.createdAt,
        );
        Object.assign(entity,record);
        return entity;
    }
}

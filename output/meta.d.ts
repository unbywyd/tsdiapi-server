import { TSchema } from '@sinclair/typebox';
export type SchemaType = 'params' | 'query' | 'body' | 'headers' | 'response';
export interface MetaEntry {
    type: SchemaType;
    id?: string;
    schema: TSchema;
    statusCode?: number;
}
export interface MetaRouteEntry {
    route: string;
    method: string;
    meta: Array<MetaEntry>;
}
export declare class MetaRouteSchemaStorage {
    private readonly storage;
    add(entry: MetaRouteEntry): void;
    getAll(): MetaRouteEntry[];
    clear(): void;
}
export declare const metaRouteSchemaStorage: MetaRouteSchemaStorage;
export declare const getAllSchemas: () => Array<MetaEntry>;
export declare class MetaSchemaStorage {
    private readonly storage;
    add(entry: MetaEntry): void;
    findById(id: string): MetaEntry | undefined;
    getAll(): MetaEntry[];
    clear(): void;
}
//# sourceMappingURL=meta.d.ts.map
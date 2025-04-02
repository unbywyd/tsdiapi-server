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

export class MetaRouteSchemaStorage {
    private readonly storage: MetaRouteEntry[] = [];

    public add(entry: MetaRouteEntry) {
        this.storage.push(entry);
    }

    public getAll(): MetaRouteEntry[] {
        return this.storage;
    }

    public clear() {
        this.storage.length = 0;
    }
}

export const metaRouteSchemaStorage = new MetaRouteSchemaStorage();

export const getAllSchemas = (): Array<MetaEntry> => {
    const schemas: Array<MetaEntry> = [];

    metaRouteSchemaStorage.getAll().forEach(entry => {
        entry.meta.forEach(meta => {
            if (meta.id) {
                schemas.push({
                    ...meta,
                    id: meta.id ? meta.id : undefined,
                });
            } else {
                schemas.push(meta);
            }
        });
    });

    return schemas;
}


export class MetaSchemaStorage {
    private readonly storage: MetaEntry[] = [];

    public add(entry: MetaEntry) {
        this.storage.push(entry);
    }

    public findById(id: string): MetaEntry | undefined {
        return this.storage.find(entry => entry.id === id);
    }

    public getAll(): MetaEntry[] {
        return this.storage;
    }
    public clear() {
        this.storage.length = 0;
    }
}


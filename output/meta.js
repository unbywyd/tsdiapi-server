export class MetaRouteSchemaStorage {
    storage = [];
    add(entry) {
        this.storage.push(entry);
    }
    getAll() {
        return this.storage;
    }
    clear() {
        this.storage.length = 0;
    }
}
export const metaRouteSchemaStorage = new MetaRouteSchemaStorage();
export const getAllSchemas = () => {
    const schemas = [];
    metaRouteSchemaStorage.getAll().forEach(entry => {
        entry.meta.forEach(meta => {
            if (meta.id) {
                schemas.push({
                    ...meta,
                    id: meta.id ? meta.id : undefined,
                });
            }
            else {
                schemas.push(meta);
            }
        });
    });
    return schemas;
};
export class MetaSchemaStorage {
    storage = [];
    add(entry) {
        this.storage.push(entry);
    }
    findById(id) {
        return this.storage.find(entry => entry.id === id);
    }
    getAll() {
        return this.storage;
    }
    clear() {
        this.storage.length = 0;
    }
}
//# sourceMappingURL=meta.js.map
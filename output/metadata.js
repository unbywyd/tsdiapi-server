class MetadataManager {
    entities = [];
    register(entity) {
        this.entities.push(entity);
    }
    use(pluginName) {
        return (meta) => {
            this.register({
                pluginName,
                ...meta
            });
        };
    }
    getAll() {
        return this.entities;
    }
}
export const metadataManager = new MetadataManager();
//# sourceMappingURL=metadata.js.map
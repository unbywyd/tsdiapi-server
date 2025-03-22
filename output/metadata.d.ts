interface Metadata {
    pluginName: string;
    name: string;
    metadata?: Record<string, any>;
}
declare class MetadataManager {
    private entities;
    register(entity: Metadata): void;
    use(pluginName: string): (meta: Omit<Metadata, "pluginName">) => void;
    getAll(): Metadata[];
}
export declare const metadataManager: MetadataManager;
export {};
//# sourceMappingURL=metadata.d.ts.map
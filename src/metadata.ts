
interface Metadata {
    pluginName: string;
    name: string;
    metadata?: Record<string, any>;
}

class MetadataManager {
    private entities: Metadata[] = [];

    register(entity: Metadata) {
        this.entities.push(entity);
    }

    use(pluginName: string) {
        return (meta: Omit<Metadata, 'pluginName'>): void => {
            this.register({
                pluginName,
                ...meta
            });
        }
    }

    getAll(): Metadata[] {
        return this.entities;
    }
}

export const metadataManager = new MetadataManager();

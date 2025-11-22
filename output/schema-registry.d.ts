import { FastifyInstance } from 'fastify';
import { TSchema } from '@sinclair/typebox';
/**
 * Schema registry for managing TypeBox schemas with $id
 *
 * NOTE: Schemas must be registered in correct dependency order.
 * If a schema uses Type.Ref() to reference another schema, the referenced
 * schema must be registered first. Fastify will throw an error otherwise.
 */
export interface SchemaRegistryOptions {
    /**
     * Enable logging of duplicate schema structure warnings
     * @default false - Duplicate warnings are disabled by default
     */
    logDuplicateSchemas?: boolean;
}
export declare class SchemaRegistry {
    private registeredIds;
    private schemaMap;
    private pendingSchemas;
    private flushed;
    readonly fastify: FastifyInstance;
    private readonly options;
    private originalAddSchema?;
    constructor(fastify: FastifyInstance, options?: SchemaRegistryOptions);
    /**
     * Override fastify.addSchema to use our addSchema method
     * This ensures all schema registration goes through our unified controller
     */
    private overrideFastifyAddSchema;
    /**
     * Restore original fastify.addSchema (useful for testing)
     */
    restoreFastifyAddSchema(): void;
    /**
     * Add schema to registry (safe duplicate registration)
     * - Requires $id (throws if missing)
     * - Checks for duplicates in registry and Fastify (silently skips if found)
     * - If not flushed yet: stores in pendingSchemas for later registration
     * - If already flushed: registers immediately in Fastify
     * - Returns schema with $id for type safety
     *
     * NOTE: Dependencies must be registered before schemas that reference them.
     * Fastify will throw an error if a referenced schema is not registered.
     */
    addSchema<T extends TSchema>(schema: T): T & {
        $id: string;
    };
    /**
     * Create a schema reference (Type.Ref())
     * Uses only string ID with generic type parameter to avoid circular dependency issues.
     * Generic type parameter is REQUIRED to ensure type safety.
     *
     * @example
     * ```typescript
     * registry.refSchema<typeof MySchema>('MySchema')
     * ```
     */
    refSchema<T extends TSchema>(schemaId: string): T & {
        $id: string;
    };
    /**
     * Flush all pending schemas to Fastify
     * Registers all schemas from lazy container in order they were added
     * After flush, all new schemas will be registered immediately
     *
     * NOTE: Schemas must be registered in correct dependency order.
     * If a schema references another schema via Type.Ref(), the referenced
     * schema must be registered first. Fastify will throw an error otherwise.
     */
    flushSchemas(): void;
    /**
     * Check if schema is a response wrapper (has structure { status: Literal, data: T })
     * Response wrappers are generated automatically and should be excluded from duplicate detection
     */
    private isResponseWrapper;
    /**
     * Check if schema is a Prisma-generated schema
     * Prisma-generated schemas follow similar patterns but have different fields, so they shouldn't be flagged as duplicates
     */
    private isPrismaGeneratedSchema;
    /**
     * Check for duplicate schemas by structure (not just by name)
     * Returns array of duplicate schema IDs if found
     * Checks both in-memory registry and Fastify instance
     * Excludes response wrappers from duplicate detection (they all have same structure by design)
     */
    private findDuplicateSchemas;
    /**
     * Register a schema with duplicate detection
     * NOTE: Dependencies must be registered before schemas that reference them.
     */
    register(schema: TSchema): void;
    /**
     * Register multiple schemas at once
     */
    registerMany(schemas: TSchema[]): void;
    /**
     * Register all schemas from schemaMap in Fastify
     * NOTE: Schemas must be registered in correct dependency order.
     * Fastify will throw an error if referenced schemas are not registered.
     */
    resolveAndRegister(): void;
    /**
     * Register schema in Fastify instance
     * Uses original Fastify method to avoid infinite recursion
     * Optimized: removed expensive structural comparison for performance
     */
    private registerInFastify;
    /**
     * Check if a schema is registered
     */
    isRegistered(schemaId: string): boolean;
    /**
     * Get all registered schema IDs
     */
    getRegisteredIds(): string[];
    /**
     * Get schema by ID from registry (checks both pending and registered schemas)
     */
    getSchema(schemaId: string): TSchema | undefined;
    /**
     * Get count of pending schemas (not yet flushed to Fastify)
     */
    getPendingCount(): number;
    /**
     * Check if schemas have been flushed
     */
    isFlushed(): boolean;
    /**
     * Clear registry (useful for testing)
     */
    clear(): void;
}
/**
 * Extract all exported schemas with $id from a module
 */
export declare function extractSchemasFromModule(module: any): TSchema[];
/**
 * Get or create global schema registry
 */
export declare function getSchemaRegistry(fastify?: FastifyInstance, options?: SchemaRegistryOptions): SchemaRegistry;
/**
 * Initialize global schema registry
 */
export declare function initializeSchemaRegistry(fastify: FastifyInstance, options?: SchemaRegistryOptions): SchemaRegistry;
/**
 * Clear global schema registry
 */
export declare function clearSchemaRegistry(): void;
/**
 * Global addSchema function - unified schema registration controller
 * Adds schema to lazy container (safe duplicate registration)
 * Returns schema with $id for type safety
 *
 * If registry is not initialized, schema is queued and will be registered when registry is initialized.
 *
 * @example
 * ```typescript
 * import { addSchema, Type } from '@tsdiapi/server';
 *
 * const MySchema = addSchema(Type.Object({ name: Type.String() }, { $id: 'MySchema' }));
 * ```
 */
export declare function addSchema<T extends TSchema>(schema: T): T & {
    $id: string;
};
/**
 * Global refSchema function - create schema reference
 *
 * Uses only string ID with generic type parameter to avoid circular dependency issues.
 * Generic type parameter is REQUIRED to ensure type safety.
 * This approach prevents TypeScript from trying to resolve schema types at compile time.
 *
 * @example
 * ```typescript
 * import { refSchema, Type, addSchema } from '@tsdiapi/server';
 *
 * const MySchema = addSchema(Type.Object({ name: Type.String() }, { $id: 'MySchema' }));
 *
 * // ✅ CORRECT - Use string ID with REQUIRED generic type
 * const ref = refSchema<typeof MySchema>('MySchema');
 * ```
 */
export declare function refSchema<T extends TSchema>(schemaId: string): T & {
    $id: string;
};
/**
 * Flush all pending schemas to Fastify
 * Should be called before server starts to register all schemas
 */
export declare function flushSchemas(): void;
/**
 * Automatically scan and register all schemas from .schemas.ts files
 * This should be called before loading route modules
 */
export declare function autoRegisterSchemas(fastify: FastifyInstance, apiDir: string, options?: SchemaRegistryOptions): Promise<void>;
//# sourceMappingURL=schema-registry.d.ts.map
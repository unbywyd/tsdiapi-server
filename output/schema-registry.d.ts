import { FastifyInstance } from 'fastify';
import { TSchema } from '@sinclair/typebox';
/**
 * Schema registry for managing TypeBox schemas with $id
 * Automatically resolves dependencies and registers schemas in correct order
 */
export declare class SchemaRegistry {
    private registeredIds;
    private schemaMap;
    private dependencies;
    readonly fastify: FastifyInstance;
    constructor(fastify: FastifyInstance);
    /**
     * Extract all schema IDs referenced via Type.Ref() from a schema
     */
    private extractDependencies;
    /**
     * Register a schema with dependency resolution
     */
    register(schema: TSchema): void;
    /**
     * Register multiple schemas at once
     */
    registerMany(schemas: TSchema[]): void;
    /**
     * Resolve and register all schemas in correct dependency order
     */
    resolveAndRegister(): void;
    /**
     * Topological sort for dependency resolution
     */
    private topologicalSort;
    /**
     * Register schema in Fastify instance
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
     * Clear registry (useful for testing)
     */
    clear(): void;
}
/**
 * Extract all exported schemas with $id from a module
 */
export declare function extractSchemasFromModule(module: any): TSchema[];
/**
 * Schema registration options
 */
export interface RegisterSchemaOptions {
    /**
     * Explicit schema ID. If not provided, will be auto-generated from schema name or variable name
     */
    id?: string;
    /**
     * Variable name (used for auto-generating $id if id not provided)
     */
    name?: string;
    /**
     * Whether to validate schema structure
     * @default true
     */
    validate?: boolean;
    /**
     * Whether to check dependencies
     * @default true
     */
    checkDependencies?: boolean;
    /**
     * Whether to throw error if schema already registered with different definition
     * @default true
     */
    strict?: boolean;
}
/**
 * Unified function for schema registration and reference creation
 *
 * This function combines registration and reference creation:
 * - Registers schema with automatic $id generation if needed
 * - Validates schema structure
 * - Checks and registers dependencies
 * - Prevents duplicate registrations
 * - Returns registered schema for use in routes
 * - Can be used to create Type.Ref() for nested schemas
 *
 * @example
 * ```typescript
 * import { useSchema, Type } from '@tsdiapi/server';
 *
 * // Register schema (auto-generates $id)
 * export const MySchema = useSchema(
 *   Type.Object({ name: Type.String() }),
 *   'MySchema'
 * );
 *
 * // Use in route
 * useRoute('project')
 *   .body(MySchema) // ✅ Works - schema is registered
 *   .build();
 *
 * // Use in nested schema (creates Type.Ref())
 * export const ListSchema = useSchema(
 *   Type.Object({
 *     items: Type.Array(useSchema(MySchema)) // ✅ Creates Type.Ref()
 *   }),
 *   'ListSchema'
 * );
 * ```
 */
export declare function useSchema<T extends TSchema>(schema: T): T & {
    $id: string;
};
export declare function useSchema<T extends TSchema>(schema: T, nameOrOptions: string | RegisterSchemaOptions): T & {
    $id: string;
};
/**
 * Get or create global schema registry
 */
export declare function getSchemaRegistry(fastify?: FastifyInstance): SchemaRegistry;
/**
 * Initialize global schema registry
 */
export declare function initializeSchemaRegistry(fastify: FastifyInstance): SchemaRegistry;
/**
 * Clear global schema registry
 */
export declare function clearSchemaRegistry(): void;
/**
 * Automatically scan and register all schemas from .schemas.ts files
 * This should be called before loading route modules
 */
export declare function autoRegisterSchemas(fastify: FastifyInstance, apiDir: string): Promise<void>;
//# sourceMappingURL=schema-registry.d.ts.map
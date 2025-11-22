import { FastifyInstance } from 'fastify';
import { TSchema, Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { find } from 'fsesm';
import { pathToFileURL } from 'url';
import path from 'path';

/**
 * Schema registry for managing TypeBox schemas with $id
 * Automatically resolves dependencies and registers schemas in correct order
 */
export class SchemaRegistry {
    private registeredIds = new Set<string>();
    private schemaMap = new Map<string, TSchema>();
    private dependencies = new Map<string, Set<string>>();
    public readonly fastify: FastifyInstance;

    constructor(fastify: FastifyInstance) {
        this.fastify = fastify;
    }

    /**
     * Extract all schema IDs referenced via Type.Ref() from a schema
     */
    private extractDependencies(schema: TSchema, dependencies: Set<string> = new Set(), visited: Set<TSchema> = new Set()): Set<string> {
        if (!schema || typeof schema !== 'object') {
            return dependencies;
        }

        // Prevent infinite recursion
        if (visited.has(schema)) {
            return dependencies;
        }
        visited.add(schema);

        // Check if this is a Type.Ref() - TypeBox stores ref in $ref property
        const refId = (schema as any).$ref;
        if (typeof refId === 'string') {
            dependencies.add(refId);
            return dependencies; // Don't recurse into refs
        }

        // Check for TypeBox internal ref structure
        const typeboxRef = (schema as any)[Symbol.for('TypeBox.Ref')];
        if (typeof typeboxRef === 'string') {
            dependencies.add(typeboxRef);
            return dependencies;
        }

        // Recursively check all properties
        for (const key in schema) {
            const value = (schema as any)[key];
            
            if (Array.isArray(value)) {
                value.forEach(item => {
                    if (item && typeof item === 'object') {
                        this.extractDependencies(item, dependencies, visited);
                    }
                });
            } else if (value && typeof value === 'object' && value !== null) {
                // Skip circular references
                if (!visited.has(value)) {
                    this.extractDependencies(value, dependencies, visited);
                }
            }
        }

        return dependencies;
    }

    /**
     * Register a schema with dependency resolution
     */
    public register(schema: TSchema): void {
        if (!schema || !schema.$id) {
            return;
        }

        const schemaId = schema.$id;
        
        // Skip if already registered
        if (this.registeredIds.has(schemaId)) {
            return;
        }

        // Store schema
        this.schemaMap.set(schemaId, schema);
        
        // Extract dependencies
        const deps = this.extractDependencies(schema);
        this.dependencies.set(schemaId, deps);
    }

    /**
     * Register multiple schemas at once
     */
    public registerMany(schemas: TSchema[]): void {
        for (const schema of schemas) {
            this.register(schema);
        }
    }

    /**
     * Resolve and register all schemas in correct dependency order
     */
    public resolveAndRegister(): void {
        const registered = new Set<string>();
        const toRegister = Array.from(this.schemaMap.keys());
        
        // Topological sort to register dependencies first
        const sorted = this.topologicalSort(toRegister);
        
        for (const schemaId of sorted) {
            const schema = this.schemaMap.get(schemaId);
            if (!schema) continue;
            
            // Register dependencies first
            const deps = this.dependencies.get(schemaId) || new Set();
            for (const depId of deps) {
                if (!registered.has(depId)) {
                    const depSchema = this.schemaMap.get(depId);
                    if (depSchema) {
                        this.registerInFastify(depSchema);
                        registered.add(depId);
                    }
                }
            }
            
            // Register the schema itself
            if (!registered.has(schemaId)) {
                this.registerInFastify(schema);
                registered.add(schemaId);
            }
        }
    }

    /**
     * Topological sort for dependency resolution
     */
    private topologicalSort(schemaIds: string[]): string[] {
        const visited = new Set<string>();
        const visiting = new Set<string>();
        const result: string[] = [];

        const visit = (id: string) => {
            if (visiting.has(id)) {
                // Circular dependency detected - register anyway
                return;
            }
            if (visited.has(id)) {
                return;
            }

            visiting.add(id);
            const deps = this.dependencies.get(id) || new Set();
            for (const depId of deps) {
                if (this.schemaMap.has(depId)) {
                    visit(depId);
                }
            }
            visiting.delete(id);
            visited.add(id);
            result.push(id);
        };

        for (const id of schemaIds) {
            if (!visited.has(id)) {
                visit(id);
            }
        }

        return result;
    }

    /**
     * Register schema in Fastify instance
     */
    private registerInFastify(schema: TSchema): void {
        if (!schema.$id) {
            return;
        }

        const schemaId = schema.$id;
        
        // Check if already registered in Fastify
        if (this.fastify.getSchema(schemaId)) {
            this.registeredIds.add(schemaId);
            return;
        }

        try {
            this.fastify.addSchema(schema);
            this.registeredIds.add(schemaId);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            // Handle duplicate registration gracefully
            if (errorMessage.includes('already exists') || 
                errorMessage.includes('duplicate') || 
                errorMessage.includes('already registered')) {
                this.registeredIds.add(schemaId);
                return;
            }
            
            console.error(`Failed to register schema "${schemaId}":`, errorMessage);
            throw error;
        }
    }

    /**
     * Check if a schema is registered
     */
    public isRegistered(schemaId: string): boolean {
        return this.registeredIds.has(schemaId) || !!this.fastify.getSchema(schemaId);
    }

    /**
     * Get all registered schema IDs
     */
    public getRegisteredIds(): string[] {
        return Array.from(this.registeredIds);
    }

    /**
     * Clear registry (useful for testing)
     */
    public clear(): void {
        this.registeredIds.clear();
        this.schemaMap.clear();
        this.dependencies.clear();
    }
}

/**
 * Extract all exported schemas with $id from a module
 */
export function extractSchemasFromModule(module: any): TSchema[] {
    const schemas: TSchema[] = [];
    
    if (!module || typeof module !== 'object') {
        return schemas;
    }

    // Check all exports
    for (const key in module) {
        // Skip default export and internal properties
        if (key === 'default' || key.startsWith('_')) {
            continue;
        }
        
        const value = module[key];
        
        // Check if it's a TypeBox schema with $id
        if (value && typeof value === 'object' && value.$id && typeof value.$id === 'string') {
            // Verify it's a valid TypeBox schema by checking for TypeBox properties
            // TypeBox schemas have specific structure
            const hasTypeBoxStructure = 
                value[Symbol.for('TypeBox.Kind')] !== undefined ||
                'type' in value ||
                'properties' in value ||
                'items' in value ||
                '$ref' in value;
            
            if (hasTypeBoxStructure) {
                schemas.push(value as TSchema);
            }
        }
    }

    return schemas;
}

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
// Overload: Create reference from schema that has $id (for use in nested schemas)
// Accepts any TSchema - checks $id at runtime and preserves type
export function useSchema<T extends TSchema>(schema: T): T & { $id: string };
// Overload: Register schema with name/options
export function useSchema<T extends TSchema>(
    schema: T,
    nameOrOptions: string | RegisterSchemaOptions
): T & { $id: string };
// Implementation
export function useSchema<T extends TSchema>(
    schema: T,
    nameOrOptions?: string | RegisterSchemaOptions
): T & { $id: string } {
    // If no nameOrOptions provided, check if schema has $id at runtime
    if (!nameOrOptions) {
        // Check if schema has $id at runtime (TypeBox stores it in the object, TypeScript may not see it)
        const schemaObj = schema as any;
        if (schemaObj && typeof schemaObj === 'object') {
            const schemaId = schemaObj.$id;
            if (schemaId && typeof schemaId === 'string') {
                // Register schema if registry is available (for dependency tracking)
                try {
                    const registry = getSchemaRegistry();
                    registry.register(schema);
                } catch (error) {
                    // Registry not initialized yet - that's okay, auto-registry will handle it
                }
                
                // Return schema itself with type assertion - it already has $id in runtime
                return schema as T & { $id: string };
            }
        }
        
        // Schema doesn't have $id, throw helpful error
        throw new Error(
            'useSchema: Schema must have $id property when used without name/options. ' +
            'The schema you passed does not have $id. ' +
            'Solutions:\n' +
            '1. Use useSchema(schema, "SchemaName") to register it first\n' +
            '2. Or ensure the schema has $id: Type.Object({...}, { $id: "SchemaName" })'
        );
    }
    
    // Otherwise, register schema
    if (!schema || typeof schema !== 'object') {
        throw new Error('useSchema: Schema must be a valid TypeBox schema object');
    }

    // Handle string parameter (simple case)
    let options: RegisterSchemaOptions;
    if (typeof nameOrOptions === 'string') {
        options = { name: nameOrOptions };
    } else {
        options = nameOrOptions || {};
    }

    const {
        id,
        name,
        validate = true,
        checkDependencies = true,
        strict = true
    } = options;

    // Generate $id if not provided
    let schemaId: string;
    if (id) {
        schemaId = id;
    } else if (schema.$id && typeof schema.$id === 'string') {
        schemaId = schema.$id;
    } else if (name) {
        schemaId = name;
    } else {
        throw new Error(
            'useSchema: Schema ID is required. ' +
            'Provide either: 1) explicit id option, 2) $id in schema, or 3) name option'
        );
    }

    // Validate schema structure if enabled
    if (validate) {
        validateSchemaStructure(schema, schemaId);
    }

    // Check if schema already registered
    try {
        const registry = getSchemaRegistry();
        const existingSchema = registry.fastify.getSchema(schemaId) as TSchema | undefined;
        
        if (existingSchema) {
            // Check if it's the same schema (by reference or structure)
            if (existingSchema === schema) {
                // Same schema, return it
                return schema as T & { $id: string };
            }
            
            if (strict) {
                // Check if schemas are structurally equivalent
                if (!areSchemasEquivalent(existingSchema, schema)) {
                    throw new Error(
                        `Schema "${schemaId}" is already registered with a different definition. ` +
                        `This usually means you have duplicate schema definitions. ` +
                        `Check your code for duplicate schema exports or conflicting $id values.`
                    );
                }
            }
            
            // Return existing schema
            return existingSchema as T & { $id: string };
        }
    } catch (error) {
        // Registry not initialized - that's okay, we'll register it
        if (error instanceof Error && !error.message.includes('not initialized')) {
            throw error;
        }
    }

    // Set $id on schema
    (schema as any).$id = schemaId;

    // Register schema
    try {
        const registry = getSchemaRegistry();
        
        // Check dependencies if enabled
        if (checkDependencies) {
            const deps = extractDependenciesFromSchema(schema);
            for (const depId of deps) {
                // Try to get dependency from registry
                const depSchema = registry.fastify.getSchema(depId);
                if (!depSchema) {
                    console.warn(
                        `Schema "${schemaId}" references "${depId}" which is not yet registered. ` +
                        `Make sure "${depId}" is registered before "${schemaId}".`
                    );
                }
            }
        }
        
        registry.register(schema);
        registry.resolveAndRegister();
    } catch (error) {
        // If registry not available, schema will be registered by auto-registry
        // But we still set $id for consistency
    }

    return schema as T & { $id: string };
}

/**
 * Validate schema structure
 */
function validateSchemaStructure(schema: TSchema, schemaId: string): void {
    // Basic validation - check if it looks like a TypeBox schema
    if (!schema || typeof schema !== 'object') {
        throw new Error(`Schema "${schemaId}" is not a valid object`);
    }

    // Check for common TypeBox schema properties
    const typeboxKind = Symbol.for('TypeBox.Kind');
    const hasTypeBoxStructure = 
        'type' in schema ||
        'properties' in schema ||
        'items' in schema ||
        '$ref' in schema ||
        (typeboxKind in schema && (schema as any)[typeboxKind] !== undefined);

    if (!hasTypeBoxStructure && !('$ref' in schema)) {
        console.warn(
            `Schema "${schemaId}" might not be a valid TypeBox schema. ` +
            `Make sure you're using Type.* functions from @sinclair/typebox`
        );
    }
}

/**
 * Check if two schemas are equivalent
 */
function areSchemasEquivalent(schema1: TSchema, schema2: TSchema): boolean {
    // Simple check - compare JSON representation
    // This is not perfect but catches most cases
    try {
        const json1 = JSON.stringify(schema1, null, 2);
        const json2 = JSON.stringify(schema2, null, 2);
        return json1 === json2;
    } catch {
        return false;
    }
}

/**
 * Extract dependencies from a schema (for validation)
 */
function extractDependenciesFromSchema(schema: TSchema): Set<string> {
    const deps = new Set<string>();
    
    function traverse(obj: any, visited: Set<any> = new Set()): void {
        if (!obj || typeof obj !== 'object' || visited.has(obj)) {
            return;
        }
        visited.add(obj);

        // Check for $ref
        if (typeof obj.$ref === 'string') {
            deps.add(obj.$ref);
            return; // Don't recurse into refs
        }

        // Recursively check all properties
        for (const key in obj) {
            const value = obj[key];
            if (Array.isArray(value)) {
                value.forEach(item => traverse(item, visited));
            } else if (value && typeof value === 'object') {
                traverse(value, visited);
            }
        }
    }

    traverse(schema);
    return deps;
}


/**
 * Global schema registry instance
 */
let globalRegistry: SchemaRegistry | null = null;

/**
 * Get or create global schema registry
 */
export function getSchemaRegistry(fastify?: FastifyInstance): SchemaRegistry {
    if (!globalRegistry && fastify) {
        globalRegistry = new SchemaRegistry(fastify);
    }
    if (!globalRegistry) {
        throw new Error('Schema registry not initialized. Call initializeSchemaRegistry() first.');
    }
    return globalRegistry;
}

/**
 * Initialize global schema registry
 */
export function initializeSchemaRegistry(fastify: FastifyInstance): SchemaRegistry {
    globalRegistry = new SchemaRegistry(fastify);
    return globalRegistry;
}

/**
 * Clear global schema registry
 */
export function clearSchemaRegistry(): void {
    globalRegistry = null;
}

/**
 * Automatically scan and register all schemas from .schemas.ts files
 * This should be called before loading route modules
 */
export async function autoRegisterSchemas(fastify: FastifyInstance, apiDir: string): Promise<void> {
    const registry = initializeSchemaRegistry(fastify);
    
    try {
        // Find all .schemas.ts files
        const schemaFiles = await find('**/*.schemas.ts', { 
            cwd: apiDir, 
            absolute: true 
        });

        // Also check for schemas in generated folder
        const generatedSchemaFiles = await find('**/generated/**/*.schemas.ts', { 
            cwd: path.dirname(apiDir), 
            absolute: true 
        }).catch((): string[] => []);

        const allSchemaFiles = [...schemaFiles, ...generatedSchemaFiles];

        // Load all schema files
        for (const filePath of allSchemaFiles) {
            try {
                const fileUrl = pathToFileURL(filePath).href;
                const module = await import(fileUrl);
                
                // Extract schemas from module
                const schemas = extractSchemasFromModule(module);
                
                // Register schemas (but don't resolve yet)
                registry.registerMany(schemas);
            } catch (error) {
                console.warn(`Failed to load schema file ${filePath}:`, error instanceof Error ? error.message : String(error));
            }
        }

        // Resolve dependencies and register all schemas
        registry.resolveAndRegister();
        
        const registeredCount = registry.getRegisteredIds().length;
        if (registeredCount > 0) {
            console.log(`✅ Registered ${registeredCount} schemas automatically`);
        }
    } catch (error) {
        console.error('Error during automatic schema registration:', error);
        // Don't throw - allow app to continue
    }
}


import { FastifyInstance } from 'fastify';
import { TSchema, Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { find } from 'fsesm';
import { pathToFileURL } from 'url';
import path from 'path';

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

export class SchemaRegistry {
    private registeredIds = new Set<string>();
    private schemaMap = new Map<string, TSchema>();
    // Lazy container for schemas - stored here before registration in Fastify
    private pendingSchemas = new Map<string, TSchema>();
    // Flag indicating whether initial flush has been done
    private flushed = false;
    public readonly fastify: FastifyInstance;
    private readonly options: SchemaRegistryOptions;
    private originalAddSchema?: (schema: unknown) => FastifyInstance;

    constructor(fastify: FastifyInstance, options: SchemaRegistryOptions = {}) {
        this.fastify = fastify;
        this.options = {
            logDuplicateSchemas: false,
            ...options
        };
        // Override fastify.addSchema to use our addSchema method
        this.overrideFastifyAddSchema();
    }

    /**
     * Override fastify.addSchema to use our addSchema method
     * This ensures all schema registration goes through our unified controller
     */
    private overrideFastifyAddSchema(): void {
        // Store original method
        this.originalAddSchema = this.fastify.addSchema.bind(this.fastify);
        
        // Override with our method (must return FastifyInstance)
        this.fastify.addSchema = (schema: unknown) => {
            this.addSchema(schema as TSchema);
            return this.fastify;
        };
    }

    /**
     * Restore original fastify.addSchema (useful for testing)
     */
    public restoreFastifyAddSchema(): void {
        if (this.originalAddSchema) {
            this.fastify.addSchema = this.originalAddSchema;
        }
    }

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
    public addSchema<T extends TSchema>(schema: T): T & { $id: string } {
        // Require $id
        if (!schema || !schema.$id || typeof schema.$id !== 'string') {
            throw new Error(
                'Schema must have $id property. ' +
                'Use Type.Object({...}, { $id: "SchemaName" }) or addSchema(Type.Object({...}, { $id: "SchemaName" }))'
            );
        }

        const schemaId = schema.$id;

        // Check if already registered in our registry
        if (this.registeredIds.has(schemaId)) {
            // Already registered - safe to skip (idempotent)
            // Return existing schema if available, otherwise return passed schema
            const existingSchema = this.schemaMap.get(schemaId) || this.fastify.getSchema(schemaId);
            return (existingSchema || schema) as T & { $id: string };
        }

        // Check if already registered in Fastify
        try {
            const existingSchema = this.fastify.getSchema(schemaId);
            if (existingSchema) {
                // Already registered in Fastify - safe to skip (idempotent)
                this.registeredIds.add(schemaId);
                return existingSchema as T & { $id: string };
            }
        } catch (error) {
            // Fastify might not be ready yet - continue
        }

        // Store schema in map for reference
        this.schemaMap.set(schemaId, schema);

        // If already flushed, register immediately in Fastify
        if (this.flushed) {
            // Register the schema immediately
            // Fastify will throw an error if referenced schemas are not registered
            this.registerInFastify(schema);
            this.registeredIds.add(schemaId);
        } else {
            // Not flushed yet - store in pending schemas for later batch registration
            this.pendingSchemas.set(schemaId, schema);
        }

        return schema as T & { $id: string };
    }

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
    public refSchema<T extends TSchema>(schemaId: string): T & { $id: string } {
        if (!schemaId || typeof schemaId !== 'string') {
            throw new Error(
                `refSchema() requires a string schema ID. ` +
                `Received: ${typeof schemaId}. ` +
                `Example: refSchema<typeof MySchema>('MySchema')`
            );
        }
        return Type.Ref(schemaId) as unknown as T & { $id: string };
    }

    /**
     * Flush all pending schemas to Fastify
     * Registers all schemas from lazy container in order they were added
     * After flush, all new schemas will be registered immediately
     * 
     * NOTE: Schemas must be registered in correct dependency order.
     * If a schema references another schema via Type.Ref(), the referenced
     * schema must be registered first. Fastify will throw an error otherwise.
     */
    public flushSchemas(): void {
        // Mark as flushed - after this, schemas will be registered immediately
        this.flushed = true;

        if (this.pendingSchemas.size === 0) {
            return;
        }

        // Register all pending schemas in order they were added
        // Fastify will throw an error if referenced schemas are not registered
        for (const schema of this.pendingSchemas.values()) {
            if (!schema.$id) continue;
            
            const schemaId = schema.$id;
            if (!this.registeredIds.has(schemaId)) {
                try {
                    this.registerInFastify(schema);
                    this.registeredIds.add(schemaId);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    // Provide helpful error message about dependency order
                    if (errorMessage.includes('not found') || errorMessage.includes('reference')) {
                        console.error(
                            `❌ Failed to register schema "${schemaId}": ${errorMessage}\n` +
                            `   Make sure all referenced schemas are registered before this schema.\n` +
                            `   Example: If SchemaA uses Type.Ref('SchemaB'), register SchemaB first.`
                        );
                    }
                    throw error;
                }
            }
        }

        // Clear pending schemas after registration
        this.pendingSchemas.clear();
    }


    /**
     * Check if schema is a response wrapper (has structure { status: Literal, data: T })
     * Response wrappers are generated automatically and should be excluded from duplicate detection
     */
    private isResponseWrapper(schema: TSchema): boolean {
        if (!schema || typeof schema !== 'object') {
            return false;
        }
        
        // Check if schema has properties matching response wrapper pattern
        const props = (schema as any).properties;
        if (!props || typeof props !== 'object') {
            return false;
        }
        
        // Response wrapper has: { status: Literal(number), data: T }
        const hasStatus = props.status && 
            ((props.status as any).const !== undefined || (props.status as any).enum !== undefined);
        const hasData = props.data !== undefined;
        
        return hasStatus && hasData;
    }

    /**
     * Check if schema is a Prisma-generated schema
     * Prisma-generated schemas follow similar patterns but have different fields, so they shouldn't be flagged as duplicates
     */
    private isPrismaGeneratedSchema(schema: TSchema): boolean {
        if (!schema || typeof schema !== 'object') {
            return false;
        }
        
        const schemaId = (schema as any).$id;
        if (!schemaId || typeof schemaId !== 'string') {
            return false;
        }
        
        // Prisma-generated schemas are in @generated/typebox-schemas/models/
        // They typically have names like OutputUserSchema, InputUserSchema, etc.
        // Check if schema comes from generated folder by checking if it's imported from @generated
        // We can't check the import path directly, but we can check the naming pattern
        // Prisma schemas follow strict naming: Output{Model}Schema, Input{Model}Schema
        
        // Check if it matches Prisma schema naming pattern and is likely generated
        // This is a heuristic - if schema has standard Prisma fields (id, createdAt, updatedAt, deletedAt)
        // and follows the naming pattern, it's likely Prisma-generated
        const props = (schema as any).properties;
        if (props && typeof props === 'object') {
            const hasPrismaFields = 
                (props.id !== undefined) &&
                (props.createdAt !== undefined || props.updatedAt !== undefined);
            
            // Prisma Output schemas typically have optional fields
            const hasOptionalFields = Object.keys(props).length > 0;
            
            if (hasPrismaFields && hasOptionalFields) {
                // Additional check: if schema ID matches Prisma pattern
                const isOutputSchema = schemaId.startsWith('Output') && schemaId.endsWith('Schema');
                const isInputSchema = schemaId.startsWith('Input') && schemaId.endsWith('Schema');
                
                if (isOutputSchema || isInputSchema) {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * Check for duplicate schemas by structure (not just by name)
     * Returns array of duplicate schema IDs if found
     * Checks both in-memory registry and Fastify instance
     * Excludes response wrappers from duplicate detection (they all have same structure by design)
     */
    private findDuplicateSchemas(newSchema: TSchema): string[] {
        const duplicates: string[] = [];
        
        // Skip duplicate detection for response wrappers - they all have same structure by design
        if (this.isResponseWrapper(newSchema)) {
            return duplicates;
        }
        
        // Skip duplicate detection for Prisma-generated schemas - they follow similar patterns but have different fields
        const isNewSchemaPrisma = this.isPrismaGeneratedSchema(newSchema);
        
        // Check schemas in memory registry
        for (const [existingId, existingSchema] of this.schemaMap.entries()) {
            // Skip if it's the same schema by reference
            if (existingSchema === newSchema) {
                continue;
            }
            
            // Skip response wrappers
            if (this.isResponseWrapper(existingSchema)) {
                continue;
            }
            
            // Skip Prisma-generated schemas from comparison
            // Only compare Prisma schemas with non-Prisma schemas, not Prisma with Prisma
            const isExistingSchemaPrisma = this.isPrismaGeneratedSchema(existingSchema);
            if (isNewSchemaPrisma && isExistingSchemaPrisma) {
                // Both are Prisma-generated - skip comparison (they're expected to have similar patterns)
                continue;
            }
            
            // Check structural equivalence
            if (areSchemasStructurallyEquivalent(existingSchema, newSchema)) {
                duplicates.push(existingId);
            }
        }
        
        // Also check schemas already registered in Fastify
        try {
            const fastifySchemas = this.fastify.getSchemas();
            if (fastifySchemas) {
                for (const [existingId, existingSchema] of Object.entries(fastifySchemas)) {
                    // Skip if already found in memory registry
                    if (duplicates.includes(existingId)) {
                        continue;
                    }
                    
                    // Skip if it's the same schema by reference
                    if (existingSchema === newSchema) {
                        continue;
                    }
                    
                    // Skip response wrappers
                    if (this.isResponseWrapper(existingSchema as TSchema)) {
                        continue;
                    }
                    
                    // Skip Prisma-generated schemas from comparison
                    const isExistingSchemaPrisma = this.isPrismaGeneratedSchema(existingSchema as TSchema);
                    if (isNewSchemaPrisma && isExistingSchemaPrisma) {
                        // Both are Prisma-generated - skip comparison
                        continue;
                    }
                    
                    // Check structural equivalence
                    if (areSchemasStructurallyEquivalent(existingSchema as TSchema, newSchema)) {
                        duplicates.push(existingId);
                    }
                }
            }
        } catch (error) {
            // Fastify might not have getSchemas() method in older versions
            // Ignore and continue
        }
        
        return duplicates;
    }

    /**
     * Register a schema with duplicate detection
     * NOTE: Dependencies must be registered before schemas that reference them.
     */
    public register(schema: TSchema): void {
        if (!schema || !schema.$id) {
            return;
        }

        const schemaId = schema.$id;
        
        // Skip if already registered with same ID
        if (this.registeredIds.has(schemaId)) {
            return;
        }

        // Check for structural duplicates ONLY if option is enabled (performance optimization)
        // This is expensive O(n²) operation, so skip by default
        if (this.options.logDuplicateSchemas) {
            const duplicates = this.findDuplicateSchemas(schema);
            if (duplicates.length > 0) {
                const duplicateList = duplicates.join(', ');
                console.warn(
                    `⚠️  Duplicate schema structure detected!\n` +
                    `   Schema "${schemaId}" has the same structure as: ${duplicateList}\n` +
                    `   Recommendation: Consider merging these schemas into a single shared schema.\n` +
                    `   Example: Create a common schema in src/api/shared/ and reuse it.\n` +
                    `   This will reduce code duplication and improve maintainability.`
                );
            }
        }

        // Store schema
        this.schemaMap.set(schemaId, schema);
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
     * Register all schemas from schemaMap in Fastify
     * NOTE: Schemas must be registered in correct dependency order.
     * Fastify will throw an error if referenced schemas are not registered.
     */
    public resolveAndRegister(): void {
        for (const schema of this.schemaMap.values()) {
            if (!schema.$id) continue;
            
            const schemaId = schema.$id;
            if (!this.registeredIds.has(schemaId)) {
                try {
                    this.registerInFastify(schema);
                    this.registeredIds.add(schemaId);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    // Provide helpful error message about dependency order
                    if (errorMessage.includes('not found') || errorMessage.includes('reference')) {
                        console.error(
                            `❌ Failed to register schema "${schemaId}": ${errorMessage}\n` +
                            `   Make sure all referenced schemas are registered before this schema.\n` +
                            `   Example: If SchemaA uses Type.Ref('SchemaB'), register SchemaB first.`
                        );
                    }
                    throw error;
                }
            }
        }
    }

    /**
     * Register schema in Fastify instance
     * Uses original Fastify method to avoid infinite recursion
     * Optimized: removed expensive structural comparison for performance
     */
    private registerInFastify(schema: TSchema): void {
        if (!schema.$id) {
            return;
        }

        const schemaId = schema.$id;
        
        // Check if already registered in Fastify
        const existingSchema = this.fastify.getSchema(schemaId);
        if (existingSchema) {
            // Fast check: if same reference, skip
            // If different reference but same $id, Fastify will handle it
            // Removed expensive structural comparison for performance
            this.registeredIds.add(schemaId);
            return;
        }

        try {
            // Use original Fastify method to avoid infinite recursion
            // (fastify.addSchema is overridden to call this.addSchema, which would cause recursion)
            if (this.originalAddSchema) {
                this.originalAddSchema(schema);
            } else {
                // Fallback: call Fastify's internal method directly
                this.fastify.addSchema(schema);
            }
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
     * Get schema by ID from registry (checks both pending and registered schemas)
     */
    public getSchema(schemaId: string): TSchema | undefined {
        return this.pendingSchemas.get(schemaId) || this.schemaMap.get(schemaId);
    }

    /**
     * Get count of pending schemas (not yet flushed to Fastify)
     */
    public getPendingCount(): number {
        return this.pendingSchemas.size;
    }

    /**
     * Check if schemas have been flushed
     */
    public isFlushed(): boolean {
        return this.flushed;
    }

    /**
     * Clear registry (useful for testing)
     */
    public clear(): void {
        this.registeredIds.clear();
        this.schemaMap.clear();
        this.pendingSchemas.clear();
        this.flushed = false;
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
 * Extract schema prefix from schema ID (Query, Input, Output, etc.)
 */
function getSchemaPrefix(schemaId: string): string | null {
    const prefixes = ['Query', 'Input', 'Output', 'Params', 'Headers'];
    for (const prefix of prefixes) {
        if (schemaId.startsWith(prefix)) {
            return prefix;
        }
    }
    return null;
}

/**
 * Deep comparison of schemas ignoring metadata fields
 * Compares structure, types, field names, and constraints but ignores $id, description, and other metadata
 * Similar to NestJS duplicate DTO detection, but more strict - compares field names too
 */
function areSchemasStructurallyEquivalent(schema1: TSchema, schema2: TSchema, visited: Set<TSchema> = new Set()): boolean {
    // Prevent infinite recursion
    if (visited.has(schema1) || visited.has(schema2)) {
        return schema1 === schema2;
    }
    visited.add(schema1);
    visited.add(schema2);

    // Quick check: if schemas have different prefixes (Query vs Input vs Output), they're likely not duplicates
    const schema1Id = (schema1 as any).$id;
    const schema2Id = (schema2 as any).$id;
    if (schema1Id && schema2Id) {
        const prefix1 = getSchemaPrefix(schema1Id);
        const prefix2 = getSchemaPrefix(schema2Id);
        if (prefix1 && prefix2 && prefix1 !== prefix2) {
            // Different prefixes - likely not duplicates (e.g., QueryEntityLogsSchema vs OutputEntityLogSchema)
            return false;
        }
    }

    // Quick check: if both are Object schemas, compare property names first
    // This is a fast way to reject non-duplicates early
    const props1 = (schema1 as any).properties;
    const props2 = (schema2 as any).properties;
    if (props1 && props2 && typeof props1 === 'object' && typeof props2 === 'object') {
        const keys1 = Object.keys(props1).sort();
        const keys2 = Object.keys(props2).sort();
        
        // If property names don't match, they're definitely not duplicates
        if (keys1.length !== keys2.length || keys1.join(',') !== keys2.join(',')) {
            return false;
        }
    } else if ((props1 && !props2) || (!props1 && props2)) {
        // One has properties, the other doesn't - not duplicates
        return false;
    }

    // Normalize schemas by removing metadata fields but preserving field names and structure
    const normalize = (schema: any, depth: number = 0): any => {
        // Prevent deep recursion
        if (depth > 10) {
            return schema;
        }

        if (!schema || typeof schema !== 'object') {
            return schema;
        }

        // Handle Type.Ref() - preserve the full reference path
        // This is critical: different $ref values mean different schemas, even if structure is similar
        if (typeof (schema as any).$ref === 'string') {
            return { 
                $ref: (schema as any).$ref,
                // Also preserve any additional type information if present
                ...(schema.type ? { type: schema.type } : {}),
                ...(schema.anyOf ? { anyOf: schema.anyOf } : {}),
                ...(schema.oneOf ? { oneOf: schema.oneOf } : {})
            };
        }

        // For Object schemas, preserve property names and their types
        if (schema.properties && typeof schema.properties === 'object') {
            const normalized: any = {
                type: schema.type || 'object',
                properties: {},
                required: schema.required || []
            };
            
            // Sort property names for consistent comparison
            const propNames = Object.keys(schema.properties).sort();
            
            for (const propName of propNames) {
                const propSchema = schema.properties[propName];
                // Normalize property schema recursively
                const normalizedProp = normalize(propSchema, depth + 1);
                
                // For $ref, preserve the full reference path to distinguish different references
                // This ensures that schemas referencing different types are not considered duplicates
                if (normalizedProp && typeof normalizedProp === 'object' && normalizedProp.$ref) {
                    normalized.properties[propName] = normalizedProp;
                } else {
                    normalized.properties[propName] = normalizedProp;
                }
            }
            
            // Sort required array for consistent comparison
            if (normalized.required) {
                normalized.required = [...normalized.required].sort();
            }
            
            // Include additionalProperties if present
            if ('additionalProperties' in schema) {
                normalized.additionalProperties = schema.additionalProperties;
            }
            
            return normalized;
        }
        
        // For Array schemas
        if (schema.items) {
            return {
                type: schema.type || 'array',
                items: normalize(schema.items, depth + 1)
            };
        }
        
        // For Union schemas
        if (schema.anyOf || schema.oneOf) {
            const unionKey = schema.anyOf ? 'anyOf' : 'oneOf';
            return {
                type: schema.type,
                [unionKey]: schema[unionKey].map((item: any) => normalize(item, depth + 1))
            };
        }
        
        // Create a copy without metadata fields for other schema types
        const normalized: any = {};
        const keys: string[] = [];
        
        for (const key in schema) {
            // Skip metadata fields that don't affect structure
            if (key === '$id' || 
                key === 'description' || 
                key === 'title' || 
                key === 'examples' || 
                key === 'default' ||
                key === '$comment' ||
                key.startsWith('$') && key !== '$ref' && key !== '$schema') {
                continue;
            }
            
            keys.push(key);
        }
        
        // Sort keys for consistent comparison
        keys.sort();
        
        for (const key of keys) {
            const value = schema[key];
            
            // Handle arrays
            if (Array.isArray(value)) {
                normalized[key] = value.map(item => 
                    item && typeof item === 'object' ? normalize(item, depth + 1) : item
                );
                continue;
            }
            
            // Handle objects recursively
            if (value && typeof value === 'object') {
                normalized[key] = normalize(value, depth + 1);
                continue;
            }
            
            // Copy primitive values
            normalized[key] = value;
        }
        
        return normalized;
    };

    try {
        const normalized1 = normalize(schema1);
        const normalized2 = normalize(schema2);
        
        // Compare normalized schemas using JSON stringification
        // This will compare both structure AND field names
        const compare = (obj1: any, obj2: any): boolean => {
            try {
                const str1 = JSON.stringify(obj1, Object.keys(obj1 || {}).sort());
                const str2 = JSON.stringify(obj2, Object.keys(obj2 || {}).sort());
                return str1 === str2;
            } catch {
                return false;
            }
        };
        
        return compare(normalized1, normalized2);
    } catch {
        return false;
    }
}

/**
 * Check if two schemas are equivalent (legacy function for backward compatibility)
 */
function areSchemasEquivalent(schema1: TSchema, schema2: TSchema): boolean {
    return areSchemasStructurallyEquivalent(schema1, schema2);
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
 * Queue for schemas registered before registry initialization
 */
const pendingSchemas: TSchema[] = [];

/**
 * Get or create global schema registry
 */
export function getSchemaRegistry(fastify?: FastifyInstance, options?: SchemaRegistryOptions): SchemaRegistry {
    if (!globalRegistry && fastify) {
        globalRegistry = new SchemaRegistry(fastify, options);
        // Register all pending schemas
        if (pendingSchemas.length > 0) {
            console.log(`📦 Registering ${pendingSchemas.length} early-loaded schema(s)...`);
            for (const schema of pendingSchemas) {
                try {
                    globalRegistry.addSchema(schema);
                    console.log(`  ✅ Registered: ${schema.$id}`);
                } catch (err: any) {
                    console.warn(`  ⚠️ Failed to register early schema ${schema.$id}:`, err.message);
                }
            }
            pendingSchemas.length = 0; // Clear queue
        }
    }
    if (!globalRegistry) {
        throw new Error('Schema registry not initialized. Call initializeSchemaRegistry() first.');
    }
    return globalRegistry;
}

/**
 * Initialize global schema registry
 */
export function initializeSchemaRegistry(fastify: FastifyInstance, options?: SchemaRegistryOptions): SchemaRegistry {
    globalRegistry = new SchemaRegistry(fastify, options);
    // Register all pending schemas
    if (pendingSchemas.length > 0) {
        console.log(`📦 Registering ${pendingSchemas.length} early-loaded schema(s)...`);
        for (const schema of pendingSchemas) {
            try {
                globalRegistry.addSchema(schema);
                console.log(`  ✅ Registered: ${schema.$id}`);
            } catch (err: any) {
                console.warn(`  ⚠️ Failed to register early schema ${schema.$id}:`, err.message);
            }
        }
        pendingSchemas.length = 0; // Clear queue
    }
    return globalRegistry;
}

/**
 * Clear global schema registry
 */
export function clearSchemaRegistry(): void {
    globalRegistry = null;
}

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
export function addSchema<T extends TSchema>(schema: T): T & { $id: string } {
    try {
        const registry = getSchemaRegistry();
        return registry.addSchema(schema);
    } catch (error) {
        // Registry not initialized - queue schema for later registration
        if (error instanceof Error && error.message.includes('not initialized')) {
            // Validate schema has $id
            if (!schema.$id || typeof schema.$id !== 'string') {
                throw new Error(
                    'Schema must have $id property. ' +
                    'Received schema: ' + JSON.stringify(schema, null, 2)
                );
            }
            // Add to pending queue
            pendingSchemas.push(schema);
            // Log for transparency (only in development)
            if (process.env.NODE_ENV !== 'production') {
                console.log(`⏳ Schema '${schema.$id}' queued for registration (registry not yet initialized)`);
            }
            // Return schema as-is (will be registered when registry initializes)
            return schema as T & { $id: string };
        }
        throw error;
    }
}

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
export function refSchema<T extends TSchema>(schemaId: string): T & { $id: string } {
    if (!schemaId || typeof schemaId !== 'string') {
        throw new Error(
            `refSchema() requires a string schema ID. ` +
            `Received: ${typeof schemaId}. ` +
            `Example: refSchema<typeof MySchema>('MySchema')`
        );
    }
    return Type.Ref(schemaId) as unknown as T & { $id: string };
}

/**
 * Flush all pending schemas to Fastify
 * Should be called before server starts to register all schemas
 */
export function flushSchemas(): void {
    try {
        const registry = getSchemaRegistry();
        registry.flushSchemas();
    } catch (error) {
        // Registry not initialized - that's okay, nothing to flush
        if (error instanceof Error && error.message.includes('not initialized')) {
            return;
        }
        throw error;
    }
}

/**
 * Automatically scan and register all schemas from .schemas.ts files
 * This should be called before loading route modules
 */
export async function autoRegisterSchemas(fastify: FastifyInstance, apiDir: string, options?: SchemaRegistryOptions): Promise<void> {
    // Get or initialize registry (may already be initialized)
    let registry: SchemaRegistry;
    try {
        registry = getSchemaRegistry(fastify, options);
    } catch {
        registry = initializeSchemaRegistry(fastify, options);
    }
    
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

        // Load all schema files in parallel for better performance
        const loadPromises = allSchemaFiles.map(async (filePath) => {
            try {
                const fileUrl = pathToFileURL(filePath).href;
                const module = await import(fileUrl);
                
                // Extract schemas from module
                const schemas = extractSchemasFromModule(module);
                
                return schemas;
            } catch (error) {
                console.warn(`Failed to load schema file ${filePath}:`, error instanceof Error ? error.message : String(error));
                return [];
            }
        });

        // Wait for all files to load in parallel
        const allSchemasArrays = await Promise.all(loadPromises);
        
        // Flatten and register all schemas
        const allSchemas = allSchemasArrays.flat();
        for (const schema of allSchemas) {
            registry.addSchema(schema);
        }
        
        const pendingCount = registry.getPendingCount();
        if (pendingCount > 0) {
            console.log(`✅ Added ${pendingCount} schemas to lazy container (will be flushed before server starts)`);
        }
    } catch (error) {
        console.error('Error during automatic schema registration:', error);
        // Don't throw - allow app to continue
    }
}


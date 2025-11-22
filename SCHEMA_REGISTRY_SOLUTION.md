# Schema Registry Solution

## Problem Analysis

The original issue was that TypeBox schemas with `$id` needed manual registration via `fastify.addSchema()`, and when using `Type.Ref()` for nested schemas, the referenced schemas had to be registered first. This led to:

1. **Manual registration errors** - developers forgetting to register schemas
2. **Dependency order issues** - schemas using `Type.Ref()` failing if dependencies weren't registered
3. **Inconsistent patterns** - different approaches across the codebase
4. **Swagger duplication** - direct schema embedding causing duplicate definitions

## Solution Architecture

### 1. Schema Registry (`schema-registry.ts`)

A centralized registry that:
- **Discovers** all schemas with `$id` from `.schemas.ts` files
- **Analyzes** dependencies via `Type.Ref()` references
- **Sorts** schemas topologically (dependencies first)
- **Registers** all schemas in correct order

### 2. Automatic Registration Flow

```
App Initialization
    ↓
Scan **/*.schemas.ts files
    ↓
Extract schemas with $id
    ↓
Build dependency graph (Type.Ref() analysis)
    ↓
Topological sort (dependencies first)
    ↓
Register all schemas in Fastify
    ↓
Routes can use schemas without manual registration
```

### 3. Integration Points

1. **App Initialization** (`index.ts`)
   - Calls `autoRegisterSchemas()` before loading routes
   - Ensures all schemas are available when routes are defined

2. **Route Builder** (`route.ts`)
   - `withRef()` method checks registry first
   - Falls back to direct registration if needed
   - Prevents duplicate registration

3. **Helper Function** (`schema-registry.ts`)
   - `registerSchema()` for manual registration (if needed)
   - `getSchemaRegistry()` for advanced usage

## Key Features

### ✅ Automatic Discovery
- Scans all `.schemas.ts` files automatically
- No configuration needed
- Works with generated Prisma schemas

### ✅ Dependency Resolution
- Analyzes `Type.Ref()` references
- Builds dependency graph
- Registers in correct order

### ✅ Duplicate Prevention
- Tracks registered schemas
- Prevents duplicate registration
- Handles edge cases gracefully

### ✅ Backward Compatible
- Works with existing code
- Manual registration still works
- No breaking changes

## Usage Pattern

### Before (Manual)
```typescript
// project.schemas.ts
const context = getContext();
export const MySchema = Type.Object({...}, { $id: 'MySchema' });
context.fastify.addSchema(MySchema); // ❌ Manual registration
```

### After (Automatic)
```typescript
// project.schemas.ts
export const MySchema = Type.Object({...}, { $id: 'MySchema' });
// ✅ No manual registration needed!
```

### Using Type.Ref()
```typescript
// ✅ CORRECT - Use Type.Ref() for nested schemas
export const ListSchema = Type.Object({
  items: Type.Array(Type.Ref('ItemSchema'))
}, {
  $id: 'ListSchema'
});

// ❌ INCORRECT - Direct embedding causes duplicates
export const ListSchema = Type.Object({
  items: Type.Array(ItemSchema) // Don't do this!
}, {
  $id: 'ListSchema'
});
```

## Implementation Details

### Dependency Extraction

The system recursively analyzes schema structures to find `Type.Ref()` calls:

```typescript
private extractDependencies(schema: TSchema): Set<string> {
  // Finds all $ref properties (Type.Ref() creates these)
  // Recursively checks nested objects and arrays
  // Returns set of referenced schema IDs
}
```

### Topological Sort

Uses topological sorting to ensure dependencies are registered first:

```typescript
private topologicalSort(schemaIds: string[]): string[] {
  // Visits dependencies first
  // Handles circular dependencies gracefully
  // Returns ordered list of schema IDs
}
```

### Registration Flow

1. **Discovery Phase**: Scan files and extract schemas
2. **Analysis Phase**: Build dependency graph
3. **Sorting Phase**: Topological sort
4. **Registration Phase**: Register in Fastify

## Benefits

1. **Developer Experience**
   - No manual registration needed
   - Clear error messages
   - Type-safe throughout

2. **Code Quality**
   - Consistent pattern across codebase
   - Reduced boilerplate
   - Fewer bugs

3. **Maintainability**
   - Centralized schema management
   - Easy to debug
   - Clear dependency relationships

4. **Swagger Quality**
   - Clean OpenAPI definitions
   - No duplicate schemas
   - Proper references

## Migration Steps

1. **Remove manual registration**
   ```typescript
   // Remove this:
   const context = getContext();
   context.fastify.addSchema(MySchema);
   ```

2. **Use Type.Ref() for nested schemas**
   ```typescript
   // Change this:
   items: Type.Array(ItemSchema)
   
   // To this:
   items: Type.Array(Type.Ref('ItemSchema'))
   ```

3. **Ensure $id is set**
   ```typescript
   // Make sure all schemas have $id:
   export const MySchema = Type.Object({...}, {
     $id: 'MySchema' // ✅ Required
   });
   ```

## Testing

The system has been tested with:
- ✅ Simple schemas
- ✅ Nested schemas with Type.Ref()
- ✅ Circular dependencies
- ✅ Generated Prisma schemas
- ✅ Complex composite schemas

## Performance

- **Discovery**: O(n) where n = number of schema files
- **Dependency Analysis**: O(n*m) where m = average dependencies per schema
- **Registration**: O(n) - single pass after sorting
- **Runtime**: Zero overhead after initialization

## Future Enhancements

Potential improvements:
1. Schema validation before registration
2. Better error messages for missing dependencies
3. Schema versioning support
4. Hot-reload support for development

## Conclusion

The schema registry system provides a robust, automatic solution for TypeBox schema management. It eliminates manual registration, ensures proper dependency ordering, and produces clean Swagger documentation.

**Key Takeaway**: Define schemas with `$id`, use `Type.Ref()` for references, and let the system handle the rest!


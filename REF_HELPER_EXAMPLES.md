# Schema Reference Examples: Type.Ref() and refSchema()

## Overview

When creating schema references, you have two options:
- ✅ **`Type.Ref('SchemaId')`** - Use string ID directly (recommended)
- ✅ **`refSchema<typeof Schema>('SchemaId')`** - Type-safe wrapper with generic type

Both create `Type.Ref()` references. The choice depends on your preference for type safety.

## ⚠️ Important: Order of Registration

**Base schemas MUST be registered BEFORE dependent schemas!**

```typescript
// ✅ CORRECT ORDER
export const ItemSchema = addSchema(...); // Register first
export const ListSchema = addSchema(...); // Register after, uses Type.Ref('ItemSchema')
```

## Basic Usage

### Option 1: Using Type.Ref() (Recommended)

```typescript
import { addSchema, Type } from '@tsdiapi/server';

// ✅ STEP 1: Register base schema FIRST
export const ItemSchema = addSchema(
  Type.Object({
    id: Type.String(),
    name: Type.String()
  }, { $id: 'ItemSchema' })
);

// ✅ STEP 2: Register dependent schema AFTER
export const ListSchema = addSchema(
  Type.Object({
    items: Type.Array(Type.Ref('ItemSchema')) // ✅ Use Type.Ref() with string ID
  }, { $id: 'ListSchema' })
);
```

### Option 2: Using refSchema()

```typescript
import { addSchema, refSchema, Type } from '@tsdiapi/server';

// ✅ STEP 1: Register base schema FIRST
export const ItemSchema = addSchema(
  Type.Object({
    id: Type.String(),
    name: Type.String()
  }, { $id: 'ItemSchema' })
);

// ✅ STEP 2: Register dependent schema AFTER
export const ListSchema = addSchema(
  Type.Object({
    items: Type.Array(refSchema<typeof ItemSchema>('ItemSchema')) // ✅ Use refSchema() with generic type
  }, { $id: 'ListSchema' })
);
```

## Benefits

### 1. Type Safety with refSchema()

```typescript
// ✅ refSchema() provides type safety
import { refSchema } from '@tsdiapi/server';

// TypeScript validates the schema exists
const ref = refSchema<typeof ItemSchema>('ItemSchema'); // ✅ Type-safe

// ❌ Type.Ref() doesn't validate at compile time
const ref = Type.Ref('ItemSchema'); // No compile-time validation
```

### 2. IDE Autocomplete

```typescript
// ✅ IDE can autocomplete schema names when using refSchema()
refSchema<typeof Item... // IDE suggests: ItemSchema, ItemListSchema, etc.

// ❌ Type.Ref() requires manual typing
Type.Ref('Item... // No autocomplete
```

### 3. Refactoring Safety

```typescript
// If you rename ItemSchema to ItemItemSchema:
// ✅ refSchema() - TypeScript error if schema doesn't exist
refSchema<typeof ItemSchema>('ItemSchema'); // Compile error

// ❌ Type.Ref() - No error, breaks at runtime
Type.Ref('ItemSchema'); // No compile error, breaks at runtime
```

## Real-World Examples

### Example 1: Nested Schemas

```typescript
import { addSchema, Type } from '@tsdiapi/server';
import { OutputProjectSchema } from '@generated/typebox-schemas/models/index.js';

// ✅ STEP 1: Register base schema FIRST
export const OutputProjectTeamMemberItemSchema = addSchema(
  Type.Object({
    userId: Type.String(),
    email: Type.String(),
    role: Type.String()
  }, {
    $id: 'OutputProjectTeamMemberItemSchema'
  })
);

// ✅ STEP 2: Register dependent schema AFTER
export const OutputProjectTeamSchema = addSchema(
  Type.Object({
    members: Type.Array(Type.Ref('OutputProjectTeamMemberItemSchema')) // ✅ Use Type.Ref()
  }, {
    $id: 'OutputProjectTeamSchema'
  })
);

// ✅ STEP 3: Register complex nested schema AFTER dependencies
export const OutputProjectWithTeamSchema = addSchema(
  Type.Object({
    project: Type.Ref('OutputProjectSchema'), // From generated schemas
    team: Type.Ref('OutputProjectTeamSchema')
  }, {
    $id: 'OutputProjectWithTeamSchema'
  })
);
```

### Example 2: Generated Schemas

```typescript
import { addSchema, Type } from '@tsdiapi/server';
import { 
  OutputUserSchema, 
  OutputProjectSchema,
  OutputAssetSchema 
} from '@generated/typebox-schemas/models/index.js';

// ✅ Register generated schemas first
export const OutputUserSchemaRegistered = addSchema(OutputUserSchema);
export const OutputProjectSchemaRegistered = addSchema(OutputProjectSchema);
export const OutputAssetSchemaRegistered = addSchema(OutputAssetSchema);

// ✅ Register dependent schema after
export const OutputUserDashboardSchema = addSchema(
  Type.Object({
    user: Type.Ref('OutputUserSchema'),
    projects: Type.Array(Type.Ref('OutputProjectSchema')),
    avatar: Type.Ref('OutputAssetSchema')
  }, {
    $id: 'OutputUserDashboardSchema'
  })
);
```

### Example 3: Custom Schemas with refSchema()

```typescript
import { addSchema, refSchema, Type } from '@tsdiapi/server';

// ✅ STEP 1: Register base schema FIRST
export const OutputFileMetadataSchema = addSchema(
  Type.Object({
    filename: Type.String(),
    size: Type.Number(),
    mimeType: Type.String()
  }, {
    $id: 'OutputFileMetadataSchema'
  })
);

// ✅ STEP 2: Register dependent schema AFTER (using refSchema())
export const OutputFileWithMetadataSchema = addSchema(
  Type.Object({
    url: Type.String(),
    metadata: refSchema<typeof OutputFileMetadataSchema>('OutputFileMetadataSchema') // ✅ Use refSchema()
  }, {
    $id: 'OutputFileWithMetadataSchema'
  })
);
```

## Error Handling

### Missing $id Property

```typescript
// ❌ Error at runtime
const schemaWithoutId = Type.Object({ name: Type.String() });
addSchema(schemaWithoutId); // Error: Schema must have $id property

// ✅ Correct
const schemaWithId = addSchema(
  Type.Object({ name: Type.String() }, { $id: 'MySchema' })
);
```

### Wrong Registration Order

```typescript
// ❌ Error - ItemSchema not registered yet
export const ListSchema = addSchema(
  Type.Object({
    items: Type.Array(Type.Ref('ItemSchema')) // Error: Schema "ItemSchema" not found
  }, { $id: 'ListSchema' })
);

// ✅ Fix - Register ItemSchema first
export const ItemSchema = addSchema(
  Type.Object({ id: Type.String() }, { $id: 'ItemSchema' })
);

export const ListSchema = addSchema(
  Type.Object({
    items: Type.Array(Type.Ref('ItemSchema')) // ✅ Works
  }, { $id: 'ListSchema' })
);
```

## Comparison: Type.Ref() vs refSchema()

| Feature | `Type.Ref('id')` | `refSchema<typeof Schema>('id')` |
|---------|------------------|----------------------------------|
| Type safety | ❌ Runtime only | ✅ Compile-time |
| Auto-extract $id | ❌ Manual | ❌ Manual (but type-safe) |
| IDE autocomplete | ❌ No | ✅ Yes |
| Refactoring safe | ❌ No | ✅ Yes |
| Works with imports | ✅ Yes | ✅ Yes |
| Works with strings | ✅ Yes | ✅ Yes |
| Simplicity | ✅ Simple | ⚠️ More verbose |

## When to Use Each

### Use `Type.Ref('SchemaId')` when:
- ✅ You want simplicity
- ✅ You know the schema ID string
- ✅ You're working with generated schemas
- ✅ You don't need compile-time validation

### Use `refSchema<typeof Schema>('SchemaId')` when:
- ✅ You want type safety
- ✅ You have the schema object imported
- ✅ You want IDE autocomplete
- ✅ You want refactoring safety

## Migration Guide

### Step 1: Import refSchema (if using)

```typescript
// Add refSchema to imports
import { addSchema, refSchema, Type } from '@tsdiapi/server';
```

### Step 2: Replace useSchema() calls (if any)

```typescript
// ❌ useSchema() doesn't exist
useSchema(OutputProjectSchema)

// ✅ Use Type.Ref() or refSchema()
Type.Ref('OutputProjectSchema')
// OR
refSchema<typeof OutputProjectSchema>('OutputProjectSchema')
```

### Step 3: Ensure correct registration order

```typescript
// ✅ Register base schema first
export const ItemSchema = addSchema(...);

// ✅ Register dependent schema after
export const ListSchema = addSchema(
  Type.Object({
    items: Type.Array(Type.Ref('ItemSchema'))
  }, { $id: 'ListSchema' })
);
```

## Complete Example

```typescript
// project.schemas.ts
import { addSchema, Type } from '@tsdiapi/server';
import { OutputProjectSchema } from '@generated/typebox-schemas/models/index.js';

// ✅ STEP 1: Register base schemas FIRST
export const OutputProjectTeamMemberItemSchema = addSchema(
  Type.Object({
    userId: Type.String(),
    email: Type.String(),
    role: Type.String()
  }, {
    $id: 'OutputProjectTeamMemberItemSchema'
  })
);

export const OutputProjectFileItemSchema = addSchema(
  Type.Object({
    fileId: Type.String(),
    url: Type.String()
  }, {
    $id: 'OutputProjectFileItemSchema'
  })
);

// ✅ STEP 2: Register dependent schemas AFTER
export const OutputProjectTeamSchema = addSchema(
  Type.Object({
    members: Type.Array(Type.Ref('OutputProjectTeamMemberItemSchema')) // ✅ Use Type.Ref()
  }, {
    $id: 'OutputProjectTeamSchema'
  })
);

export const OutputProjectFilesSchema = addSchema(
  Type.Object({
    files: Type.Array(Type.Ref('OutputProjectFileItemSchema')) // ✅ Use Type.Ref()
  }, {
    $id: 'OutputProjectFilesSchema'
  })
);

// ✅ STEP 3: Register complex nested schema AFTER all dependencies
export const OutputProjectDetailsSchema = addSchema(
  Type.Object({
    project: Type.Ref('OutputProjectSchema'),
    team: Type.Ref('OutputProjectTeamSchema'),
    files: Type.Ref('OutputProjectFilesSchema')
  }, {
    $id: 'OutputProjectDetailsSchema'
  })
);
```

## Summary

- ✅ **Use `Type.Ref('SchemaId')`** for simple, straightforward references
- ✅ **Use `refSchema<typeof Schema>('SchemaId')`** when you need type safety
- ✅ **Register base schemas FIRST** before dependent schemas
- ✅ **Both create `Type.Ref()`** - choose based on your needs
- ✅ **Order matters!** - Dependencies must be registered first

The key is ensuring correct registration order - base schemas before dependent schemas!

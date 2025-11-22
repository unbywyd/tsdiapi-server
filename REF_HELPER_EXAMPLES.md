# useSchema() Helper Function Examples

## Overview

The `useSchema()` helper function is a type-safe wrapper around `Type.useSchema()` that automatically extracts `$id` from schema objects, eliminating the need to manually type schema IDs as strings.

## Basic Usage

### Before (Manual String IDs)

```typescript
import { Type } from '@sinclair/typebox';
import { OutputProjectSchema } from '@generated/typebox-schemas/models/index.js';

export const ListSchema = Type.Object({
  items: Type.Array(Type.useSchema('OutputProjectSchema')) // ❌ Manual string ID
}, {
  $id: 'ListSchema'
});
```

### After (Using useSchema() Helper)

```typescript
import { Type, useSchema } from '@tsdiapi/server';
import { OutputProjectSchema } from '@generated/typebox-schemas/models/index.js';

export const ListSchema = Type.Object({
  items: Type.Array(useSchema(OutputProjectSchema)) // ✅ Auto-extracts $id
}, {
  $id: 'ListSchema'
});
```

## Benefits

### 1. No Manual String IDs

```typescript
// ❌ Before - Easy to mistype
Type.useSchema('OutputProjectSchema') // Typo: 'OutputProjctSchema' won't be caught

// ✅ After - TypeScript validates
useSchema(OutputProjectSchema) // Compile error if schema doesn't exist
```

### 2. IDE Autocomplete

```typescript
// ✅ IDE can autocomplete schema names
useSchema(OutputProject...) // IDE suggests: OutputProjectSchema, OutputProjectFileSchema, etc.
```

### 3. Refactoring Safety

```typescript
// If you rename OutputProjectSchema to OutputProjectItemSchema:
// ❌ Type.useSchema('OutputProjectSchema') - No error, breaks at runtime
// ✅ useSchema(OutputProjectSchema) - TypeScript error, caught at compile time
```

## Real-World Examples

### Example 1: Nested Schemas

```typescript
import { Type, useSchema } from '@tsdiapi/server';
import { OutputProjectSchema } from '@generated/typebox-schemas/models/index.js';

// Base schema
export const OutputProjectTeamMemberItemSchema = Type.Object({
  userId: Type.String(),
  email: Type.String(),
  role: Type.String()
}, {
  $id: "OutputProjectTeamMemberItemSchema"
});

// List schema using useSchema()
export const OutputProjectTeamSchema = Type.Object({
  members: Type.Array(useSchema(OutputProjectTeamMemberItemSchema))
}, {
  $id: "OutputProjectTeamSchema"
});

// Complex nested schema
export const OutputProjectWithTeamSchema = Type.Object({
  project: useSchema(OutputProjectSchema),
  team: useSchema(OutputProjectTeamSchema)
}, {
  $id: "OutputProjectWithTeamSchema"
});
```

### Example 2: Generated Schemas

```typescript
import { Type, useSchema } from '@tsdiapi/server';
import { 
  OutputUserSchema, 
  OutputProjectSchema,
  OutputAssetSchema 
} from '@generated/typebox-schemas/models/index.js';

export const OutputUserDashboardSchema = Type.Object({
  user: useSchema(OutputUserSchema),
  projects: Type.Array(useSchema(OutputProjectSchema)),
  avatar: useSchema(OutputAssetSchema)
}, {
  $id: "OutputUserDashboardSchema"
});
```

### Example 3: Custom Schemas

```typescript
import { Type, useSchema } from '@tsdiapi/server';

// Custom base schema
export const OutputFileMetadataSchema = Type.Object({
  filename: Type.String(),
  size: Type.Number(),
  mimeType: Type.String()
}, {
  $id: "OutputFileMetadataSchema"
});

// Schema using custom base
export const OutputFileWithMetadataSchema = Type.Object({
  url: Type.String(),
  metadata: useSchema(OutputFileMetadataSchema)
}, {
  $id: "OutputFileWithMetadataSchema"
});
```

## Error Handling

### Missing $id Property

```typescript
// ❌ Error at runtime
const schemaWithoutId = Type.Object({ name: Type.String() });
useSchema(schemaWithoutId); // Error: useSchema() requires a schema with $id property

// ✅ Correct
const schemaWithId = Type.Object({ name: Type.String() }, { $id: 'MySchema' });
useSchema(schemaWithId); // Works!
```

### Type Safety

```typescript
// ❌ TypeScript error - schema doesn't exist
useSchema(NonExistentSchema); // Compile error

// ✅ TypeScript validates schema exists
import { OutputProjectSchema } from '@generated/typebox-schemas/models/index.js';
useSchema(OutputProjectSchema); // Works!
```

## Comparison: useSchema() vs Type.useSchema()

| Feature | `useSchema(schema)` | `Type.useSchema('id')` |
|---------|---------------|------------------|
| Type safety | ✅ Compile-time | ❌ Runtime only |
| Auto-extract $id | ✅ Yes | ❌ Manual |
| IDE autocomplete | ✅ Yes | ❌ No |
| Refactoring safe | ✅ Yes | ❌ No |
| Works with imports | ✅ Yes | ✅ Yes |
| Works with strings | ❌ No | ✅ Yes |

## When to Use Each

### Use `useSchema(schema)` when:
- ✅ You have the schema object imported
- ✅ You want type safety and IDE support
- ✅ You're working with generated schemas
- ✅ You want to avoid typos

### Use `Type.useSchema('id')` when:
- ✅ You only know the schema ID string
- ✅ Schema is registered dynamically
- ✅ You're referencing schemas from other modules without imports

## Migration Guide

### Step 1: Import Ref

```typescript
// Add Ref to imports
import { Type, useSchema } from '@tsdiapi/server';
```

### Step 2: Replace Type.useSchema() calls

```typescript
// Before
Type.useSchema('OutputProjectSchema')

// After
useSchema(OutputProjectSchema)
```

### Step 3: Ensure schema is imported

```typescript
// Make sure schema is imported
import { OutputProjectSchema } from '@generated/typebox-schemas/models/index.js';
```

## Complete Example

```typescript
// project.schemas.ts
import { Type, useSchema } from '@tsdiapi/server';
import { OutputProjectSchema } from '@generated/typebox-schemas/models/index.js';

// Base schemas
export const OutputProjectTeamMemberItemSchema = Type.Object({
  userId: Type.String(),
  email: Type.String(),
  role: Type.String()
}, {
  $id: "OutputProjectTeamMemberItemSchema"
});

export const OutputProjectFileItemSchema = Type.Object({
  fileId: Type.String(),
  url: Type.String()
}, {
  $id: "OutputProjectFileItemSchema"
});

// Composite schemas using useSchema()
export const OutputProjectTeamSchema = Type.Object({
  members: Type.Array(useSchema(OutputProjectTeamMemberItemSchema))
}, {
  $id: "OutputProjectTeamSchema"
});

export const OutputProjectFilesSchema = Type.Object({
  files: Type.Array(useSchema(OutputProjectFileItemSchema))
}, {
  $id: "OutputProjectFilesSchema"
});

// Complex nested schema
export const OutputProjectDetailsSchema = Type.Object({
  project: useSchema(OutputProjectSchema),
  team: useSchema(OutputProjectTeamSchema),
  files: useSchema(OutputProjectFilesSchema)
}, {
  $id: "OutputProjectDetailsSchema"
});
```

## Summary

The `useSchema()` helper function:
- ✅ Eliminates manual string IDs
- ✅ Provides type safety
- ✅ Improves developer experience
- ✅ Prevents runtime errors
- ✅ Works seamlessly with the schema registry

Use `useSchema()` whenever you have the schema object available - it's the recommended approach for type-safe schema references!


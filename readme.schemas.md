# Schema Registration System

## Overview

The schema registration system automatically discovers, resolves dependencies, and registers all TypeBox schemas with `$id` properties. This eliminates the need for manual schema registration and ensures proper dependency ordering.

## Key Features

✅ **Explicit Registration** - Use `useSchema()` to register schemas explicitly (default)  
✅ **Dependency Resolution** - Automatically resolves `Type.Ref()` dependencies  
✅ **Topological Sorting** - Registers schemas in correct dependency order  
✅ **Duplicate Prevention** - Prevents duplicate schema registration  
✅ **Legacy Support** - Optional auto-registration for backward compatibility  
✅ **Type Safety** - Full TypeScript support with compile-time validation  

## How It Works

### 1. Explicit Registration (Default - Recommended)

By default, **only explicitly registered schemas** are used. Use `useSchema()` to register schemas:

```typescript
import { useSchema, Type } from '@tsdiapi/server';

// Register schema explicitly
export const MySchema = useSchema(
  Type.Object({ name: Type.String() }),
  'MySchema'
);
```

### 2. Legacy Auto-Registration (Optional)

If you need backward compatibility, you can enable automatic schema scanning:

```typescript
import { createApp } from '@tsdiapi/server';

const app = await createApp({
  legacyAutoSchemaRegistration: true // ⚠️ Legacy mode
});
```

When enabled, the system:
1. Scans all `**/*.schemas.ts` files in your API directory
2. Extracts all exported schemas with `$id` properties
3. Analyzes dependencies (schemas referenced via `Type.Ref()`)
4. Registers schemas in topological order (dependencies first)
5. Makes all schemas available for use in routes

**Note**: Legacy mode is disabled by default. See [LEGACY_AUTO_REGISTRATION.md](./LEGACY_AUTO_REGISTRATION.md) for details.

### 2. Schema Definition Pattern

**✅ RECOMMENDED - Using useSchema() helper (type-safe, auto-extracts $id):**

```typescript
// project.schemas.ts
import { Type, useSchema } from '@tsdiapi/server';
import { OutputProjectSchema } from '@generated/typebox-schemas/models/index.js';

// Base schema (will be auto-registered)
export const OutputProjectTeamMemberItemSchema = Type.Object({
  userId: Type.String(),
  email: Type.String(),
  role: Type.String()
}, {
  $id: "OutputProjectTeamMemberItemSchema"
});

// Composite schema using useSchema() - BEST WAY! ✅
// useSchema() automatically extracts $id from the schema object
export const OutputProjectTeamSchema = Type.Object({
  members: Type.Array(useSchema(OutputProjectTeamMemberItemSchema))
}, {
  $id: "OutputProjectTeamSchema"
});
```

**✅ ALTERNATIVE - Using Type.Ref() with string ID:**

```typescript
// project.schemas.ts
import { Type } from '@sinclair/typebox';
import { OutputProjectSchema } from '@generated/typebox-schemas/models/index.js';

// Base schema (will be auto-registered)
export const OutputProjectTeamMemberItemSchema = Type.Object({
  userId: Type.String(),
  email: Type.String(),
  role: Type.String()
}, {
  $id: "OutputProjectTeamMemberItemSchema"
});

// Composite schema using Type.Ref() - CORRECT!
export const OutputProjectTeamSchema = Type.Object({
  members: Type.Array(Type.Ref('OutputProjectTeamMemberItemSchema'))
}, {
  $id: "OutputProjectTeamSchema"
});
```

**❌ INCORRECT - Direct schema embedding:**

```typescript
// DON'T DO THIS - causes duplicate schema definitions in Swagger
export const OutputProjectTeamSchema = Type.Object({
  members: Type.Array(OutputProjectTeamMemberItemSchema) // ❌ Direct usage
}, {
  $id: "OutputProjectTeamSchema"
});
```

### 3. Using Schemas in Routes

Schemas are automatically registered, so you can use them directly:

```typescript
// project.controller.load.ts
import { OutputProjectTeamSchema } from './project.schemas.js';

export default function projectController({ useRoute }: AppContext) {
  useRoute('project')
    .get('/team')
    .code(200, OutputProjectTeamSchema) // ✅ Works automatically
    .handler(async (req) => {
      // ...
    })
    .build();
}
```

The `RouteBuilder.withRef()` method automatically:
- Checks if schema is registered
- Registers it if needed
- Uses `Type.Ref()` for schemas with `$id`

## Migration Guide

### Before (Manual Registration)

```typescript
// project.schemas.ts
import { getContext } from '@tsdiapi/server';

const context = getContext();
export const OutputProjectTeamMemberItemSchema = Type.Object({
  // ...
}, {
  $id: "OutputProjectTeamMemberItemSchema"
});

// Manual registration required
context.fastify.addSchema(OutputProjectTeamMemberItemSchema);
```

### After (Automatic Registration)

```typescript
// project.schemas.ts
export const OutputProjectTeamMemberItemSchema = Type.Object({
  // ...
}, {
  $id: "OutputProjectTeamMemberItemSchema"
});

// No manual registration needed! ✅
```

### Removing Manual Registration

You can now remove all manual `fastify.addSchema()` calls:

```typescript
// ❌ Remove this
const context = getContext();
context.fastify.addSchema(MySchema);

// ✅ System handles it automatically
```

## Advanced Usage

### Manual Registration (if needed)

If you need to register schemas manually (e.g., in plugins), use the helper:

```typescript
import { registerSchema } from '@tsdiapi/server';

export const MySchema = Type.Object({
  // ...
}, {
  $id: 'MySchema'
});

// Optional: register immediately (usually not needed)
registerSchema(MySchema);
```

### Checking Registration Status

```typescript
import { getSchemaRegistry } from '@tsdiapi/server';

const registry = getSchemaRegistry(fastify);
if (registry.isRegistered('MySchema')) {
  // Schema is registered
}
```

## Best Practices

### 1. Always Use useSchema() or Type.Ref() for Nested Schemas

```typescript
// ✅ BEST - Use useSchema() helper (auto-extracts $id, type-safe)
import { useSchema } from '@tsdiapi/server';

export const ListSchema = Type.Object({
  items: Type.Array(useSchema(ItemSchema)) // Pass schema object, not string
}, {
  $id: 'ListSchema'
});

// ✅ GOOD - Use Type.Ref() with string ID
export const ListSchema = Type.Object({
  items: Type.Array(Type.Ref('ItemSchema'))
}, {
  $id: 'ListSchema'
});

// ❌ BAD - causes duplicate definitions
export const ListSchema = Type.Object({
  items: Type.Array(ItemSchema) // Direct usage
}, {
  $id: 'ListSchema'
});
```

### 2. Use Descriptive $id Values

```typescript
// ✅ Good - clear and unique
$id: "OutputProjectTeamMemberItemSchema"

// ❌ Bad - ambiguous
$id: "Schema"
```

### 3. Keep Schemas in .schemas.ts Files

The system automatically scans `**/*.schemas.ts` files. Keep your schemas organized:

```
src/api/features/
├── project/
│   ├── project.schemas.ts  ✅ Auto-scanned
│   ├── project.service.ts
│   └── project.controller.load.ts
```

### 4. Generated Schemas

Generated schemas (from Prisma) are automatically registered via `preload-entities.extra.ts`. You don't need to do anything special.

## Troubleshooting

### Schema Not Found Error

If you get a "schema not found" error:

1. **Check $id property**: Ensure schema has `$id` property
2. **Check file location**: Schema file should match `**/*.schemas.ts` pattern
3. **Check dependency order**: If using `Type.Ref()`, ensure referenced schema is defined

### Duplicate Schema Error

If you see duplicate schema errors:

1. **Remove manual registration**: Don't call `fastify.addSchema()` manually
2. **Use Type.Ref()**: Always use `Type.Ref('SchemaId')` instead of direct schema usage
3. **Check $id uniqueness**: Ensure each schema has unique `$id`

### Circular Dependencies

The system handles circular dependencies gracefully. If you have circular refs:

```typescript
// Schema A references Schema B
export const SchemaA = Type.Object({
  b: Type.Ref('SchemaB')
}, { $id: 'SchemaA' });

// Schema B references Schema A
export const SchemaB = Type.Object({
  a: Type.Ref('SchemaA')
}, { $id: 'SchemaB' });
```

The system will detect and handle this automatically.

## Technical Details

### Registration Order

Schemas are registered in topological order:
1. Base schemas (no dependencies)
2. Schemas with dependencies (dependencies registered first)
3. Composite schemas

### Performance

- Schema discovery happens once during app initialization
- Registration is fast (O(n) where n = number of schemas)
- No runtime overhead after initialization

### Compatibility

- ✅ Works with existing code
- ✅ Backward compatible with manual registration
- ✅ Works with generated Prisma schemas
- ✅ Compatible with Fastify Swagger

## Examples

### Complete Example

```typescript
// user.schemas.ts
import { Type, Ref } from '@tsdiapi/server';
import { OutputUserSchema, OutputProjectSchema } from '@generated/typebox-schemas/models/index.js';

// Base schema
export const OutputUserProfileSchema = Type.Object({
  userId: Type.String(),
  email: Type.String(),
  name: Type.String()
}, {
  $id: "OutputUserProfileSchema"
});

// List schema using useSchema() helper - RECOMMENDED ✅
export const OutputUserListSchema = Type.Object({
  users: Type.Array(useSchema(OutputUserProfileSchema)), // Auto-extracts $id
  total: Type.Number()
}, {
  $id: "OutputUserListSchema"
});

// Nested schema using useSchema()
export const OutputUserWithProjectsSchema = Type.Object({
  user: useSchema(OutputUserProfileSchema),
  projects: Type.Array(useSchema(OutputProjectSchema)) // From generated schemas
}, {
  $id: "OutputUserWithProjectsSchema"
});
```

### Alternative Example (using Type.Ref() with strings)

```typescript
// user.schemas.ts
import { Type } from '@sinclair/typebox';
import { OutputUserSchema, OutputProjectSchema } from '@generated/typebox-schemas/models/index.js';

// Base schema
export const OutputUserProfileSchema = Type.Object({
  userId: Type.String(),
  email: Type.String(),
  name: Type.String()
}, {
  $id: "OutputUserProfileSchema"
});

// List schema using Type.Ref() with string IDs
export const OutputUserListSchema = Type.Object({
  users: Type.Array(Type.Ref('OutputUserProfileSchema')),
  total: Type.Number()
}, {
  $id: "OutputUserListSchema"
});

// Nested schema
export const OutputUserWithProjectsSchema = Type.Object({
  user: Type.Ref('OutputUserProfileSchema'),
  projects: Type.Array(Type.Ref('OutputProjectSchema'))
}, {
  $id: "OutputUserWithProjectsSchema"
});
```

```typescript
// user.controller.load.ts
import { OutputUserListSchema, OutputUserWithProjectsSchema } from './user.schemas.js';

export default function userController({ useRoute }: AppContext) {
  // All schemas are automatically registered!
  useRoute('user')
    .get('/list')
    .code(200, OutputUserListSchema)
    .handler(async (req) => {
      // ...
    })
    .build();
}
```

## useSchema() Helper Function

The `useSchema()` helper function provides a convenient way to create schema references without manually typing string IDs:

### Benefits

- ✅ **Auto-extracts $id** - No need to type schema ID as string
- ✅ **Type-safe** - TypeScript validates schema exists
- ✅ **Less error-prone** - Can't mistype schema ID
- ✅ **Better DX** - IDE autocomplete works with schema objects

### Usage

```typescript
import { Type, useSchema } from '@tsdiapi/server';
import { OutputProjectSchema } from '@generated/typebox-schemas/models/index.js';

// Instead of: Type.Ref('OutputProjectSchema')
// Use: useSchema(OutputProjectSchema)
export const ListSchema = Type.Object({
  items: Type.Array(useSchema(OutputProjectSchema))
}, {
  $id: 'ListSchema'
});
```

### When to Use useSchema() vs Type.Ref()

- **Use `useSchema(schema)`** - When you have the schema object imported
- **Use `Type.Ref('SchemaId')`** - When you only know the schema ID string

Both approaches work identically - `useSchema()` is just a convenience wrapper.

## Summary

The schema registration system provides:
- **Zero configuration** - works automatically
- **Type safety** - full TypeScript support
- **Clean code** - no manual registration needed
- **Reliable** - handles dependencies automatically
- **Swagger-friendly** - produces clean OpenAPI docs
- **Convenient** - `useSchema()` helper for easier schema references

Just define your schemas with `$id` and use `useSchema()` or `Type.Ref()` for references - the system handles the rest!


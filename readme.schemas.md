# Schema Registration System

## Overview

The schema registration system requires **explicit registration** of all schemas using `addSchema()`. This ensures:
- ✅ **Explicit control** - You know exactly which schemas are registered
- ✅ **Order matters!** - Dependencies must be registered first
- ✅ **Type safety** - Full TypeScript support
- ✅ **Better performance** - No unnecessary file scanning by default

## ⚠️ Critical Rules

1. **All schemas MUST be registered with `addSchema()` before use**
2. **Order of registration matters!** - Base schemas must be registered before dependent schemas
3. **Use `Type.Ref('SchemaId')` or `refSchema<typeof Schema>('SchemaId')` for references**

## How It Works

### 1. Explicit Registration (Required)

**All schemas must be explicitly registered with `addSchema()`:**

```typescript
import { addSchema, Type } from '@tsdiapi/server';

// ✅ Register schema explicitly - REQUIRED!
export const MySchema = addSchema(
  Type.Object({ name: Type.String() }, { $id: 'MySchema' })
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
3. Registers schemas in the order they are found

**Note**: Legacy mode is disabled by default. See [LEGACY_AUTO_REGISTRATION.md](./LEGACY_AUTO_REGISTRATION.md) for details.

## Schema Definition Pattern

### ✅ RECOMMENDED - Using addSchema() with Type.Ref()

```typescript
// project.schemas.ts
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

// ✅ STEP 2: Register dependent schema AFTER base schema
export const OutputProjectTeamSchema = addSchema(
  Type.Object({
    members: Type.Array(Type.Ref('OutputProjectTeamMemberItemSchema')) // ✅ Use Type.Ref()
  }, {
    $id: 'OutputProjectTeamSchema'
  })
);
```

### ✅ ALTERNATIVE - Using refSchema()

```typescript
// project.schemas.ts
import { addSchema, refSchema, Type } from '@tsdiapi/server';

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

// ✅ STEP 2: Register dependent schema AFTER base schema
export const OutputProjectTeamSchema = addSchema(
  Type.Object({
    members: Type.Array(refSchema<typeof OutputProjectTeamMemberItemSchema>('OutputProjectTeamMemberItemSchema')) // ✅ Use refSchema()
  }, {
    $id: 'OutputProjectTeamSchema'
  })
);
```

### ❌ INCORRECT - Direct schema embedding

```typescript
// DON'T DO THIS - causes duplicate schema definitions in Swagger
export const OutputProjectTeamSchema = addSchema(
  Type.Object({
    members: Type.Array(OutputProjectTeamMemberItemSchema) // ❌ Direct usage
  }, {
    $id: 'OutputProjectTeamSchema'
  })
);
```

## ⚠️ Order of Registration is Critical!

**❌ WRONG ORDER - Will fail!**

```typescript
// ❌ Registering dependent schema before base schema
export const ListSchema = addSchema(
  Type.Object({
    items: Type.Array(Type.Ref('ItemSchema')) // ❌ ItemSchema not registered yet!
  }, { $id: 'ListSchema' })
);

export const ItemSchema = addSchema(
  Type.Object({
    id: Type.String(),
    name: Type.String()
  }, { $id: 'ItemSchema' })
);
```

**✅ CORRECT ORDER - Works!**

```typescript
// ✅ Register base schema FIRST
export const ItemSchema = addSchema(
  Type.Object({
    id: Type.String(),
    name: Type.String()
  }, { $id: 'ItemSchema' })
);

// ✅ Register dependent schema AFTER
export const ListSchema = addSchema(
  Type.Object({
    items: Type.Array(Type.Ref('ItemSchema')) // ✅ ItemSchema already registered
  }, { $id: 'ListSchema' })
);
```

## Using Schemas in Routes

Schemas must be registered before use in routes:

```typescript
// project.controller.load.ts
import { OutputProjectTeamSchema } from './project.schemas.js';

export default function projectController({ useRoute }: AppContext) {
  useRoute('project')
    .get('/team')
    .code(200, OutputProjectTeamSchema) // ✅ Works - schema is registered
    .handler(async (req) => {
      // ...
    })
    .build();
}
```

## Migration Guide

### Before (Manual Registration)

```typescript
// project.schemas.ts
import { getContext } from '@tsdiapi/server';

const context = getContext();
export const OutputProjectTeamMemberItemSchema = Type.Object({
  // ...
}, {
  $id: 'OutputProjectTeamMemberItemSchema'
});

// Manual registration required
context.fastify.addSchema(OutputProjectTeamMemberItemSchema);
```

### After (Explicit Registration)

```typescript
// project.schemas.ts
import { addSchema, Type } from '@tsdiapi/server';

// ✅ Register with addSchema() - REQUIRED!
export const OutputProjectTeamMemberItemSchema = addSchema(
  Type.Object({
    // ...
  }, {
    $id: 'OutputProjectTeamMemberItemSchema'
  })
);
```

## Best Practices

### 1. Always Use Type.Ref() or refSchema() for Nested Schemas

```typescript
// ✅ GOOD - Use Type.Ref() with string ID
import { addSchema, Type } from '@tsdiapi/server';

// Register base schema first
export const ItemSchema = addSchema(
  Type.Object({ id: Type.String() }, { $id: 'ItemSchema' })
);

// Register dependent schema after
export const ListSchema = addSchema(
  Type.Object({
    items: Type.Array(Type.Ref('ItemSchema')) // ✅ Use Type.Ref()
  }, {
    $id: 'ListSchema'
  })
);

// ✅ ALTERNATIVE - Use refSchema()
import { addSchema, refSchema, Type } from '@tsdiapi/server';

export const ListSchema = addSchema(
  Type.Object({
    items: Type.Array(refSchema<typeof ItemSchema>('ItemSchema')) // ✅ Use refSchema()
  }, {
    $id: 'ListSchema'
  })
);

// ❌ BAD - causes duplicate definitions
export const ListSchema = addSchema(
  Type.Object({
    items: Type.Array(ItemSchema) // ❌ Direct usage
  }, {
    $id: 'ListSchema'
  })
);
```

### 2. Register Base Schemas First

```typescript
// ✅ Good - dependencies registered first
export const BaseSchema = addSchema(
  Type.Object({ id: Type.String() }, { $id: 'BaseSchema' })
);

export const UserSchema = addSchema(
  Type.Object({
    ...BaseSchema.properties,
    name: Type.String()
  }, { $id: 'UserSchema' })
);
```

### 3. Use Descriptive $id Values

```typescript
// ✅ Good - clear and unique
$id: 'OutputProjectTeamMemberItemSchema'

// ❌ Bad - ambiguous
$id: 'Schema'
```

### 4. Keep Schemas in .schemas.ts Files

Keep your schemas organized:

```
src/api/features/
├── project/
│   ├── project.schemas.ts  ✅ Schema definitions
│   ├── project.service.ts
│   └── project.controller.load.ts
```

### 5. Register Generated Schemas

Generated schemas (from Prisma) must be registered:

```typescript
import { addSchema } from '@tsdiapi/server';
import { OutputProjectSchema as GeneratedSchema } from '@generated/typebox-schemas/models/index.js';

// ✅ Register generated schema
export const OutputProjectSchema = addSchema(GeneratedSchema);
```

## Troubleshooting

### Schema Not Found Error

If you get a "schema not found" error:

1. **Check registration**: Ensure schema is registered with `addSchema()`
2. **Check $id property**: Ensure schema has `$id` property
3. **Check registration order**: If using `Type.Ref()`, ensure referenced schema is registered first

### Wrong Registration Order Error

If you get a "schema not found" error when using `Type.Ref()`:

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

### Duplicate Schema Error

If you see duplicate schema errors:

1. **Remove manual registration**: Don't call `fastify.addSchema()` manually
2. **Use Type.Ref()**: Always use `Type.Ref('SchemaId')` instead of direct schema usage
3. **Check $id uniqueness**: Ensure each schema has unique `$id`

## Examples

### Complete Example

```typescript
// user.schemas.ts
import { addSchema, Type } from '@tsdiapi/server';
import { OutputUserSchema, OutputProjectSchema } from '@generated/typebox-schemas/models/index.js';

// ✅ STEP 1: Register base schema FIRST
export const OutputUserProfileSchema = addSchema(
  Type.Object({
    userId: Type.String(),
    email: Type.String(),
    name: Type.String()
  }, {
    $id: 'OutputUserProfileSchema'
  })
);

// ✅ STEP 2: Register dependent schemas AFTER
export const OutputUserListSchema = addSchema(
  Type.Object({
    users: Type.Array(Type.Ref('OutputUserProfileSchema')), // ✅ Use Type.Ref()
    total: Type.Number()
  }, {
    $id: 'OutputUserListSchema'
  })
);

export const OutputUserWithProjectsSchema = addSchema(
  Type.Object({
    user: Type.Ref('OutputUserProfileSchema'),
    projects: Type.Array(Type.Ref('OutputProjectSchema')) // From generated schemas
  }, {
    $id: 'OutputUserWithProjectsSchema'
  })
);
```

```typescript
// user.controller.load.ts
import { OutputUserListSchema, OutputUserWithProjectsSchema } from './user.schemas.js';

export default function userController({ useRoute }: AppContext) {
  useRoute('user')
    .get('/list')
    .code(200, OutputUserListSchema) // ✅ Works - schema is registered
    .handler(async (req) => {
      // ...
    })
    .build();
}
```

## Summary

The schema registration system provides:
- ✅ **Explicit registration** - Use `addSchema()` to register schemas - **REQUIRED**
- ✅ **Order matters!** - Register base schemas before dependent schemas
- ✅ **Type safety** - Full TypeScript support
- ✅ **Clean code** - All registrations visible in code
- ✅ **Reliable** - Proper dependency management
- ✅ **Swagger-friendly** - Produces clean OpenAPI docs

**Key Points:**
- Always use `addSchema()` to register schemas
- Register base schemas before dependent schemas
- Use `Type.Ref('SchemaId')` or `refSchema<typeof Schema>('SchemaId')` for references
- All schemas must have `$id` property

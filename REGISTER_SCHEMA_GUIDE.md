# Schema Registration Guide: addSchema() and refSchema()

## Overview

Schema registration is **REQUIRED** for all schemas used in routes. The system provides:
- ✅ **Explicit registration** via `addSchema()` - **REQUIRED**
- ✅ **Order matters!** - Dependencies must be registered first
- ✅ **Reference creation** via `Type.Ref()` or `refSchema()`
- ✅ **Duplicate prevention** - Safe duplicate registration
- ✅ **Type safety** - Full TypeScript support

## ⚠️ Critical Rules

1. **All schemas MUST be registered with `addSchema()` before use**
2. **Order of registration matters!** - Base schemas must be registered before dependent schemas
3. **Use `Type.Ref('SchemaId')` or `refSchema<typeof Schema>('SchemaId')` for references**

## Basic Usage

### Registering a Schema

```typescript
import { addSchema, Type } from '@tsdiapi/server';

// ✅ Register schema with $id
export const MySchema = addSchema(
  Type.Object({
    name: Type.String(),
    email: Type.String()
  }, {
    $id: 'MySchema' // ✅ $id is REQUIRED
  })
);
```

### Using Registered Schemas in Routes

```typescript
import { MySchema } from './schemas.js';

useRoute('user')
  .post('/')
  .body(MySchema) // ✅ Works - schema is registered
  .build();
```

## Schema References

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

## Real-World Examples

### Example 1: Project Schemas

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

// ✅ STEP 2: Register dependent schema AFTER
export const OutputProjectTeamSchema = addSchema(
  Type.Object({
    members: Type.Array(Type.Ref('OutputProjectTeamMemberItemSchema')) // ✅ Use Type.Ref()
  }, {
    $id: 'OutputProjectTeamSchema'
  })
);

// ✅ STEP 3: Register complex nested schema AFTER dependencies
export const OutputProjectDetailsSchema = addSchema(
  Type.Object({
    project: Type.Ref('OutputProjectSchema'), // From generated schemas
    team: Type.Ref('OutputProjectTeamSchema')
  }, {
    $id: 'OutputProjectDetailsSchema'
  })
);
```

### Example 2: Input Schemas

```typescript
// project.schemas.ts
import { addSchema, Type } from '@tsdiapi/server';

export const InputCreateProjectSchema = addSchema(
  Type.Object({
    name: Type.String({ minLength: 1, maxLength: 200 }),
    description: Type.Optional(Type.String({ maxLength: 5000 }))
  }, {
    $id: 'InputCreateProjectSchema'
  })
);
```

### Example 3: Using in Controllers

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

## Generated Schemas (Prisma)

If you have generated schemas (e.g., from Prisma), register them with `addSchema()`:

```typescript
import { addSchema } from '@tsdiapi/server';
import { OutputProjectSchema as GeneratedOutputProjectSchema } from '@generated/typebox-schemas/models/index.js';

// ✅ Register generated schema
export const OutputProjectSchema = addSchema(GeneratedOutputProjectSchema);

// Use in routes
useRoute('project')
  .code(200, OutputProjectSchema) // ✅ Works
  .build();

// Use in nested schemas - register base schema FIRST!
export const ListSchema = addSchema(
  Type.Object({
    items: Type.Array(Type.Ref('OutputProjectSchema')) // ✅ Use Type.Ref()
  }, { $id: 'ListSchema' })
);
```

## Migration from useSchema()

If you have code using `useSchema()` (which doesn't exist), migrate to `addSchema()`:

### Before (useSchema - doesn't exist)

```typescript
// ❌ This doesn't work - useSchema() doesn't exist
import { useSchema, Type } from '@tsdiapi/server';

export const MySchema = useSchema(
  Type.Object({ name: Type.String() }),
  'MySchema'
);
```

### After (addSchema - correct)

```typescript
// ✅ Correct - use addSchema()
import { addSchema, Type } from '@tsdiapi/server';

export const MySchema = addSchema(
  Type.Object({ name: Type.String() }, { $id: 'MySchema' })
);
```

## Error Handling

### Schema Without $id

```typescript
// ❌ Error
const MySchema = Type.Object({ name: Type.String() });
addSchema(MySchema); // Error: Schema must have $id property

// ✅ Correct
const MySchema = addSchema(
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

// ✅ Correct - Register ItemSchema first
export const ItemSchema = addSchema(
  Type.Object({ id: Type.String() }, { $id: 'ItemSchema' })
);

export const ListSchema = addSchema(
  Type.Object({
    items: Type.Array(Type.Ref('ItemSchema')) // ✅ Works
  }, { $id: 'ListSchema' })
);
```

## Best Practices

### 1. Register Base Schemas First

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

### 2. Use Type.Ref() for References

```typescript
// ✅ Good - uses Type.Ref() for references
export const ListSchema = addSchema(
  Type.Object({
    items: Type.Array(Type.Ref('ItemSchema'))
  }, { $id: 'ListSchema' })
);
```

### 3. Group Related Schemas Together

```typescript
// ✅ Good - related schemas in same file, registered in order
// project.schemas.ts

// Base schemas first
export const ItemSchema = addSchema(...);
export const BaseSchema = addSchema(...);

// Dependent schemas after
export const ListSchema = addSchema(...);
export const ComplexSchema = addSchema(...);
```

### 4. Import and Register Generated Schemas

```typescript
// ✅ Good - register generated schemas at top of file
import { addSchema } from '@tsdiapi/server';
import { OutputProjectSchema as GeneratedSchema } from '@generated/...';

export const OutputProjectSchema = addSchema(GeneratedSchema);
```

## Summary

- ✅ **Always use `addSchema()`** to register schemas - **REQUIRED**
- ✅ **Order matters!** - Register base schemas before dependent schemas
- ✅ **Use `Type.Ref('SchemaId')` or `refSchema<typeof Schema>('SchemaId')`** for references
- ✅ **All schemas must have `$id`** property
- ✅ **Register generated schemas** with `addSchema()`

The system ensures proper schema registration and dependency management when you follow these rules!

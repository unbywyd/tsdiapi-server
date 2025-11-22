# Schema $id Requirement in Routes

## Overview

All schemas used in route definitions (`params()`, `body()`, `query()`, `headers()`, `code()`) **MUST** have a `$id` property. This ensures:
- ✅ Consistent schema registration
- ✅ Proper Swagger documentation
- ✅ No duplicate schema definitions
- ✅ Predictable schema references

## Why $id is Required?

Without `$id`, the system cannot:
- Create proper schema references in Swagger
- Track schema dependencies
- Prevent duplicate registrations
- Generate clean OpenAPI documentation

## How to Provide $id

### Option 1: Use useSchema() (Recommended)

```typescript
import { useSchema, Type } from '@tsdiapi/server';

// Register schema with $id
export const InputCreateProjectSchema = useSchema(
  Type.Object({
    name: Type.String(),
    email: Type.String()
  }),
  'InputCreateProjectSchema' // ✅ Auto-generates $id
);

// Use in route
useRoute('project')
  .post('/')
  .body(InputCreateProjectSchema) // ✅ Works - has $id
  .build();
```

### Option 2: Add $id Directly

```typescript
import { Type } from '@sinclair/typebox';

export const InputCreateProjectSchema = Type.Object({
  name: Type.String(),
  email: Type.String()
}, {
  $id: 'InputCreateProjectSchema' // ✅ Explicit $id
});

// Use in route
useRoute('project')
  .post('/')
  .body(InputCreateProjectSchema) // ✅ Works - has $id
  .build();
```

## Error Handling

If you try to use a schema without `$id` in a route, you'll get a clear error:

```typescript
// ❌ Error - schema without $id
const MySchema = Type.Object({ name: Type.String() });

useRoute('project')
  .post('/')
  .body(MySchema) // ❌ Error!
  .build();

// Error message:
// Schema used in route must have $id property.
// Context: method: POST, route: /, type: body
//
// Solution:
// 1. Use useSchema() to register schema with $id:
//    export const MySchema = useSchema(Type.Object({...}), 'MySchema');
//
// 2. Or add $id directly:
//    Type.Object({...}, { $id: 'MySchema' })
//
// 3. Then use in route:
//    .body(MySchema)
```

## Examples

### ✅ Correct Usage

```typescript
// project.schemas.ts
import { registerSchema, Type } from '@tsdiapi/server';

export const InputCreateProjectSchema = registerSchema(
  Type.Object({
    name: Type.String({ minLength: 1 }),
    description: Type.Optional(Type.String())
  }),
  'InputCreateProjectSchema'
);

export const OutputProjectSchema = registerSchema(
  Type.Object({
    id: Type.String(),
    name: Type.String()
  }),
  'OutputProjectSchema'
);
```

```typescript
// project.controller.load.ts
import { InputCreateProjectSchema, OutputProjectSchema } from './project.schemas.js';

useRoute('project')
  .post('/')
  .body(InputCreateProjectSchema) // ✅ Has $id
  .code(200, OutputProjectSchema) // ✅ Has $id
  .handler(async (req) => {
    // ...
  })
  .build();
```

### ❌ Incorrect Usage

```typescript
// ❌ Schema without $id
const MySchema = Type.Object({ name: Type.String() });

useRoute('project')
  .post('/')
  .body(MySchema) // ❌ Error: Schema must have $id
  .build();
```

## Benefits

### 1. Predictable Schema IDs

```typescript
// ✅ Always the same ID
export const MySchema = registerSchema(Type.Object({...}), 'MySchema');
// $id: 'MySchema' - consistent across all uses
```

### 2. Clean Swagger Documentation

Schemas with `$id` appear as reusable components in Swagger:
- Single definition per schema
- References instead of inline definitions
- Better documentation structure

### 3. Dependency Tracking

The system can track which schemas reference which:
- Validates dependencies exist
- Registers in correct order
- Prevents circular dependency issues

## Migration

If you have schemas without `$id` used in routes:

1. **Register them with useSchema()**:
   ```typescript
   // Before
   const MySchema = Type.Object({...});
   
   // After
   export const MySchema = useSchema(
     Type.Object({...}),
     'MySchema'
   );
   ```

2. **Or add $id directly**:
   ```typescript
   // Before
   const MySchema = Type.Object({...});
   
   // After
   const MySchema = Type.Object({...}, { $id: 'MySchema' });
   ```

## Summary

- ✅ **Always use `useSchema()`** for schemas used in routes
- ✅ **Or add `$id` directly** to schema definition
- ❌ **Never use schemas without `$id`** in route definitions
- ✅ **Error messages guide you** to the solution

This requirement ensures clean, maintainable, and well-documented APIs!


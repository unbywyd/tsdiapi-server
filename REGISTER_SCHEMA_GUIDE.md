# useSchema() - Unified Schema Registration and Reference Guide

## Overview

The `useSchema()` function provides unified schema registration and reference creation:
- ✅ **Auto $id generation** - No need to manually create $id
- ✅ **Validation** - Checks schema structure and dependencies
- ✅ **Duplicate detection** - Prevents duplicate registrations
- ✅ **Reuse support** - Returns registered schema for reuse
- ✅ **Dependency checking** - Validates referenced schemas exist

## Basic Usage

### Before (Manual $id)

```typescript
// ❌ Manual $id creation - error-prone
export const OutputUserProjectsListSchema = Type.Object({
  projects: Type.Array(Type.Ref('OutputProjectSchema'))
}, {
  $id: "OutputUserProjectsListSchema" // Manual, can have typos
})
```

### After (Auto $id)

```typescript
// ✅ Simple usage with string (recommended for most cases)
import { useSchema, Type } from '@tsdiapi/server';
import { OutputProjectSchema } from '@generated/typebox-schemas/models/index.js';

export const OutputUserProjectsListSchema = useSchema(
  Type.Object({
    projects: Type.Array(useSchema(OutputProjectSchema)) // ✅ Creates Type.Ref()
  }),
  'OutputUserProjectsListSchema' // ✅ Just pass the name as string
);

// ✅ Advanced usage with options object (when you need more control)
export const OutputUserProjectsListSchema = useSchema(
  Type.Object({
    projects: Type.Array(useSchema(OutputProjectSchema))
  }),
  { name: 'OutputUserProjectsListSchema', validate: false }
);
```

## Features

### 1. Auto $id Generation

```typescript
// Option 1: Simple string (recommended for most cases)
export const MySchema = useSchema(
  Type.Object({ name: Type.String() }),
  'MySchema' // ✅ Simple and clean - $id will be 'MySchema'
);

// Option 2: From variable name via options object
export const MySchema = useSchema(
  Type.Object({ name: Type.String() }),
  { name: 'MySchema' } // $id will be 'MySchema'
);

// Option 3: Explicit ID via options object
export const MySchema = useSchema(
  Type.Object({ name: Type.String() }),
  { id: 'CustomSchemaId' } // $id will be 'CustomSchemaId'
);

// Option 4: Schema already has $id
const schema = Type.Object({ name: Type.String() }, { $id: 'ExistingId' });
export const MySchema = useSchema(schema); // Uses existing $id
```

### 2. Validation

```typescript
// Automatically validates schema structure
export const MySchema = useSchema(
  Type.Object({ name: Type.String() }),
  { 
    name: 'MySchema',
    validate: true // Default: validates schema structure
  }
);

// Disable validation if needed
export const MySchema = useSchema(
  Type.Object({ name: Type.String() }),
  { 
    name: 'MySchema',
    validate: false
  }
);
```

### 3. Dependency Checking

```typescript
// Checks if referenced schemas are registered
export const ListSchema = useSchema(
  Type.Object({
    items: Type.Array(useSchema(OutputProjectSchema)) // Checks OutputProjectSchema exists
  }),
  { 
    name: 'ListSchema',
    checkDependencies: true // Default: checks dependencies
  }
);
```

### 4. Duplicate Detection

```typescript
// Strict mode (default) - throws error on duplicate
export const MySchema = useSchema(
  Type.Object({ name: Type.String() }),
  { name: 'MySchema', strict: true }
);

// Non-strict mode - reuses existing schema
export const MySchema = useSchema(
  Type.Object({ name: Type.String() }),
  { name: 'MySchema', strict: false }
);
```

### 5. Schema Reuse

```typescript
// registerSchema returns registered schema - can be reused
const baseSchema = useSchema(
  Type.Object({ id: Type.String() }),
  { name: 'BaseSchema' }
);

// Reuse in multiple places
export const UserSchema = useSchema(
  Type.Intersect([
    baseSchema,
    Type.Object({ name: Type.String() })
  ]),
  { name: 'UserSchema' }
);

export const ProjectSchema = useSchema(
  Type.Intersect([
    baseSchema,
    Type.Object({ title: Type.String() })
  ]),
  { name: 'ProjectSchema' }
);
```

## Real-World Examples

### Example 1: Project Schemas

```typescript
// project.schemas.ts
import { registerSchema, Type, useSchema } from '@tsdiapi/server';
import { OutputProjectSchema } from '@generated/typebox-schemas/models/index.js';

// Base schema - auto $id (simple string usage)
export const OutputProjectTeamMemberItemSchema = useSchema(
  Type.Object({
    userId: Type.String(),
    email: Type.String(),
    role: Type.String()
  }),
  'OutputProjectTeamMemberItemSchema' // ✅ Simple string
);

// Composite schema using useSchema() - dependencies checked automatically
export const OutputProjectTeamSchema = useSchema(
  Type.Object({
    members: Type.Array(useSchema(OutputProjectTeamMemberItemSchema))
  }),
  'OutputProjectTeamSchema' // ✅ Simple string
);

// Complex nested schema
export const OutputProjectDetailsSchema = useSchema(
  Type.Object({
    project: useSchema(OutputProjectSchema),
    team: useSchema(OutputProjectTeamSchema)
  }),
  'OutputProjectDetailsSchema' // ✅ Simple string
);
```

### Example 2: Input Schemas

```typescript
// project.schemas.ts
import { registerSchema, Type } from '@tsdiapi/server';

export const InputCreateProjectSchema = useSchema(
  Type.Object({
    name: Type.String({ minLength: 1, maxLength: 200 }),
    description: Type.Optional(Type.String({ maxLength: 5000 }))
  }),
  { 
    name: 'InputCreateProjectSchema',
    validate: true, // Validates structure
    checkDependencies: false // No dependencies to check
  }
);
```

### Example 3: Using in Controllers

```typescript
// project.controller.load.ts
import { registerSchema, Type } from '@tsdiapi/server';
import { OutputProjectSchema } from '@generated/typebox-schemas/models/index.js';

export default function controllers({ useRoute }: AppContext) {
  // Schemas are automatically registered - no manual fastify.addSchema() needed!
  
  useRoute('project')
    .get("/")
    .code(200, OutputProjectSchema) // ✅ Works directly
    .handler(async (req) => {
      // ...
    })
    .build();
}
```

## Migration Guide

### Step 1: Replace Manual $id

```typescript
// Before
export const MySchema = Type.Object({
  name: Type.String()
}, {
  $id: "MySchema" // ❌ Manual
});

// After (simple string - recommended)
export const MySchema = useSchema(
  Type.Object({
    name: Type.String()
  }),
  'MySchema' // ✅ Auto - just pass the name as string
);

// After (with options - when you need more control)
export const MySchema = useSchema(
  Type.Object({
    name: Type.String()
  }),
  { name: 'MySchema', validate: false } // ✅ Auto with options
);
```

### Step 2: Remove Manual Registration

```typescript
// Before
const context = getContext();
export const MySchema = Type.Object({...}, { $id: 'MySchema' });
context.fastify.addSchema(MySchema); // ❌ Manual registration

// After
export const MySchema = useSchema(
  Type.Object({...}),
  { name: 'MySchema' }
); // ✅ Auto registration
```

### Step 3: Remove Controller Registration

```typescript
// Before
export default function controllers({ useRoute, fastify }: AppContext) {
  // Manual registration
  const customSchemas = [MySchema, OtherSchema];
  for (const schema of customSchemas) {
    if (schema.$id && !fastify.getSchema(schema.$id)) {
      fastify.addSchema(schema);
    }
  }
  // ...
}

// After
export default function controllers({ useRoute }: AppContext) {
  // No manual registration needed! ✅
  // Schemas are auto-registered when imported
  // ...
}
```

## Options Reference

```typescript
interface RegisterSchemaOptions {
  /**
   * Explicit schema ID. If not provided, will be auto-generated
   */
  id?: string;
  
  /**
   * Variable name (used for auto-generating $id)
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
   * Whether to throw error if schema already registered
   * @default true
   */
  strict?: boolean;
}
```

## Error Handling

### Missing Name/ID

```typescript
// ❌ Error
useSchema(Type.Object({ name: Type.String() }));
// Error: Schema ID is required. Provide either: 1) explicit id option, 2) $id in schema, or 3) name option

// ✅ Correct
useSchema(Type.Object({ name: Type.String() }), { name: 'MySchema' });
```

### Duplicate Schema

```typescript
// ❌ Error in strict mode
const schema1 = useSchema(Type.Object({...}), { name: 'MySchema' });
const schema2 = useSchema(Type.Object({...}), { name: 'MySchema' });
// Error: Schema "MySchema" is already registered with a different definition

// ✅ Reuse existing
const schema1 = useSchema(Type.Object({...}), { name: 'MySchema' });
const schema2 = useSchema(Type.Object({...}), { name: 'MySchema', strict: false });
// schema2 === schema1 (reuses existing)
```

### Missing Dependency

```typescript
// ⚠️ Warning
export const ListSchema = useSchema(
  Type.Object({
    items: Type.Array(useSchema(NonExistentSchema)) // Schema not registered yet
  }),
  { name: 'ListSchema' }
);
// Warning: Schema "ListSchema" references "NonExistentSchema" which is not yet registered
```

## Best Practices

### 1. Use Variable Names for $id

```typescript
// ✅ Good - clear and consistent
export const OutputUserProjectsListSchema = useSchema(
  Type.Object({...}),
  { name: 'OutputUserProjectsListSchema' }
);

// ❌ Bad - inconsistent naming
export const userProjects = useSchema(
  Type.Object({...}),
  { id: 'OutputUserProjectsListSchema' }
);
```

### 2. Register Base Schemas First

```typescript
// ✅ Good - dependencies registered first
export const BaseSchema = useSchema(Type.Object({ id: Type.String() }), { name: 'BaseSchema' });
export const UserSchema = useSchema(
  Type.Intersect([BaseSchema, Type.Object({ name: Type.String() })]),
  { name: 'UserSchema' }
);
```

### 3. Use useSchema() for Nested Schemas

```typescript
// ✅ Good - uses useSchema() for references
export const ListSchema = useSchema(
  Type.Object({
    items: Type.Array(useSchema(ItemSchema))
  }),
  { name: 'ListSchema' }
);
```

### 4. Enable Validation in Development

```typescript
// ✅ Good - catch errors early
export const MySchema = useSchema(
  Type.Object({...}),
  { 
    name: 'MySchema',
    validate: process.env.NODE_ENV !== 'production' // Validate in dev
  }
);
```

## Summary

`useSchema()` provides:
- ✅ **Zero manual $id** - Auto-generated from variable names
- ✅ **Validation** - Catches errors early
- ✅ **Dependency checking** - Ensures referenced schemas exist
- ✅ **Duplicate prevention** - Prevents conflicts
- ✅ **Reuse support** - Returns registered schema
- ✅ **Type safety** - Full TypeScript support

Use `useSchema()` for all custom schemas - it handles everything automatically!

## Two Ways to Use useSchema()

### 1. Register Schema (with name/options)
```typescript
// Registers schema and returns it with $id
export const MySchema = useSchema(
  Type.Object({ name: Type.String() }),
  'MySchema'
);

// Use in route
useRoute('project')
  .body(MySchema) // ✅ Works - schema is registered
  .build();
```

### 2. Create Reference (schema with $id only)
```typescript
// When called with only a schema that has $id, creates Type.Ref()
const MySchema = useSchema(Type.Object({...}), 'MySchema');

// Use in nested schema - creates Type.Ref() automatically
const ListSchema = useSchema(
  Type.Object({
    items: Type.Array(useSchema(MySchema)) // ✅ Creates Type.Ref()
  }),
  'ListSchema'
);
```

The function automatically detects:
- **With name/options** → Registers schema
- **Schema with $id only** → Creates Type.Ref() for references


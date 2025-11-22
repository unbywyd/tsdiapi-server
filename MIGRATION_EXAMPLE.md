# Migration Example: project.schemas.ts

## Before (Current Code)

```typescript
// project.schemas.ts - BEFORE
import { Type, Static } from '@sinclair/typebox';
import { OutputProjectSchema } from '@generated/typebox-schemas/models/index.js';
import { TeamMemberRole, TeamInvitationStatus } from '@generated/typebox-schemas/enums/index.js';
import { DateString, getContext } from '@tsdiapi/server';

const context = getContext();

// ❌ Manual $id, potential for typos
export const OutputUserProjectsListSchema = Type.Object({
  projects: Type.Array(Type.Ref('OutputProjectSchema'))
}, {
  $id: "OutputUserProjectsListSchema"
})

// ❌ Duplicate definition (line 7 and 14)
export const OutputUserProjectsListSchema = Type.Object({
  projects: Type.Array(OutputProjectSchema) // Direct usage - causes duplicates
}, {
  $id: "OutputUserProjectsListSchema"
})

export const InputCreateProjectSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 200 }),
  description: Type.Optional(Type.String({ maxLength: 5000 }))
}, {
  $id: "InputCreateProjectSchema",
  additionalProperties: false
})

export const OutputProjectTeamMemberItemSchema = Type.Object({
  userId: Type.String(),
  email: Type.String(),
  role: TeamMemberRole
}, {
  $id: "OutputProjectTeamMemberItemSchema"
})

// ❌ Manual registration required
context.fastify.addSchema(OutputProjectTeamMemberItemSchema);

export const OutputProjectTeamSchema = Type.Object({
  members: Type.Array(Type.Ref('OutputProjectTeamMemberItemSchema'))
}, {
  $id: "OutputProjectTeamSchema"
})
```

```typescript
// project.controller.load.ts - BEFORE
export default async function controllers({ useRoute, fastify }: AppContext) {
  // ❌ Manual schema registration
  const customSchemas = [
    OutputUserProjectsListSchema,
    InputCreateProjectSchema,
    OutputProjectTeamSchema,
    // ... many more
  ];

  for (const schema of customSchemas) {
    if (schema.$id && !fastify.getSchema(schema.$id)) {
      fastify.addSchema(schema);
    }
  }

  useRoute('project')
    .get("/")
    .code(200, OutputUserProjectsListSchema)
    .handler(async (req) => {
      // ...
    })
    .build();
}
```

## After (Migrated Code)

```typescript
// project.schemas.ts - AFTER
import { Type, Static, registerSchema, Ref } from '@tsdiapi/server';
import { OutputProjectSchema } from '@generated/typebox-schemas/models/index.js';
import { TeamMemberRole, TeamInvitationStatus } from '@generated/typebox-schemas/enums/index.js';
import { DateString } from '@tsdiapi/server';

// ✅ Auto $id from variable name, no typos possible (simple string usage)
export const OutputUserProjectsListSchema = registerSchema(
  Type.Object({
    projects: Type.Array(useSchema(OutputProjectSchema)) // Uses useSchema() helper
  }),
  'OutputUserProjectsListSchema' // ✅ Just pass the name as string
);

// ✅ No duplicates - registerSchema detects and prevents them
// If you try to register same schema twice, it reuses the first one

// ✅ Simple string usage (most common case)
export const InputCreateProjectSchema = registerSchema(
  Type.Object({
    name: Type.String({ minLength: 1, maxLength: 200 }),
    description: Type.Optional(Type.String({ maxLength: 5000 }))
  }),
  'InputCreateProjectSchema' // ✅ Simple string
);

// ✅ Auto-registered, no manual addSchema() needed
export const OutputProjectTeamMemberItemSchema = registerSchema(
  Type.Object({
    userId: Type.String(),
    email: Type.String(),
    role: TeamMemberRole
  }),
  'OutputProjectTeamMemberItemSchema' // ✅ Simple string
);

// ✅ Dependencies checked automatically
export const OutputProjectTeamSchema = registerSchema(
  Type.Object({
    members: Type.Array(useSchema(OutputProjectTeamMemberItemSchema))
  }),
  'OutputProjectTeamSchema' // ✅ Simple string - dependencies checked automatically
);
```

```typescript
// project.controller.load.ts - AFTER
export default async function controllers({ useRoute }: AppContext) {
  // ✅ No manual registration needed!
  // Schemas are auto-registered when imported
  
  useRoute('project')
    .get("/")
    .code(200, OutputUserProjectsListSchema) // ✅ Works directly
    .handler(async (req) => {
      // ...
    })
    .build();
}
```

## Benefits

### 1. No Manual $id

**Before:**
```typescript
$id: "OutputUserProjectsListSchema" // ❌ Manual, can have typos
```

**After:**
```typescript
{ name: 'OutputUserProjectsListSchema' } // ✅ Auto, type-safe
```

### 2. No Manual Registration

**Before:**
```typescript
context.fastify.addSchema(OutputProjectTeamMemberItemSchema); // ❌ Manual
```

**After:**
```typescript
registerSchema(..., { name: '...' }); // ✅ Auto
```

### 3. Duplicate Detection

**Before:**
```typescript
// Two definitions with same $id - causes issues
export const OutputUserProjectsListSchema = Type.Object({...}, { $id: "..." });
export const OutputUserProjectsListSchema = Type.Object({...}, { $id: "..." });
```

**After:**
```typescript
// registerSchema detects duplicates and reuses first one
const schema1 = registerSchema(Type.Object({...}), { name: 'MySchema' });
const schema2 = registerSchema(Type.Object({...}), { name: 'MySchema' });
// schema2 === schema1 (reuses existing)
```

### 4. Dependency Validation

**Before:**
```typescript
// No validation - breaks at runtime if dependency missing
export const OutputProjectTeamSchema = Type.Object({
  members: Type.Array(Type.Ref('NonExistentSchema'))
}, { $id: "..." });
```

**After:**
```typescript
// Validates dependencies exist
export const OutputProjectTeamSchema = registerSchema(
  Type.Object({
    members: Type.Array(useSchema(NonExistentSchema))
  }),
  { name: 'OutputProjectTeamSchema' }
);
// Warning: Schema "OutputProjectTeamSchema" references "NonExistentSchema" which is not yet registered
```

### 5. Cleaner Controllers

**Before:**
```typescript
export default async function controllers({ useRoute, fastify }: AppContext) {
  // 20+ lines of manual registration
  const customSchemas = [...];
  for (const schema of customSchemas) {
    if (schema.$id && !fastify.getSchema(schema.$id)) {
      fastify.addSchema(schema);
    }
  }
  // ...
}
```

**After:**
```typescript
export default async function controllers({ useRoute }: AppContext) {
  // ✅ No registration code needed!
  // ...
}
```

## Step-by-Step Migration

1. **Update imports**
   ```typescript
   // Add registerSchema and Ref
   import { registerSchema, Ref } from '@tsdiapi/server';
   ```

2. **Replace schema definitions**
   ```typescript
   // Change from:
   export const MySchema = Type.Object({...}, { $id: "MySchema" });
   
   // To:
   export const MySchema = registerSchema(
     Type.Object({...}),
     { name: 'MySchema' }
   );
   ```

3. **Replace Type.Ref() with useSchema()**
   ```typescript
   // Change from:
   Type.Ref('OutputProjectSchema')
   
   // To:
   useSchema(OutputProjectSchema)
   ```

4. **Remove manual registration**
   ```typescript
   // Remove:
   context.fastify.addSchema(MySchema);
   ```

5. **Remove controller registration**
   ```typescript
   // Remove:
   const customSchemas = [...];
   for (const schema of customSchemas) {
     fastify.addSchema(schema);
   }
   ```

6. **Remove getContext() calls**
   ```typescript
   // Remove:
   const context = getContext();
   ```

## Complete Example

```typescript
// project.schemas.ts - COMPLETE MIGRATION
import { Type, Static, registerSchema, Ref } from '@tsdiapi/server';
import { OutputProjectSchema } from '@generated/typebox-schemas/models/index.js';
import { TeamMemberRole } from '@generated/typebox-schemas/enums/index.js';
import { DateString } from '@tsdiapi/server';

// List schema
export const OutputUserProjectsListSchema = registerSchema(
  Type.Object({
    projects: Type.Array(useSchema(OutputProjectSchema))
  }),
  { name: 'OutputUserProjectsListSchema' }
);

// Input schema
export const InputCreateProjectSchema = registerSchema(
  Type.Object({
    name: Type.String({ minLength: 1, maxLength: 200 }),
    description: Type.Optional(Type.String({ maxLength: 5000 }))
  }),
  { name: 'InputCreateProjectSchema' }
);

// Base schema
export const OutputProjectTeamMemberItemSchema = registerSchema(
  Type.Object({
    userId: Type.String(),
    email: Type.String(),
    role: TeamMemberRole,
    createdAt: DateString()
  }),
  { name: 'OutputProjectTeamMemberItemSchema' }
);

// Composite schema with dependency
export const OutputProjectTeamSchema = registerSchema(
  Type.Object({
    members: Type.Array(useSchema(OutputProjectTeamMemberItemSchema))
  }),
  { name: 'OutputProjectTeamSchema' }
);

// Types (still work the same)
export type OutputUserProjectsListSchemaType = Static<typeof OutputUserProjectsListSchema>;
export type InputCreateProjectSchemaType = Static<typeof InputCreateProjectSchema>;
export type OutputProjectTeamSchemaType = Static<typeof OutputProjectTeamSchema>;
```

```typescript
// project.controller.load.ts - COMPLETE MIGRATION
import { AppContext } from "@tsdiapi/server";
import {
  OutputUserProjectsListSchema,
  InputCreateProjectSchema,
  OutputProjectTeamSchema
} from "./project.schemas.js";

export default async function controllers({ useRoute }: AppContext) {
  // ✅ No registration code - schemas work directly!
  
  useRoute('project')
    .get("/")
    .code(200, OutputUserProjectsListSchema)
    .handler(async (req) => {
      // ...
    })
    .build();

  useRoute('project')
    .post("/")
    .body(InputCreateProjectSchema)
    .code(200, OutputProjectTeamSchema)
    .handler(async (req) => {
      // ...
    })
    .build();
}
```

## Summary

Migration provides:
- ✅ **Zero manual $id** - Auto-generated
- ✅ **Zero manual registration** - Auto-registered
- ✅ **Duplicate detection** - Prevents conflicts
- ✅ **Dependency validation** - Catches errors early
- ✅ **Cleaner code** - Less boilerplate
- ✅ **Type safety** - Full TypeScript support

Migrate gradually - `registerSchema()` is backward compatible with existing schemas!


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
import { Type, Static, addSchema } from '@tsdiapi/server';
import { OutputProjectSchema } from '@generated/typebox-schemas/models/index.js';
import { TeamMemberRole, TeamInvitationStatus } from '@generated/typebox-schemas/enums/index.js';
import { DateString } from '@tsdiapi/server';

// ✅ Register schema with addSchema() - REQUIRED!
export const OutputUserProjectsListSchema = addSchema(
  Type.Object({
    projects: Type.Array(Type.Ref('OutputProjectSchema')) // ✅ Use Type.Ref() for references
  }, {
    $id: 'OutputUserProjectsListSchema'
  })
);

// ✅ Register input schema
export const InputCreateProjectSchema = addSchema(
  Type.Object({
    name: Type.String({ minLength: 1, maxLength: 200 }),
    description: Type.Optional(Type.String({ maxLength: 5000 }))
  }, {
    $id: 'InputCreateProjectSchema',
    additionalProperties: false
  })
);

// ✅ STEP 1: Register base schema FIRST
export const OutputProjectTeamMemberItemSchema = addSchema(
  Type.Object({
    userId: Type.String(),
    email: Type.String(),
    role: TeamMemberRole
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

```typescript
// project.controller.load.ts - AFTER
export default async function controllers({ useRoute }: AppContext) {
  // ✅ No manual registration needed!
  // Schemas are registered when imported via addSchema()
  
  useRoute('project')
    .get("/")
    .code(200, OutputUserProjectsListSchema) // ✅ Works - schema is registered
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
addSchema(
  Type.Object({...}, { $id: 'OutputUserProjectsListSchema' }) // ✅ Explicit $id
);
```

### 2. No Manual Registration

**Before:**
```typescript
context.fastify.addSchema(OutputProjectTeamMemberItemSchema); // ❌ Manual
```

**After:**
```typescript
addSchema(...); // ✅ Auto-registered
```

### 3. Correct Registration Order

**Before:**
```typescript
// ❌ No clear order - might fail if dependencies not registered
export const OutputProjectTeamSchema = Type.Object({
  members: Type.Array(Type.Ref('OutputProjectTeamMemberItemSchema'))
}, { $id: "..." });
```

**After:**
```typescript
// ✅ Clear order - base schema first, then dependent schema
export const OutputProjectTeamMemberItemSchema = addSchema(...); // First
export const OutputProjectTeamSchema = addSchema(...); // After
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
// ✅ Order ensures dependencies exist
export const OutputProjectTeamMemberItemSchema = addSchema(...); // Register first
export const OutputProjectTeamSchema = addSchema(
  Type.Object({
    members: Type.Array(Type.Ref('OutputProjectTeamMemberItemSchema')) // ✅ Already registered
  }, { $id: 'OutputProjectTeamSchema' })
);
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
  // Schemas are registered when imported
  // ...
}
```

## Step-by-Step Migration

1. **Update imports**
   ```typescript
   // Add addSchema
   import { addSchema } from '@tsdiapi/server';
   ```

2. **Replace schema definitions**
   ```typescript
   // Change from:
   export const MySchema = Type.Object({...}, { $id: "MySchema" });
   
   // To:
   export const MySchema = addSchema(
     Type.Object({...}, { $id: 'MySchema' })
   );
   ```

3. **Ensure correct registration order**
   ```typescript
   // ✅ Register base schemas FIRST
   export const ItemSchema = addSchema(...);
   
   // ✅ Register dependent schemas AFTER
   export const ListSchema = addSchema(
     Type.Object({
       items: Type.Array(Type.Ref('ItemSchema'))
     }, { $id: 'ListSchema' })
   );
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
import { Type, Static, addSchema } from '@tsdiapi/server';
import { OutputProjectSchema } from '@generated/typebox-schemas/models/index.js';
import { TeamMemberRole } from '@generated/typebox-schemas/enums/index.js';
import { DateString } from '@tsdiapi/server';

// List schema
export const OutputUserProjectsListSchema = addSchema(
  Type.Object({
    projects: Type.Array(Type.Ref('OutputProjectSchema'))
  }, {
    $id: 'OutputUserProjectsListSchema'
  })
);

// Input schema
export const InputCreateProjectSchema = addSchema(
  Type.Object({
    name: Type.String({ minLength: 1, maxLength: 200 }),
    description: Type.Optional(Type.String({ maxLength: 5000 }))
  }, {
    $id: 'InputCreateProjectSchema'
  })
);

// ✅ STEP 1: Base schema - register FIRST
export const OutputProjectTeamMemberItemSchema = addSchema(
  Type.Object({
    userId: Type.String(),
    email: Type.String(),
    role: TeamMemberRole,
    createdAt: DateString()
  }, {
    $id: 'OutputProjectTeamMemberItemSchema'
  })
);

// ✅ STEP 2: Dependent schema - register AFTER base schema
export const OutputProjectTeamSchema = addSchema(
  Type.Object({
    members: Type.Array(Type.Ref('OutputProjectTeamMemberItemSchema'))
  }, {
    $id: 'OutputProjectTeamSchema'
  })
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
- ✅ **Explicit registration** - Use `addSchema()` - **REQUIRED**
- ✅ **Order matters!** - Register base schemas before dependent schemas
- ✅ **No manual registration** - Auto-registered when imported
- ✅ **Dependency validation** - Order ensures dependencies exist
- ✅ **Cleaner code** - Less boilerplate
- ✅ **Type safety** - Full TypeScript support

**Key Points:**
- Always use `addSchema()` to register schemas
- Register base schemas before dependent schemas
- Use `Type.Ref('SchemaId')` for references
- Remove all manual `fastify.addSchema()` calls

Migrate gradually - `addSchema()` is backward compatible with existing schemas!

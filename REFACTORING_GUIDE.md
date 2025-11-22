# Refactoring Guide: Migration to New Schema System

## Overview

This guide helps you migrate your project to the new schema registration system. The new system provides:
- ✅ Explicit schema registration via `addSchema()` - **REQUIRED**
- ✅ **Order of registration matters!** - Dependencies must be registered first
- ✅ No automatic schema scanning by default (better performance)
- ✅ Use `Type.Ref()` or `refSchema()` for schema references
- ✅ Better error messages with schema details

## Breaking Changes

### 1. Automatic Schema Registration Disabled by Default

**Before:**
```typescript
// Schemas were automatically registered from .schemas.ts files
export const MySchema = Type.Object({...}, { $id: 'MySchema' });
```

**After:**
```typescript
// Must explicitly register schemas with addSchema()
import { addSchema, Type } from '@tsdiapi/server';

export const MySchema = addSchema(
  Type.Object({...}, { $id: 'MySchema' })
);
```

### 2. Schema Registration is Required

**⚠️ IMPORTANT: All schemas MUST be registered with `addSchema()` before use!**

**Before:**
```typescript
import { registerSchema, Ref } from '@tsdiapi/server';

// Registration
export const MySchema = registerSchema(Type.Object({...}), 'MySchema');

// Reference
const ListSchema = Type.Object({
  items: Type.Array(Ref(MySchema))
});
```

**After:**
```typescript
import { addSchema, refSchema, Type } from '@tsdiapi/server';

// Registration - REQUIRED!
export const MySchema = addSchema(
  Type.Object({...}, { $id: 'MySchema' })
);

// Reference - use Type.Ref() or refSchema()
const ListSchema = addSchema(
  Type.Object({
    items: Type.Array(Type.Ref('MySchema')) // ✅ Use Type.Ref() with string ID
    // OR
    // items: Type.Array(refSchema<typeof MySchema>('MySchema')) // ✅ Use refSchema()
  }, { $id: 'ListSchema' })
);
```

### 3. Order of Registration Matters!

**⚠️ CRITICAL: Dependencies must be registered BEFORE schemas that reference them!**

```typescript
import { addSchema, Type } from '@tsdiapi/server';

// ✅ CORRECT ORDER - Base schema first
export const ItemSchema = addSchema(
  Type.Object({
    id: Type.String(),
    name: Type.String()
  }, { $id: 'ItemSchema' })
);

// Then dependent schema
export const ListSchema = addSchema(
  Type.Object({
    items: Type.Array(Type.Ref('ItemSchema')) // ✅ ItemSchema already registered
  }, { $id: 'ListSchema' })
);

// ❌ WRONG ORDER - Will fail!
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

### 3. Routes Require `$id` for All Schemas

**Before:**
```typescript
// Could use schemas without $id
useRoute('project')
  .body(Type.Object({ name: Type.String() })) // ❌ No longer works
  .build();
```

**After:**
```typescript
// Must register schemas with addSchema() first
import { addSchema, Type } from '@tsdiapi/server';

const InputCreateProject = addSchema(
  Type.Object({ name: Type.String() }, { $id: 'InputCreateProject' })
);

useRoute('project')
  .body(InputCreateProject) // ✅ Works - schema is registered
  .build();
```

## Step-by-Step Migration

### Step 1: Enable Legacy Mode (Temporary)

First, enable legacy mode to keep your app working while migrating:

```typescript
// src/main.ts or wherever you call createApp()
import { createApp } from '@tsdiapi/server';

const app = await createApp({
  legacyAutoSchemaRegistration: true // ⚠️ Temporary - for migration
});
```

This allows your existing schemas to work while you migrate.

### Step 2: Find All Schema Files

Find all `.schemas.ts` files in your project:

```bash
# Find all schema files
find . -name "*.schemas.ts" -type f
```

Example locations:
- `src/api/features/**/*.schemas.ts`
- `src/generated/typebox-schemas/**/*.ts`

### Step 3: Migrate Schema Definitions

For each schema file, register schemas with `addSchema()` and ensure correct order:

#### Example 1: Simple Schema

**Before:**
```typescript
// project.schemas.ts
import { Type } from '@sinclair/typebox';

export const OutputProjectSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  description: Type.Optional(Type.String())
}, {
  $id: 'OutputProjectSchema'
});
```

**After:**
```typescript
// project.schemas.ts
import { addSchema, Type } from '@tsdiapi/server';

export const OutputProjectSchema = addSchema(
  Type.Object({
    id: Type.String(),
    name: Type.String(),
    description: Type.Optional(Type.String())
  }, {
    $id: 'OutputProjectSchema'
  })
);
```

#### Example 2: Schema with References

**⚠️ IMPORTANT: Register base schemas FIRST, then dependent schemas!**

**Before:**
```typescript
// project.schemas.ts
import { Type } from '@sinclair/typebox';
import { OutputProjectSchema } from '@generated/typebox-schemas/models/index.js';

export const OutputProjectTeamMemberItemSchema = Type.Object({
  userId: Type.String(),
  email: Type.String(),
  role: Type.String()
}, {
  $id: 'OutputProjectTeamMemberItemSchema'
});

export const OutputProjectTeamSchema = Type.Object({
  members: Type.Array(Type.Ref('OutputProjectTeamMemberItemSchema'))
}, {
  $id: 'OutputProjectTeamSchema'
});
```

**After:**
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
    members: Type.Array(Type.Ref('OutputProjectTeamMemberItemSchema')) // ✅ Use Type.Ref() with string ID
  }, {
    $id: 'OutputProjectTeamSchema'
  })
);
```

#### Example 3: Input Schemas

**Before:**
```typescript
// project.schemas.ts
import { Type } from '@sinclair/typebox';

export const InputCreateProjectSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 200 }),
  description: Type.Optional(Type.String({ maxLength: 5000 }))
}, {
  $id: 'InputCreateProjectSchema'
});
```

**After:**
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

### Step 4: Update Route Definitions

Find all route definitions and ensure they use registered schemas:

#### Example 1: Body Schema

**Before:**
```typescript
// project.controller.load.ts
import { Type } from '@sinclair/typebox';

export default function projectController({ useRoute }: AppContext) {
  useRoute('project')
    .post('/')
    .body(Type.Object({
      name: Type.String(),
      description: Type.Optional(Type.String())
    })) // ❌ No $id
    .build();
}
```

**After:**
```typescript
// project.controller.load.ts
import { InputCreateProjectSchema } from './project.schemas.js';

export default function projectController({ useRoute }: AppContext) {
  useRoute('project')
    .post('/')
    .body(InputCreateProjectSchema) // ✅ Has $id and is registered
    .build();
}
```

#### Example 2: Response Schema

**Before:**
```typescript
// project.controller.load.ts
import { Type } from '@sinclair/typebox';

export default function projectController({ useRoute }: AppContext) {
  useRoute('project')
    .get('/:id')
    .code(200, Type.Object({
      id: Type.String(),
      name: Type.String()
    })) // ❌ No $id
    .build();
}
```

**After:**
```typescript
// project.controller.load.ts
import { OutputProjectSchema } from './project.schemas.js';

export default function projectController({ useRoute }: AppContext) {
  useRoute('project')
    .get('/:id')
    .code(200, OutputProjectSchema) // ✅ Has $id and is registered
    .build();
}
```

### Step 5: Update Imports

Replace old imports with new ones:

**Before:**
```typescript
import { Type } from '@sinclair/typebox';
import { registerSchema, Ref } from '@tsdiapi/server';
```

**After:**
```typescript
import { Type } from '@sinclair/typebox';
import { addSchema, refSchema } from '@tsdiapi/server';
```

### Step 6: Handle Generated Schemas

If you have generated schemas (e.g., from Prisma), they might already have `$id`. You must register them with `addSchema()`:

```typescript
// Generated schemas already have $id
import { addSchema, Type } from '@tsdiapi/server';
import { OutputProjectSchema as GeneratedOutputProjectSchema } from '@generated/typebox-schemas/models/index.js';

// ✅ Register generated schema
export const OutputProjectSchema = addSchema(GeneratedOutputProjectSchema);

// Use in routes
useRoute('project')
  .code(200, OutputProjectSchema) // ✅ Works - schema is registered
  .build();

// Or use in nested schemas - register base schema FIRST!
export const ListSchema = addSchema(
  Type.Object({
    items: Type.Array(Type.Ref('OutputProjectSchema')) // ✅ Use Type.Ref() with string ID
  }, { $id: 'ListSchema' })
);
```

If generated schemas don't have `$id`, add it:

```typescript
import { addSchema, Type } from '@tsdiapi/server';
import { ProjectSchema as GeneratedProjectSchema } from '@generated/typebox-schemas/models/index.js';

// Add $id and register
export const OutputProjectSchema = addSchema(
  Type.Object({
    ...GeneratedProjectSchema.properties
  }, { $id: 'OutputProjectSchema' })
);
```

### Step 7: Test Your Changes

After migrating each file:

1. **Check for errors:**
   ```bash
   npm run build
   # or
   npm run type-check
   ```

2. **Run the server:**
   ```bash
   npm run dev
   ```

3. **Check error messages:**
   - New error messages show schema details
   - Look for "Schema used in route must have $id property"
   - Fix any remaining schemas without `$id`

### Step 8: Disable Legacy Mode

Once all schemas are migrated, disable legacy mode:

```typescript
// src/main.ts
import { createApp } from '@tsdiapi/server';

const app = await createApp({
  // legacyAutoSchemaRegistration: false (default)
  // Remove the option entirely
});
```

## Common Patterns

### Pattern 1: Inline Schema in Route

**Before:**
```typescript
useRoute('user')
  .post('/')
  .body(Type.Object({
    email: Type.String({ format: 'email' }),
    password: Type.String({ minLength: 8 })
  }))
  .build();
```

**After:**
```typescript
// Option 1: Extract to schema file
// user.schemas.ts
export const InputCreateUserSchema = useSchema(
  Type.Object({
    email: Type.String({ format: 'email' }),
    password: Type.String({ minLength: 8 })
  }),
  'InputCreateUserSchema'
);

// user.controller.load.ts
import { InputCreateUserSchema } from './user.schemas.js';

useRoute('user')
  .post('/')
  .body(InputCreateUserSchema)
  .build();

// Option 2: Define inline with useSchema
const InputCreateUserSchema = useSchema(
  Type.Object({
    email: Type.String({ format: 'email' }),
    password: Type.String({ minLength: 8 })
  }),
  'InputCreateUserSchema'
);

useRoute('user')
  .post('/')
  .body(InputCreateUserSchema)
  .build();
```

### Pattern 2: Reusing Schemas

**Before:**
```typescript
// Multiple routes using same schema
useRoute('project')
  .get('/')
  .code(200, OutputProjectSchema)
  .build();

useRoute('project')
  .get('/:id')
  .code(200, OutputProjectSchema) // Same schema
  .build();
```

**After:**
```typescript
// Same - schemas are reusable
useRoute('project')
  .get('/')
  .code(200, OutputProjectSchema)
  .build();

useRoute('project')
  .get('/:id')
  .code(200, OutputProjectSchema) // ✅ Reuses registered schema
  .build();
```

### Pattern 3: Nested Schemas

**⚠️ IMPORTANT: Register base schemas FIRST!**

**Before:**
```typescript
import { Type, Ref } from '@tsdiapi/server';

const ItemSchema = Type.Object({...}, { $id: 'ItemSchema' });
const ListSchema = Type.Object({
  items: Type.Array(Ref(ItemSchema))
}, {
  $id: 'ListSchema'
});
```

**After:**
```typescript
import { addSchema, Type } from '@tsdiapi/server';

// ✅ STEP 1: Register base schema FIRST
const ItemSchema = addSchema(
  Type.Object({...}, { $id: 'ItemSchema' })
);

// ✅ STEP 2: Register dependent schema AFTER
const ListSchema = addSchema(
  Type.Object({
    items: Type.Array(Type.Ref('ItemSchema')) // ✅ Use Type.Ref() with string ID
  }, {
    $id: 'ListSchema'
  })
);
```

## Troubleshooting

### Error: "Schema used in route must have $id property"

**Problem:** Schema doesn't have `$id`.

**Solution:**
1. Check the error message - it shows schema details
2. Find the schema in your code
3. Register it with `addSchema()`:

```typescript
// Before
const MySchema = Type.Object({...});

// After
const MySchema = addSchema(
  Type.Object({...}, { $id: 'MySchema' })
);
```

### Error: "Schema already registered"

**Problem:** Schema with same `$id` registered twice.

**Solution:**
1. Check for duplicate schema definitions
2. Use unique names for each schema
3. Reuse existing schemas instead of creating duplicates

### Error: Schema not found in Swagger

**Problem:** Schema not registered.

**Solution:**
1. Ensure schema is registered with `addSchema()`
2. Check that `$id` is set correctly
3. Verify schema is imported in route file
4. **Check registration order** - dependencies must be registered first!

### Performance Issues

**Problem:** Slow startup after migration.

**Solution:**
1. Ensure `legacyAutoSchemaRegistration: false` (default)
2. Check that all schemas use `addSchema()` explicitly
3. **Register schemas in correct dependency order** - base schemas first!
4. Avoid registering schemas multiple times

## Migration Checklist

- [ ] Enable `legacyAutoSchemaRegistration: true` temporarily
- [ ] Find all `.schemas.ts` files
- [ ] Replace `Type.Object({...}, { $id: '...' })` with `addSchema(Type.Object({...}, { $id: '...' }))`
- [ ] Replace `Ref()` with `Type.Ref('SchemaId')` or `refSchema<typeof Schema>('SchemaId')` for references
- [ ] **Ensure correct registration order** - base schemas registered before dependent schemas
- [ ] Update all route definitions to use registered schemas
- [ ] Update imports (`registerSchema` → `addSchema`, `Ref` → `Type.Ref` or `refSchema`)
- [ ] Test each feature after migration
- [ ] Disable `legacyAutoSchemaRegistration` (remove option)
- [ ] Verify no automatic registration warnings
- [ ] Check Swagger documentation is correct

## Benefits After Migration

✅ **Better Performance** - No file scanning overhead  
✅ **Explicit Control** - Know exactly which schemas are registered  
✅ **Type Safety** - TypeScript ensures schemas exist  
✅ **Better Errors** - Detailed error messages with schema info  
✅ **Cleaner Code** - All registrations visible in code  
✅ **Easier Debugging** - Clear schema references  
✅ **Dependency Management** - Clear order of registration prevents errors  

## Need Help?

If you encounter issues during migration:

1. Check error messages - they now include schema details
2. **Check registration order** - ensure dependencies are registered first
3. Enable legacy mode temporarily to isolate issues
4. Review the [SCHEMA_ID_REQUIREMENT.md](./SCHEMA_ID_REQUIREMENT.md) guide
5. See [REGISTER_SCHEMA_GUIDE.md](./REGISTER_SCHEMA_GUIDE.md) for `addSchema()` examples

Happy refactoring! 🚀


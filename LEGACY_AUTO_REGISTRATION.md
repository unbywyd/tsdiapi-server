# Legacy Auto Schema Registration

## Overview

By default, **automatic schema registration is disabled**. Only schemas explicitly registered via `useSchema()` are registered.

This ensures:
- ✅ **Explicit control** - You know exactly which schemas are registered
- ✅ **Better performance** - No unnecessary file scanning
- ✅ **Clearer code** - All schema registrations are visible in code
- ✅ **Type safety** - TypeScript ensures schemas are properly imported

## Default Behavior (Recommended)

```typescript
import { createApp } from '@tsdiapi/server';

// By default, auto-registration is OFF
const app = await createApp({
  // legacyAutoSchemaRegistration: false (default)
});

// Only schemas registered via useSchema() are available
import { useSchema, Type } from '@tsdiapi/server';

export const MySchema = useSchema(
  Type.Object({ name: Type.String() }),
  'MySchema'
);
```

## Legacy Mode (Backward Compatibility)

If you have existing code that relies on automatic schema scanning, you can enable legacy mode:

```typescript
import { createApp } from '@tsdiapi/server';

// Enable legacy auto-registration
const app = await createApp({
  legacyAutoSchemaRegistration: true // ⚠️ Legacy mode
});
```

When enabled, the system will:
- Scan all `**/*.schemas.ts` files
- Automatically register all schemas with `$id` properties
- Register schemas in dependency order

## Migration Guide

### Step 1: Identify Auto-Registered Schemas

Find all `.schemas.ts` files that export schemas with `$id`:

```typescript
// project.schemas.ts
export const OutputProjectSchema = Type.Object({
  id: Type.String(),
  name: Type.String()
}, {
  $id: 'OutputProjectSchema' // ✅ Has $id - will be auto-registered in legacy mode
});
```

### Step 2: Register Explicitly with useSchema()

Replace manual `$id` definitions with `useSchema()`:

```typescript
// Before (legacy mode)
export const OutputProjectSchema = Type.Object({
  id: Type.String(),
  name: Type.String()
}, {
  $id: 'OutputProjectSchema'
});

// After (recommended)
import { useSchema, Type } from '@tsdiapi/server';

export const OutputProjectSchema = useSchema(
  Type.Object({
    id: Type.String(),
    name: Type.String()
  }),
  'OutputProjectSchema' // ✅ Explicit registration
);
```

### Step 3: Remove Legacy Option

Once all schemas are explicitly registered, remove the legacy option:

```typescript
// Before
const app = await createApp({
  legacyAutoSchemaRegistration: true
});

// After
const app = await createApp({
  // legacyAutoSchemaRegistration: false (default)
});
```

## Benefits of Explicit Registration

### 1. Better Performance

- No file system scanning
- Faster startup time
- Lower memory usage

### 2. Clearer Code

```typescript
// ✅ Clear - you see exactly what's registered
export const MySchema = useSchema(Type.Object({...}), 'MySchema');

// ❌ Unclear - where is this schema registered?
export const MySchema = Type.Object({...}, { $id: 'MySchema' });
```

### 3. Type Safety

```typescript
// ✅ TypeScript ensures schema is imported
import { MySchema } from './schemas.js';
useRoute('project').body(MySchema);

// ❌ No type checking - schema might not exist
useRoute('project').body(Type.Ref('MySchema'));
```

### 4. Better Error Messages

```typescript
// ✅ Clear error if schema not registered
useRoute('project').body(MySchema); // Error: Schema must have $id

// ❌ Unclear error in legacy mode
useRoute('project').body(Type.Ref('MySchema')); // Error: Schema not found
```

## When to Use Legacy Mode

Use legacy mode only if:
- ✅ You have existing code that relies on auto-registration
- ✅ You're migrating gradually
- ✅ You need backward compatibility

**Do NOT use legacy mode for:**
- ❌ New projects
- ❌ New features
- ❌ Performance-critical applications

## Summary

- **Default**: Auto-registration is **OFF** ✅
- **Legacy mode**: Enable with `legacyAutoSchemaRegistration: true` ⚠️
- **Recommended**: Use `useSchema()` for explicit registration ✅
- **Migration**: Replace manual `$id` with `useSchema()` calls

Explicit is better than implicit!


# Prisma Integration with TSDIAPI

## 🚀 Quick Start

1. **Add Prisma Plugin**:
   ```bash
   tsdiapi plugins add prisma
   ```
   This will automatically:
   - Install Prisma and its dependencies
   - Set up database connection
   - Configure the necessary files

2. **Run Initial Migration**:
   ```bash
   prisma migrate dev
   ```

## 🔄 Database Migrations

After any changes to the Prisma schema:
```bash
prisma migrate dev
```

## 📦 TypeBox Schema Generation

Prisma models are automatically converted to TypeBox schemas using `prisma-fastify-typebox-generator`. This allows you to use these schemas in your routing definitions.

### Example Usage in Routing
```typescript
import { Type } from "@sinclair/typebox";
import { UserSchema } from "@generated/prisma/typebox"; // Auto-generated TypeBox schemas

export default function userController({ useRoute }: AppContext) {
  useRoute()
    .post("/users")
    .body(UserSchema) // Use the generated schema
    .code(201, UserSchema)
    .handler(async (req) => {
      const prisma = usePrisma();
      const user = await prisma.user.create({
        data: req.body
      });
      return { status: 201, data: user };
    })
    .build();
}
```

## 🛠 PrismaQL for Schema Management

PrismaQL provides a safe way to modify your Prisma schema. It automatically creates backups and handles migrations safely.

### Basic Commands
```bash
# Add a new model
prismaql "ADD MODEL User ({ name String });"

# Add a field
prismaql "ADD FIELD email TO User ({String});"

# View models
prismaql "GET MODELS"
```

## 🔌 Plugin Integration

### Basic Setup
```typescript
import { PrismaClient } from "@generated/prisma/client.js";
import { createApp } from "@tsdiapi/server";
import PrismaPlugin from "@tsdiapi/prisma";

createApp({
  plugins: [PrismaPlugin({ client: PrismaClient })]
});
```

## ⚠️ Important Notes

1. **Prisma Client Access**:
   - Use `usePrisma()` only within route handlers
   - Available after server initialization
   - For global access, use `fastify.prisma` (requires type assertion)

2. **Type Safety**:
   ```typescript
   // In route handlers
   const prisma = usePrisma<PrismaClient>();
   
   // Global access
   const prisma = fastify.prisma as PrismaClient;
   ```

3. **Prisma Client Location**:
   - Starting from Prisma 6.6, client is generated in project root
   - Import path: `@generated/prisma/client.js`

## 🔄 Workflow

1. Add/update Prisma schema using PrismaQL
2. Run migrations: `prisma migrate dev`
3. Use generated TypeBox schemas in routes
4. Access Prisma client in route handlers

## 📚 Additional Resources

- [Prisma Fastify TypeBox Generator](https://www.npmjs.com/package/prisma-fastify-typebox-generator)
- [PrismaQL Documentation](https://www.npmjs.com/package/prismaql)
- [Prisma Schema Generator UI](https://prisma-dto-generator.netlify.app/) 
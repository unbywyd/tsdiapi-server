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

Prisma models are automatically converted to TypeBox schemas. These schemas are generated in the `@generated/typebox-schemas/models/` directory and can be used in your routing definitions.

### Example Usage in Routing
```typescript
import { OutputTsdiapiSchema } from "@generated/typebox-schemas/models/OutputTsdiapiSchema.model.js";

export default function FeatureModule({ useRoute }: AppContext): void {
    useRoute("feature")
        .get("/text")
        .code(200, OutputTsdiapiSchema)
        .handler(async () => {
            // Your handler logic here
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
import { createApp } from "@tsdiapi/server";
import PrismaPlugin from "@tsdiapi/prisma";

createApp({
  plugins: [PrismaPlugin()]
});
```

## ⚙️ Service Usage Example

```typescript
import { Service } from "typedi";
import { usePrisma } from "@tsdiapi/prisma";
import { PrismaClient } from "@generated/prisma/client.js";

@Service()
export default class FeatureService {
    async getHello(): Promise<string> {
        const prisma = usePrisma<PrismaClient>();
        const count = await prisma.tsdiapi.count();
        return "Hello World";
    }
}
```

## ⚠️ Important Notes

1. **Prisma Client Access**:
   - Use `usePrisma()` only within route handlers or services
   - Available after server initialization
   - For global access, use `fastify.prisma` (requires type assertion)

2. **Type Safety**:
   ```typescript
   // In route handlers or services
   const prisma = usePrisma<PrismaClient>();
   
   // Global access
   const prisma = fastify.prisma as PrismaClient;
   ```

3. **TypeBox Schemas Location**:
   - Schemas are generated in `@generated/typebox-schemas/models/`
   - Import path format: `@generated/typebox-schemas/models/YourSchema.model.js`

## 🔄 Workflow

1. Add/update Prisma schema using PrismaQL
2. Run migrations: `prisma migrate dev`
3. Use generated TypeBox schemas from `@generated/typebox-schemas/models/` in routes
4. Access Prisma client in route handlers or services using `usePrisma<PrismaClient>()`

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeBox Documentation](https://github.com/sinclairzx81/typebox)
- [Prisma Schema Generator UI](https://prisma-dto-generator.netlify.app/) 
# TSDIAPI Server

A modern, **ESM-based**, modular TypeScript server built on **Fastify** and **TypeBox**.  
Designed for **performance**, **flexibility**, and **extensibility**, it provides a solid foundation for API development with minimal complexity.

## 🚀 Quick Start

1. **Create a new project using CLI**:

   ```bash
   npx @tsdiapi/cli create app
   ```

2. **Navigate into the project**:

   ```bash
   cd app
   ```

3. **Start the server**:
   ```bash
   npm run dev
   ```

Your API is now running! 🎉 Open the browser and check **Swagger UI** at:  
👉 `http://localhost:3000/docs`

---

## 🛠 Features

✅ **Fastify Core** – High-performance HTTP server  
✅ **ESM Support** – Modern ECMAScript modules
✅ **TypeScript** – Strongly-typed language
✅ **TypeBox Validation** – Type-safe request validation  
✅ **Modular Structure** – Auto-load controllers and services  
✅ **Swagger API Docs** – Auto-generated OpenAPI documentation  
✅ **CORS & Security** – Preconfigured CORS & Helmet support  
✅ **File Upload Support** – Handles multipart/form-data  
✅ **Plugin System** – Easily extend with plugins
✅ **Prisma Integration** – Seamless database integration with TypeBox schemas

---

## 📦 Database Integration

TSDIAPI provides seamless integration with **Prisma ORM**:

- **Type-Safe Database Access** – Full TypeScript support with Prisma Client
- **Auto-Generated TypeBox Schemas** – Convert Prisma models to TypeBox schemas
- **Safe Schema Management** – Use PrismaQL for schema modifications
- **Automatic Migrations** – Easy database versioning

To get started with Prisma, see:  
👉 [Prisma Integration Guide](./readme.prisma.md)

---

## 🎯 Defining API Routes

Define routes using `useRoute()` inside a controller:

### Basic Route Example
```ts
import { AppContext } from "@tsdiapi/server";
import { Type } from "@sinclair/typebox";

export default function userController({ useRoute }: AppContext) {
  useRoute()
    .get("/users/:id")
    .params(Type.Object({ id: Type.String() }))
    .code(200, Type.Object({ id: Type.String(), name: Type.String() }))
    .handler(async (req) => {
      return {
        status: 200,
        data: { id: req.params.id, name: "John Doe" },
      };
    })
    .build();
}
```

### Complete CRUD Example
```ts
export default function userController({ useRoute }: AppContext) {
  // Create user
  useRoute()
    .post("/users")
    .body(Type.Object({
      name: Type.String(),
      email: Type.String({ format: "email" }),
      age: Type.Number({ minimum: 0 })
    }))
    .code(201, Type.Object({
      id: Type.String(),
      name: Type.String(),
      email: Type.String()
    }))
    .handler(async (req) => {
      const user = await createUser(req.body);
      return { status: 201, data: user };
    })
    .build();

  // Get user
  useRoute()
    .get("/users/:id")
    .params(Type.Object({ id: Type.String() }))
    .code(200, Type.Object({
      id: Type.String(),
      name: Type.String(),
      email: Type.String()
    }))
    .code(404, Type.Object({
      error: Type.String()
    }))
    .handler(async (req) => {
      const user = await getUser(req.params.id);
      if (!user) {
        return { status: 404, data: { error: "User not found" } };
      }
      return { status: 200, data: user };
    })
    .build();
}
```

### Protected Route Example
```ts
export default function adminController({ useRoute }: AppContext) {
  useRoute()
    .get("/admin/dashboard")
    .code(401, Type.Object({
      error: Type.String()
    }))
    .code(200, Type.Object({
      stats: Type.Object({
        users: Type.Number(),
        revenue: Type.Number()
      })
    }))
    .auth("bearer", async (req) => {
      const isValid = await validateToken(req.headers.authorization);
      if (!isValid) {
        return { status: 401, data: { error: "Invalid token" } };
      }
      return true;
    })
    .handler(async (req) => {
      const stats = await getDashboardStats();
      return { status: 200, data: { stats } };
    })
    .build();
}
```

### File Upload Example
```ts
export default function uploadController({ useRoute }: AppContext) {
  useRoute()
    .post("/upload")
    .code(200, Type.Object({
      url: Type.String()
    }))
    .acceptMultipart()
    .body(Type.Object({
      file: Type.String({ format: "binary" }),
      metadata: Type.Object({
        title: Type.String()
      })
    }))
    .fileOptions({
      maxFileSize: 1024 * 1024 * 5, // 5MB
      accept: ["image/jpeg", "image/png"]
    }, "file")
    .handler(async (req) => {
      const url = await uploadFile(req.body.file);
      return { status: 200, data: { url } };
    })
    .build();
}
```

For more detailed routing documentation, see:  
👉 [Routing Documentation](./readme.routing.md)

---

## ⚙️ Configuration

TSDIAPI automatically loads `.env` variables.  
Example `.env` file:

```
PORT=3000
HOST=localhost
```

---

## 🔌 Plugins

Extend functionality using plugins:

```ts
import { createApp } from "@tsdiapi/server";
import prismaPlugin from "@tsdiapi/prisma";

await createApp({
  plugins: [prismaPlugin()],
});
```

---

## �� Documentation

- [Configuration Guide](./readme.createapp.md)
- [Routing Documentation](./readme.routing.md)
- [Prisma Integration](./readme.prisma.md)

---

## 🛠 Commands

| Command                       | Description          |
| ----------------------------- | -------------------- |
| `npx @tsdiapi/cli create app` | Create a new project |
| `npm run dev`                 | Start the server     |
| `npm run build`               | Build the project    |

---

## 📜 License

TSDIAPI Server is **MIT Licensed**.  
Contributions are welcome! 🚀

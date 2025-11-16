# TSDIAPI Server

A modern, **ESM-based**, modular TypeScript server built on **Fastify** and **TypeBox**.  
Designed for **performance**, **flexibility**, and **extensibility**, it provides a solid foundation for API development with minimal complexity.

**Version**: `0.3.5` | **API Version**: `v1` | **Node.js**: `20.x`

📚 **Documentation**: For detailed documentation, visit [https://tsdiapi.com/](https://tsdiapi.com/)


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
✅ **Request Context** – Request-scoped storage for sharing data across handlers

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

## 📦 Request Context

Request Context provides request-scoped storage for sharing data across handlers, middleware, and services without passing it explicitly.

### Basic Usage Example

```ts
import { AppContext } from "@tsdiapi/server";
import { 
  getRequestContextValue, 
  setRequestContextValue 
} from "@tsdiapi/server";
import { Type } from "@sinclair/typebox";

export default function userController({ useRoute }: AppContext) {
  // Authentication middleware sets user in context
  useRoute()
    .get("/users/me")
    .code(200, Type.Object({
      id: Type.String(),
      name: Type.String(),
      email: Type.String()
    }))
    .code(401, Type.Object({
      error: Type.String()
    }))
    .guard(async (req) => {
      // Authenticate user and store in context
      const token = req.headers.authorization;
      const user = await authenticateUser(token);
      
      if (!user) {
        return { status: 401, data: { error: "Unauthorized" } };
      }
      
      // Store user in request context
      setRequestContextValue("user", user);
      return true;
    })
    .handler(async (req) => {
      // Retrieve user from context (no need to pass through params)
      const user = getRequestContextValue("user");
      return { status: 200, data: user };
    })
    .build();
}
```

### Using Context in Services

```ts
import { Service } from "typedi";
import { getRequestContextValue } from "@tsdiapi/server";

@Service()
export class UserService {
  async getCurrentUser() {
    // Access context from anywhere in the request chain
    const user = getRequestContextValue("user");
    if (!user) {
      throw new Error("User not authenticated");
    }
    return user;
  }
  
  async getUserId(): string {
    const user = getRequestContextValue("user");
    return user?.id;
  }
}

// In your controller
export default function profileController({ useRoute }: AppContext) {
  useRoute()
    .get("/profile")
    .handler(async (req) => {
      const userService = Container.get(UserService);
      const user = await userService.getCurrentUser();
      return { status: 200, data: user };
    })
    .build();
}
```

### Request ID for Logging

```ts
import { getRequestContextValue } from "@tsdiapi/server";

export default function loggingController({ useRoute }: AppContext) {
  useRoute()
    .post("/data")
    .handler(async (req) => {
      // Request ID is automatically available in context
      const requestId = getRequestContextValue<string>("requestId");
      
      logger.info("Processing request", {
        requestId,
        url: req.url,
        method: req.method
      });
      
      // Your business logic here
      return { status: 200, data: { success: true } };
    })
    .build();
}
```

### Storing Request-Specific Data

```ts
export default function cacheController({ useRoute }: AppContext) {
  useRoute()
    .get("/expensive-operation")
    .handler(async (req) => {
      // Check cache in context
      const cached = getRequestContextValue("cachedResult");
      if (cached) {
        return { status: 200, data: cached };
      }
      
      // Perform expensive operation
      const result = await expensiveOperation();
      
      // Store in context for this request
      setRequestContextValue("cachedResult", result);
      
      return { status: 200, data: result };
    })
    .build();
}
```

**Key Features:**
- ✅ **Automatic Isolation** – Each request has its own isolated context
- ✅ **Async-Safe** – Works correctly with async/await and promises
- ✅ **Type-Safe** – Full TypeScript support with type inference
- ✅ **No Memory Leaks** – Context is automatically cleaned up after request

For complete Request Context documentation, see:  
👉 [Request Context Documentation](./readme.request-context.md)

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

## 📌 Version Information

Access package and API version programmatically:

```ts
import { VERSION, API_VERSION } from "@tsdiapi/server";

console.log(`Package version: ${VERSION}`);    // "0.3.5"
console.log(`API version: ${API_VERSION}`);     // "v1"

// Use in your routes
export default function versionController({ useRoute }: AppContext) {
  useRoute()
    .get("/version")
    .code(200, Type.Object({
      package: Type.String(),
      api: Type.String(),
      node: Type.String()
    }))
    .handler(async () => {
      return {
        status: 200,
        data: {
          package: VERSION,
          api: API_VERSION,
          node: process.version
        }
      };
    })
    .build();
}
```

---

## �� Documentation

- [Configuration Guide](./readme.createapp.md)
- [Routing Documentation](./readme.routing.md)
- [Prisma Integration](./readme.prisma.md)
- [Request Context](./readme.request-context.md)

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

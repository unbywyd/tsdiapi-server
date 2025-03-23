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

---


## 🎯 Defining API Routes

Define routes using `useRoute()` inside a controller:

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

## 📖 Documentation & Swagger

Auto-generated API docs available at:  
👉 `http://localhost:3000/docs`

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

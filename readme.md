# TSDIAPI: Modular TypeScript API Framework

TSDIAPI is a modern, scalable, and modular framework for building APIs using TypeScript, Express, and TypeDI. It simplifies backend development with built-in support for dependency injection, structured routing, and plugin-based extensibility.

---

## Key Features

- **Dependency Injection (DI):** Powered by `TypeDI`, ensuring clean and testable architecture.
- **Modular Plugin System:** Extend core functionality with plugins like `tsdiapi-io` (WebSocket) and `tsdiapi-cron` (task scheduling).
- **Routing Simplified:** Declarative route handling using `routing-controllers`.
- **Validation & Transformation:** Leverage `class-validator` and `class-transformer` for data validation and conversion.
- **OpenAPI Documentation:** Auto-generate API docs with Swagger support.
- **Middleware Support:** Preconfigured `helmet`, `morgan`, and CORS for security and logging.
- **Environment Configuration:** Fully configurable via `.env` files and dynamic config management.

---

## Getting Started

### Installation

1. **Initialize a New Project:**
   Use the `tsdiapi-cli` tool to create and set up a new project:

   ```bash
   npx tsdiapi init
   ```


## How It Works

### Core Architecture

1. **Dependency Injection (DI):**
   All controllers, services, and middleware are registered via `TypeDI`.

2. **Plugins:**
   Add plugins to extend functionality. Plugins integrate seamlessly into the application lifecycle (e.g., initialization, pre-start, post-start).

3. **Scalable Structure:**
   Projects are organized into distinct directories for features, controllers, services, and plugins.

---

## Example Setup

### Basic Server Setup

```typescript
import { createApp } from "tsdiapi-server";

createApp({
  plugins: [
    // Add your plugins here
  ],
});
```

### Plugin Example: WebSockets

Install the `tsdiapi-io` plugin for WebSocket support:

```bash
npm install tsdiapi-io
```

Then, integrate it into your server:

```typescript
import { createApp } from "tsdiapi";
import ioPlugin from "tsdiapi-io";

createApp({
  plugins: [
    ioPlugin()
  ],
});
```

---

## Features Overview

### Plugins

- **WebSockets:** Real-time communication using `tsdiapi-io`.
- **Task Scheduling:** Manage cron jobs with `tsdiapi-cron`.
- **Prisma Integration:** Seamlessly connect to a Prisma database with `tsdiapi-prisma`.

### Lifecycle Hooks

Plugins can hook into these lifecycle stages:

- `onInit`: Perform setup tasks.
- `beforeStart`: Configure or validate before the server starts.
- `afterStart`: Execute tasks after the server begins listening.

### Controllers & Services

- Use `routing-controllers` for declarative route handling.
- Manage business logic with DI-based services.

---

## Summary

TSDIAPI offers a clean, modular foundation for building modern APIs. It reduces boilerplate, promotes scalability, and simplifies integration with tools like WebSockets, task schedulers, and more. Build better APIs with less effort!
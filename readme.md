# TSDIAPI-Server: A Modular TypeScript API Framework

TSDIAPI-Server is a scalable and modular API framework built with TypeScript, Express, and TypeDI. It is designed to provide flexibility and structure for modern backend applications, enabling easy integration of plugins for extended functionality.

---

## Key Features

- **Dependency Injection (DI):** Built-in support for `TypeDI` ensures a clean and maintainable architecture with dependency injection for controllers, services, and more.
- **Modular Plugin System:** Extend the framework with plugins like `tsdiapi-io` for WebSocket integration or `tsdiapi-cron` for task scheduling.
- **Routing Controllers:** Simplify route definitions with `routing-controllers` for declarative and structured REST API development.
- **Class Validation and Transformation:** Leverage `class-validator` and `class-transformer` for schema validation and data conversion.
- **Swagger Documentation:** Automatically generate OpenAPI-compliant API documentation.
- **Environment Configuration:** Fully configurable via `dotenv` and flexible config files.
- **Middleware and Security:** Built-in support for middleware like `helmet`, `morgan`, and CORS.

---

## Architecture Overview

1. **Dependency Injection (DI):**

   - All controllers, services, and middleware are managed via `TypeDI`, allowing for easy testing and loose coupling.

2. **Plugins:**

   - Plugins can hook into the framework lifecycle (`onInit`, `beforeStart`, `afterStart`) and provide additional functionality like:
     - WebSocket integration (`tsdiapi-io`)
     - Cron job management (`tsdiapi-cron`)

3. **Separation of Concerns:**

   - Controllers handle routing and HTTP requests.
   - Services encapsulate business logic.
   - Plugins extend the functionality (e.g., WebSockets, cron jobs).

4. **Scalable Structure:**
   - Separate directories for controllers, services, and plugins.
   - Dynamic loading of controllers, services, and middlewares using glob patterns.

---

## Getting Started

1. **Install Core Dependencies:**

   ```bash
   npm install tsdiapi-server
   ```

2. **Add Plugins as Needed:**
   For WebSocket or Cron support, install and configure the corresponding plugins:

   - `tsdiapi-io`
   - `tsdiapi-cron`

3. **Create Your Application:**
   Use the `createApp` function to initialize the server and register plugins.

   ```typescript
   import { createApp } from "./app";

   createApp({
     plugins: [
       // Add plugins here
     ],
   });
   ```

---

## Extending Functionality

### Plugins

Add plugins to support additional features like:

- **WebSockets:** Use `tsdiapi-io` for WebSocket support with `Socket.IO`.
- **Task Scheduling:** Use `tsdiapi-cron` to define and manage cron jobs.

### Lifecycle Hooks

Plugins can hook into the following lifecycle stages:

- `onInit`: Called during the initialization phase.
- `beforeStart`: Called before the server starts.
- `afterStart`: Called after the server starts and begins listening for requests.

---

## Example Plugins

1. **WebSocket Plugin (`tsdiapi-io`):** Adds WebSocket support.
2. **Cron Plugin (`tsdiapi-cron`):** Manages scheduled tasks.

---

## Core Components

1. **Controllers:**
   Define routes and their handlers using `routing-controllers`.
2. **Services:**
   Encapsulate reusable business logic with DI via `TypeDI`.
3. **Plugins:**
   Extend the framework with additional features (e.g., WebSocket, Cron).

---

## Summary

TSDIAPI-Server provides a flexible foundation for building modern APIs with modularity and extensibility at its core. Use it to create scalable, well-structured applications with minimal configuration and maximum control.

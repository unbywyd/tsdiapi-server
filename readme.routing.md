# TSDI API Routing Documentation

## Table of Contents
- [Basic Usage](#basic-usage)
- [Route Configuration](#route-configuration)
- [HTTP Methods](#http-methods)
- [Request/Response Schemas](#requestresponse-schemas)
- [Hooks](#hooks)
- [Guards](#guards)
- [File Uploads](#file-uploads)
- [Response Headers](#response-headers)
- [Response Formats](#response-formats)
- [Swagger Documentation](#swagger-documentation)
- [Authentication](#authentication)
- [Resolvers](#resolvers)
- [Examples](#examples)

## Basic Usage

The routing system is built on top of Fastify and provides a type-safe, fluent API for defining routes. The API is **compositional**, meaning you can chain methods to build complex routes step by step. Here's a basic example:

```typescript
export default function FeatureModule({useRoute}: AppContext): void {
    useRoute("feature")
        .get("/")
        // Always register response schemas after HTTP method
        .code(200, Type.Object({
            message: Type.String()
        }))
        .code(401, Type.Object({
            error: Type.String()
        }))
        .code(403, Type.Object({
            error: Type.String()
        }))
        .handler(async (req, res) => {
            const service = Container.get(FeatureService);
            const hello = await service.getHello();
            return {
                status: 200,
                data: {
                    message: hello
                }
            }
        })
        .build();
}
```

### About build() method
The `build()` method is a crucial part of route definition. It:
1. Finalizes the route configuration
2. Registers the route in the Fastify instance
3. Validates the route configuration
4. Applies all middleware and hooks
5. Sets up request/response schemas

**Important**: Every route definition must end with `.build()` to be registered and become active.

## Route Configuration

### Controller and URL
```typescript
useRoute("feature")  // Sets controller name
    .get("/users")   // Sets URL path
    .code(200, Type.Object({  // Register success response
        users: Type.Array(Type.Object({
            id: Type.String(),
            name: Type.String()
        }))
    }))
    .code(404, Type.Object({  // Register error response
        error: Type.String()
    }))
    .build();        // Don't forget to build!
```

### Prefix and Version
```typescript
useRoute("feature")
    .prefix("/api")  // Sets route prefix
    .version("1")    // Sets API version
    .get("/status")
    .code(200, Type.Object({
        status: Type.String()
    }))
    .build();        // Don't forget to build!
```

## HTTP Methods

The routing system supports the following HTTP methods. After each method, you should register response schemas using `.code()`:

- `.get(path?: string)` - GET request
- `.post(path?: string)` - POST request
- `.put(path?: string)` - PUT request
- `.delete(path?: string)` - DELETE request
- `.patch(path?: string)` - PATCH request
- `.options(path?: string)` - OPTIONS request

### Example Usage
```typescript
useRoute("feature")
    .get("/users")           // GET /users
    .code(200, Type.Object({ /* success schema */ }))
    .code(404, Type.Object({ /* error schema */ }))
    .build();
```

## Request/Response Schemas

### Request Parameters with Validation
```typescript
useRoute("feature/:id")
    .get("/")
    .code(200, Type.Object({
        id: Type.String(),
        name: Type.String()
    }))
    .code(404, Type.Object({
        error: Type.String()
    }))
    .params(Type.Object({
        id: Type.String({
            pattern: "^[0-9a-fA-F]{24}$" // MongoDB ObjectId pattern
        })
    }))
    .build();
```

### Request Body with Nested Objects
```typescript
useRoute("feature")
    .post("/")
    .code(201, Type.Object({
        id: Type.String(),
        name: Type.String()
    }))
    .code(400, Type.Object({
        errors: Type.Array(Type.String())
    }))
    .body(Type.Object({
        name: Type.String(),
        age: Type.Number({
            minimum: 0,
            maximum: 120
        }),
        address: Type.Object({
            street: Type.String(),
            city: Type.String(),
            zip: Type.String({
                pattern: "^\\d{5}(-\\d{4})?$"
            })
        }),
        preferences: Type.Array(Type.String())
    }))
    .build();
```

### Query Parameters with Optional Fields
```typescript
useRoute("feature")
    .get("/")
    .code(200, Type.Object({
        data: Type.Array(Type.Object({
            id: Type.String(),
            name: Type.String()
        })),
        meta: Type.Object({
            total: Type.Number(),
            page: Type.Number(),
            pages: Type.Number()
        })
    }))
    .code(400, Type.Object({
        errors: Type.Array(Type.String())
    }))
    .query(Type.Object({
        page: Type.Number({
            minimum: 1
        }),
        limit: Type.Number({
            minimum: 1,
            maximum: 100
        }),
        search: Type.Optional(Type.String()),
        sort: Type.Optional(Type.String({
            enum: ["asc", "desc"]
        }))
    }))
    .build();
```

### Response Codes with Detailed Schemas
```typescript
useRoute("feature")
    .code(200, Type.Object({
        data: Type.Array(Type.Object({
            id: Type.String(),
            name: Type.String(),
            createdAt: Type.String({ format: "date-time" })
        })),
        meta: Type.Object({
            total: Type.Number(),
            page: Type.Number(),
            pages: Type.Number()
        })
    }))
    .code(400, Type.Object({
        errors: Type.Array(Type.Object({
            field: Type.String(),
            message: Type.String()
        }))
    }))
    .code(401, Type.Object({
        error: Type.String(),
        code: Type.String()
    }))
    .code(403, Type.Object({
        error: Type.String(),
        code: Type.String()
    }))
    .code(404, Type.Object({
        error: Type.String(),
        code: Type.String()
    }))
    .build();
```

## Hooks

### Pre-Validation with Typed Request
```typescript
useRoute("feature")
    .preValidation(async (req, res) => {
        // Validate request before handler
        // req is fully typed with all schemas
    })
    .build();
```

## Guards

Guards are used to protect routes and can return either a boolean or a response object:

```typescript
useRoute("feature")
    // Register all possible guard responses BEFORE the guard
    .code(401, Type.Object({
        error: Type.String()
    }))
    .code(403, Type.Object({
        error: Type.String()
    }))
    .guard(async (req, res) => {
        if (!req.headers.authorization) {
            return {
                status: 401,
                data: { error: "Unauthorized" }
            };
        }
        return true;
    })
    .build();
```

## File Uploads

### Basic File Upload with Typing
```typescript
useRoute("feature")
    .acceptMultipart()
    // Register body schema with binary format for each file field
    .body(Type.Object({
        avatar: Type.String({ format: "binary" }),
        document: Type.String({ format: "binary" }),
        metadata: Type.Object({
            title: Type.String(),
            description: Type.String()
        })
    }))
    // Register file options for each file field
    .fileOptions({
        maxFileSize: 1024 * 1024 * 5, // 5MB
        accept: ["image/jpeg", "image/png"]
    }, "avatar")
    .fileOptions({
        maxFileSize: 1024 * 1024 * 10, // 10MB
        accept: ["application/pdf", "application/msword"]
    }, "document")
    .code(200, Type.Object({
        urls: Type.Object({
            avatar: Type.String(),
            document: Type.String()
        })
    }))
    .code(400, Type.Object({
        errors: Type.Array(Type.String())
    }))
    .handler(async (req, res) => {
        // Handle uploaded files
        const avatar = req.body.avatar;
        const document = req.body.document;
        const metadata = req.body.metadata;
        // ... process files
    })
    .build();
```

## Response Headers

### Custom Headers with Typing
```typescript
useRoute("feature")
    .responseHeader("X-Custom-Header", "value", 200)
    .code(200, Type.Object({
        data: Type.Any()
    }))
    .build();
```

## Response Formats

The routing system supports various response formats. Here's how to use them:

### JSON Response (default)
```typescript
useRoute("feature")
    .get("/data")
    .json() // Optional, as JSON is default
    .code(200, Type.Object({
        data: Type.Any()
    }))
    .handler(async (req, res) => {
        return {
            status: 200,
            data: { message: "Hello" }
        };
    })
    .build();
```

### Binary Response (for file downloads)
```typescript
useRoute("feature")
    .get("/download")
    .binary()
    .handler(async (req, res) => {
        const fileBuffer = await getFileBuffer();
        return fileBuffer;
    })
    .build();
```

### Text Response
```typescript
useRoute("feature")
    .get("/text")
    .text()
    .handler(async (req, res) => {
        return "Hello, world!";
    })
    .build();
```

### Raw Response with Custom Content Type
```typescript
useRoute("feature")
    .get("/xml")
    .rawResponse("application/xml")
    .handler(async (req, res) => {
        return "<root><message>Hello</message></root>";
    })
    .build();
```

### Multipart Response
```typescript
useRoute("feature")
    .get("/multipart")
    .multipart()
    .handler(async (req, res) => {
        return {
            file1: await getFileBuffer1(),
            file2: await getFileBuffer2()
        };
    })
    .build();
```

### Setting Acceptable Content Types
```typescript
useRoute("feature")
    .get("/formats")
    .consumes(["application/json", "application/xml"])
    .code(200, Type.Object({
        message: Type.String()
    }))
    .handler(async (req, res) => {
        return {
            status: 200,
            data: { message: "Hello" }
        };
    })
    .build();
```

## Swagger Documentation

You can enhance your API documentation in Swagger using the following methods:

### Basic Documentation
```typescript
useRoute("feature")
    .get("/users")
    .summary("Get all users")  // Short description shown in Swagger UI
    .description("Retrieves a list of all users in the system with their basic information")  // Detailed description
    .tags(["Users", "Management"])  // Group routes in Swagger UI
    .code(200, Type.Object({
        users: Type.Array(Type.Object({
            id: Type.String(),
            name: Type.String()
        }))
    }))
    .handler(async (req, res) => {
        // ... handler implementation
    })
    .build();
```

### Complete Example with Documentation
```typescript
useRoute("users")
    .post("/")
    .summary("Create new user")
    .description(`
        Creates a new user in the system.
        
        Required permissions:
        - user.create
        
        Rate limiting:
        - 10 requests per minute
    `)
    .tags(["Users", "Management"])
    .code(201, Type.Object({
        id: Type.String(),
        name: Type.String(),
        email: Type.String()
    }))
    .code(400, Type.Object({
        errors: Type.Array(Type.String())
    }))
    .body(Type.Object({
        name: Type.String(),
        email: Type.String(),
        password: Type.String()
    }))
    .handler(async (req, res) => {
        // ... handler implementation
    })
    .build();
```

## Authentication

The routing system supports different types of authentication with built-in Swagger documentation:

### Bearer Token Authentication
```typescript
useRoute("feature")
    .get("/protected")
    .auth("bearer", async (req, res) => {
        const isValid = await isBearerValid(req);
        if (!isValid) {
            return {
                status: 403,
                data: { error: "Invalid access token" }
            };
        }
        return true;
    })
    .code(200, Type.Object({
        data: Type.Any()
    }))
    .code(403, Type.Object({
        error: Type.String()
    }))
    .handler(async (req, res) => {
        // Protected route handler
    })
    .build();
```

### Basic Authentication
```typescript
useRoute("feature")
    .get("/basic-protected")
    .auth("basic", async (req, res) => {
        // Basic auth validation
        return true;
    })
    .build();
```

### API Key Authentication
```typescript
useRoute("feature")
    .get("/api-key-protected")
    .auth("apiKey", async (req, res) => {
        // API key validation
        return true;
    })
    .build();
```

## Resolvers

Resolvers allow you to pre-process and validate data before it reaches the handler. They can return either the resolved data or an error response:

```typescript
useRoute("feature")
    .get("/:id")
    .code(200, Type.Object({
        data: Type.Any()
    }))
    .code(401, Type.Object({
        error: Type.String()
    }))
    .params(Type.Object({
        id: Type.String()
    }))
    .resolve<Session>(async (req) => {
        const sessionId = req.params.id;
        try {
            const session = await client.session.findUnique({
                where: { id: sessionId }
            });
            if (!session) {
                throw new Error("Session not found");
            }
            if (!session.isActive) {
                throw new Error("Session is not active");
            }
            return session;
        } catch (e) {
            return {
                status: 401,
                data: { error: e.message }
            };
        }
    })
    .handler(async (req, res) => {
        // Access resolved data via req.routeData
        const session = req.routeData;
        // ... handler implementation
    })
    .build();
```

### Resolver Features
- Type-safe with generic type parameter
- Can return either resolved data or error response
- Resolved data is available in handler via `req.routeData`
- Can be used for:
  - Data validation
  - Permission checks
  - Resource loading
  - Complex business logic validation

## Examples

### Complete CRUD Example with Full Typing
```typescript
export default function UserModule({useRoute}: AppContext): void {
    // Create user
    useRoute("users")
        .post("/")
        .code(201, Type.Object({
            id: Type.String(),
            name: Type.String(),
            email: Type.String()
        }))
        .code(400, Type.Object({
            errors: Type.Array(Type.String())
        }))
        .code(401, Type.Object({
            error: Type.String()
        }))
        .body(Type.Object({
            name: Type.String(),
            email: Type.String(),
            password: Type.String()
        }))
        .handler(async (req, res) => {
            const userService = Container.get(UserService);
            const user = await userService.create(req.body);
            return {
                status: 201,
                data: user
            };
        })
        .build();

    // Get user
    useRoute("users")
        .get("/:id")
        .code(200, Type.Object({
            id: Type.String(),
            name: Type.String(),
            email: Type.String()
        }))
        .code(401, Type.Object({
            error: Type.String()
        }))
        .code(403, Type.Object({
            error: Type.String()
        }))
        .code(404, Type.Object({
            error: Type.String()
        }))
        .params(Type.Object({
            id: Type.String()
        }))
        .handler(async (req, res) => {
            const userService = Container.get(UserService);
            const user = await userService.findById(req.params.id);
            if (!user) {
                return {
                    status: 404,
                    data: { error: "User not found" }
                };
            }
            return {
                status: 200,
                data: user
            };
        })
        .build();
}
```

### Protected Route Example with Full Typing
```typescript
export default function AdminModule({useRoute}: AppContext): void {
    useRoute("admin")
        .get("/dashboard")
        .code(200, Type.Object({
            stats: Type.Object({
                users: Type.Number(),
                activeUsers: Type.Number(),
                revenue: Type.Number()
            })
        }))
        .code(401, Type.Object({
            error: Type.String()
        }))
        .code(403, Type.Object({
            error: Type.String()
        }))
        .guard(async (req, res) => {
            const authService = Container.get(AuthService);
            const isValid = await authService.validateToken(req.headers.authorization);
            if (!isValid) {
                return {
                    status: 401,
                    data: { error: "Invalid token" }
                };
            }
            return true;
        })
        .handler(async (req, res) => {
            const adminService = Container.get(AdminService);
            const stats = await adminService.getDashboardStats();
            return {
                status: 200,
                data: { stats }
            };
        })
        .build();
} 
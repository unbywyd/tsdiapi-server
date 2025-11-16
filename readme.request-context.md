# Request Context Documentation

## Table of Contents
- [Overview](#overview)
- [How It Works](#how-it-works)
- [API Reference](#api-reference)
- [Basic Usage](#basic-usage)
- [Advanced Examples](#advanced-examples)
- [Best Practices](#best-practices)
- [Memory Management](#memory-management)
- [Troubleshooting](#troubleshooting)

## Overview

Request Context provides a way to store and retrieve data that is scoped to a single HTTP request. This allows you to share data across different parts of your application during request processing without passing it explicitly through function parameters.

### Key Features

- **Request-Scoped Storage**: Data is automatically isolated per request
- **Async-Safe**: Works correctly with async/await and promises
- **Type-Safe**: Full TypeScript support with type inference
- **Automatic Cleanup**: Context is automatically cleaned up after request completion
- **Memory Efficient**: Built-in size limits and cleanup mechanisms

### Use Cases

- Storing authenticated user information
- Request ID for logging and tracing
- Caching request-specific data
- Sharing data between middleware and handlers
- Storing temporary processing state

## How It Works

Request Context uses Node.js `AsyncLocalStorage` API to provide request-scoped storage. The context is automatically initialized when a request arrives and cleaned up after the response is sent.

### Technical Implementation

The implementation uses `AsyncLocalStorage.enterWith()` to establish context for the entire request lifecycle. This ensures that:
- Context persists through all async operations within the request
- Each request has its own isolated context
- Concurrent requests do not interfere with each other

### Lifecycle

1. **Request Arrives**: Context is initialized using `enterWith()` in the `onRequest` hook
2. **Request Processing**: You can read/write context data throughout the request lifecycle
3. **Response Sent**: Large objects are automatically cleaned up in the `onResponse` hook to prevent memory leaks

### Automatic Initialization

The framework automatically initializes context with the following default values:

```typescript
{
    requestId: string,      // Fastify request ID
    url: string,            // Request URL
    method: string,         // HTTP method
    ip: string,            // Client IP address
    userAgent: string,     // User agent header
    startTime: number       // Request start timestamp
}
```

## API Reference

### `getRequestContext()`

Get the entire request context object.

```typescript
function getRequestContext(): RequestContext | null
```

**Returns**: The current request context or `null` if called outside a request handler.

**Example**:
```typescript
const context = getRequestContext();
if (context) {
    console.log('Request ID:', context.requestId);
}
```

### `getRequestContextValue<T>(key: string)`

Get a specific value from the request context by key.

```typescript
function getRequestContextValue<T = any>(key: string): T | undefined
```

**Parameters**:
- `key`: The key to retrieve the value for

**Returns**: The value associated with the key, or `undefined` if not found.

**Example**:
```typescript
const userId = getRequestContextValue<number>('userId');
const userRole = getRequestContextValue<string>('userRole');
```

### `setRequestContextValue<T>(key: string, value: T)`

Set a value in the request context.

```typescript
function setRequestContextValue<T = any>(key: string, value: T): void
```

**Parameters**:
- `key`: The key to store the value under
- `value`: The value to store

**Throws**: Error if called outside a request handler or if value exceeds size limits.

**Example**:
```typescript
setRequestContextValue('userId', 123);
setRequestContextValue('userRole', 'admin');
setRequestContextValue('user', { id: 123, name: 'John' });
```

### `setRequestContext(context: RequestContext)`

Set multiple values in the request context at once.

```typescript
function setRequestContext(context: RequestContext): void
```

**Parameters**:
- `context`: Object containing key-value pairs to set

**Example**:
```typescript
setRequestContext({
    userId: 123,
    userRole: 'admin',
    permissions: ['read', 'write']
});
```

### `deleteRequestContextValue(key: string)`

Delete a specific value from the request context.

```typescript
function deleteRequestContextValue(key: string): void
```

**Example**:
```typescript
deleteRequestContextValue('temporaryData');
```

### `clearRequestContext()`

Clear all values from the request context.

```typescript
function clearRequestContext(): void
```

**Example**:
```typescript
clearRequestContext();
```

### `getAllRequestContext()`

Get a copy of the entire request context.

```typescript
function getAllRequestContext(): RequestContext | null
```

**Returns**: A copy of the current context or `null` if called outside a request handler.

**Example**:
```typescript
const context = getAllRequestContext();
// Use context for logging or debugging
```

## Basic Usage

### Setting and Getting Values

```typescript
import { 
    getRequestContextValue, 
    setRequestContextValue 
} from '@tsdiapi/server';

export default function userController({ useRoute }: AppContext) {
    useRoute('users')
        .get('/profile')
        .code(200, Type.Object({
            id: Type.String(),
            name: Type.String(),
            email: Type.String()
        }))
        .guard(async (req, reply) => {
            // Authenticate user and store in context
            const token = req.headers.authorization;
            const user = await authenticateUser(token);
            
            if (!user) {
                return { status: 401, data: { error: 'Unauthorized' } };
            }
            
            // Store user data in context
            setRequestContextValue('userId', user.id);
            setRequestContextValue('user', user);
            
            return true;
        })
        .handler(async (req, reply) => {
            // Retrieve user from context
            const userId = getRequestContextValue<number>('userId');
            const user = getRequestContextValue<User>('user');
            
            return {
                status: 200,
                data: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            };
        })
        .build();
}
```

### Using Context in Services

```typescript
import { getRequestContextValue } from '@tsdiapi/server';
import { Service } from 'typedi';

@Service()
export class UserService {
    async getCurrentUser() {
        // Access context from service
        const userId = getRequestContextValue<number>('userId');
        if (!userId) {
            throw new Error('User not authenticated');
        }
        
        return await this.findById(userId);
    }
    
    async checkPermission(permission: string): Promise<boolean> {
        const userRole = getRequestContextValue<string>('userRole');
        const permissions = getRequestContextValue<string[]>('permissions') || [];
        
        return permissions.includes(permission);
    }
}
```

### Request ID for Logging

```typescript
import { getRequestContextValue } from '@tsdiapi/server';

function log(message: string, data?: any) {
    const requestId = getRequestContextValue<string>('requestId');
    const userId = getRequestContextValue<number>('userId');
    
    console.log({
        requestId,
        userId,
        message,
        data,
        timestamp: new Date().toISOString()
    });
}

export default function orderController({ useRoute }: AppContext) {
    useRoute('orders')
        .post('/')
        .code(201, Type.Object({
            id: Type.String(),
            status: Type.String()
        }))
        .handler(async (req, reply) => {
            log('Creating order', { body: req.body });
            
            const order = await createOrder(req.body);
            
            log('Order created', { orderId: order.id });
            
            return { status: 201, data: order };
        })
        .build();
}
```

## Advanced Examples

### Authentication Middleware Pattern

```typescript
import { 
    getRequestContextValue, 
    setRequestContextValue 
} from '@tsdiapi/server';

// Create reusable authentication guard
function createAuthGuard() {
    return async (req: FastifyRequest, reply: FastifyReply) => {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return { status: 401, data: { error: 'No token provided' } };
        }
        
        try {
            const decoded = await verifyToken(token);
            const user = await getUserById(decoded.userId);
            
            if (!user) {
                return { status: 401, data: { error: 'User not found' } };
            }
            
            // Store user data in context
            setRequestContextValue('userId', user.id);
            setRequestContextValue('user', user);
            setRequestContextValue('userRole', user.role);
            setRequestContextValue('permissions', user.permissions);
            
            return true;
        } catch (error) {
            return { status: 401, data: { error: 'Invalid token' } };
        }
    };
}

export default function protectedController({ useRoute }: AppContext) {
    useRoute('admin')
        .get('/dashboard')
        .code(200, Type.Object({
            stats: Type.Any()
        }))
        .code(401, Type.Object({
            error: Type.String()
        }))
        .guard(createAuthGuard())
        .handler(async (req, reply) => {
            // User data is available via context
            const user = getRequestContextValue<User>('user');
            const permissions = getRequestContextValue<string[]>('permissions');
            
            // Check permissions
            if (!permissions?.includes('admin.dashboard.view')) {
                return { status: 403, data: { error: 'Insufficient permissions' } };
            }
            
            const stats = await getDashboardStats();
            return { status: 200, data: { stats } };
        })
        .build();
}
```

### Request Tracing Pattern

```typescript
import { 
    getRequestContext, 
    setRequestContextValue 
} from '@tsdiapi/server';

// Add tracing information
function trace(operation: string, data?: any) {
    const context = getRequestContext();
    if (!context) return;
    
    const traces = context.traces || [];
    traces.push({
        operation,
        data,
        timestamp: Date.now() - context.startTime
    });
    
    setRequestContextValue('traces', traces);
}

export default function complexController({ useRoute }: AppContext) {
    useRoute('complex')
        .post('/process')
        .code(200, Type.Object({
            result: Type.Any(),
            traces: Type.Array(Type.Any())
        }))
        .handler(async (req, reply) => {
            trace('start', { input: req.body });
            
            // Step 1
            trace('step1', { status: 'processing' });
            const step1Result = await processStep1(req.body);
            
            // Step 2
            trace('step2', { status: 'processing' });
            const step2Result = await processStep2(step1Result);
            
            // Step 3
            trace('step3', { status: 'processing' });
            const finalResult = await processStep3(step2Result);
            
            trace('complete', { result: finalResult });
            
            const traces = getRequestContextValue<any[]>('traces');
            
            return {
                status: 200,
                data: {
                    result: finalResult,
                    traces
                }
            };
        })
        .build();
}
```

### Caching Request Data

```typescript
import { 
    getRequestContextValue, 
    setRequestContextValue 
} from '@tsdiapi/server';

async function getCachedUser(userId: number): Promise<User> {
    // Check if user is already loaded in context
    const cachedUser = getRequestContextValue<User>('cachedUser');
    if (cachedUser && cachedUser.id === userId) {
        return cachedUser;
    }
    
    // Load user from database
    const user = await db.user.findUnique({ where: { id: userId } });
    
    // Cache in context
    setRequestContextValue('cachedUser', user);
    
    return user;
}

export default function userController({ useRoute }: AppContext) {
    useRoute('users')
        .get('/:id/posts')
        .code(200, Type.Object({
            posts: Type.Array(Type.Any())
        }))
        .handler(async (req, reply) => {
            const userId = parseInt(req.params.id);
            
            // User will be cached after first call
            const user = await getCachedUser(userId);
            
            // Use cached user in multiple places
            const posts = await getPostsByUser(user.id);
            const profile = await getProfile(user.id);
            
            return {
                status: 200,
                data: { posts }
            };
        })
        .build();
}
```

### Error Context Pattern

```typescript
import { 
    getRequestContextValue, 
    setRequestContextValue 
} from '@tsdiapi/server';

export default function errorHandlingController({ useRoute }: AppContext) {
    useRoute('data')
        .post('/process')
        .code(200, Type.Object({
            success: Type.Boolean()
        }))
        .code(400, Type.Object({
            error: Type.String(),
            context: Type.Any()
        }))
        .handler(async (req, reply) => {
            try {
                // Store processing context
                setRequestContextValue('processingStep', 'validation');
                await validateData(req.body);
                
                setRequestContextValue('processingStep', 'transformation');
                const transformed = await transformData(req.body);
                
                setRequestContextValue('processingStep', 'storage');
                await storeData(transformed);
                
                return { status: 200, data: { success: true } };
            } catch (error) {
                // Include context in error response
                const context = getRequestContext();
                return {
                    status: 400,
                    data: {
                        error: error.message,
                        context: {
                            step: getRequestContextValue('processingStep'),
                            requestId: context?.requestId
                        }
                    }
                };
            }
        })
        .build();
}
```

## Best Practices

### 1. Store Small, Request-Specific Data

✅ **Good**:
```typescript
setRequestContextValue('userId', 123);
setRequestContextValue('userRole', 'admin');
setRequestContextValue('permissions', ['read', 'write']);
```

❌ **Bad**:
```typescript
// Don't store large files or buffers
setRequestContextValue('fileBuffer', largeBuffer); // ❌ Too large

// Don't store entire database results
setRequestContextValue('allUsers', await getAllUsers()); // ❌ Too large
```

### 2. Use Type-Safe Access

✅ **Good**:
```typescript
const userId = getRequestContextValue<number>('userId');
const user = getRequestContextValue<User>('user');
```

❌ **Bad**:
```typescript
const userId = getRequestContextValue('userId'); // ❌ No type safety
```

### 3. Check for Context Availability

✅ **Good**:
```typescript
const context = getRequestContext();
if (context) {
    const userId = getRequestContextValue<number>('userId');
}
```

❌ **Bad**:
```typescript
const userId = getRequestContextValue<number>('userId'); // ❌ May be null
// Use without checking
```

### 4. Clean Up Temporary Data

✅ **Good**:
```typescript
try {
    setRequestContextValue('tempData', largeObject);
    // Use tempData
} finally {
    deleteRequestContextValue('tempData');
}
```

### 5. Use Consistent Key Names

✅ **Good**:
```typescript
// Use consistent naming convention
setRequestContextValue('userId', id);
setRequestContextValue('userRole', role);
setRequestContextValue('userPermissions', permissions);
```

❌ **Bad**:
```typescript
setRequestContextValue('userId', id);
setRequestContextValue('role', role); // ❌ Inconsistent naming
setRequestContextValue('perms', permissions); // ❌ Inconsistent naming
```

## Memory Management

### Automatic Cleanup

The framework automatically cleans up the request context after each request completes. Large objects (buffers > 10KB, objects > 50KB) are automatically removed to prevent memory leaks.

### Size Limits

- **Maximum Context Size**: 1MB (approximate)
- **Large Buffer Warning**: Buffers > 100KB trigger warnings
- **Automatic Cleanup**: Large objects are removed after request completion

### Monitoring

The framework logs warnings when:
- Context size exceeds limits
- Large buffers are stored
- Context operations fail

### Manual Cleanup

If you need to manually clean up large objects:

```typescript
// Remove specific large object
deleteRequestContextValue('largeData');

// Clear all context
clearRequestContext();
```

## Troubleshooting

### Context is `null`

**Problem**: `getRequestContext()` returns `null`

**Solution**: Ensure you're calling the function within a request handler:

```typescript
// ✅ Works - inside handler
useRoute('test')
    .get('/')
    .handler(async (req, reply) => {
        const context = getRequestContext(); // ✅ Available
    })
    .build();

// ❌ Doesn't work - outside handler
const context = getRequestContext(); // ❌ null
```

### Context Not Available in Service

**Problem**: Context is not available in a service class

**Solution**: Ensure the service is called from within a request handler:

```typescript
// ✅ Works - service called from handler
useRoute('test')
    .get('/')
    .handler(async (req, reply) => {
        const service = Container.get(MyService);
        await service.doSomething(); // ✅ Context available
    })
    .build();

// ✅ Service can access context
@Service()
export class MyService {
    doSomething() {
        const userId = getRequestContextValue<number>('userId'); // ✅ Works
    }
}
```

### Memory Warnings

**Problem**: Getting warnings about context size

**Solution**: Store references instead of large objects:

```typescript
// ❌ Bad - stores large object
setRequestContextValue('file', largeFileBuffer);

// ✅ Good - store reference/ID
setRequestContextValue('fileId', fileId);
```

### Context Data Persists Between Requests

**Problem**: Data from one request appears in another

**Solution**: This shouldn't happen with AsyncLocalStorage, but if it does:

1. Check that you're not storing data in module-level variables
2. Ensure context is properly initialized for each request
3. Verify you're using the framework's built-in hooks

## Integration Examples

### With Authentication Plugin

```typescript
// auth.plugin.ts
export default function authPlugin() {
    return {
        name: 'auth',
        onInit: async (ctx: AppContext) => {
            // Plugin initialization
        }
    };
}

// In your routes
export default function protectedController({ useRoute }: AppContext) {
    useRoute('protected')
        .get('/data')
        .guard(async (req, reply) => {
            // Auth plugin sets user in context
            const user = getRequestContextValue<User>('user');
            if (!user) {
                return { status: 401, data: { error: 'Unauthorized' } };
            }
            return true;
        })
        .handler(async (req, reply) => {
            const user = getRequestContextValue<User>('user');
            return { status: 200, data: { user } };
        })
        .build();
}
```

### With Logging Middleware

```typescript
// logging.middleware.ts
export function createLoggingMiddleware() {
    return async (req: FastifyRequest, reply: FastifyReply) => {
        const requestId = getRequestContextValue<string>('requestId');
        const userId = getRequestContextValue<number>('userId');
        
        logger.info('Request started', {
            requestId,
            userId,
            method: req.method,
            url: req.url
        });
    };
}
```

---

For more information, see:
- [Main Documentation](./readme.md)
- [Routing Documentation](./readme.routing.md)


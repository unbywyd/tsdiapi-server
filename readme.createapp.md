# TSDIAPI Server Configuration Guide

This guide explains how to configure and customize your TSDIAPI server using the `createApp` function.

## 🚀 Basic Setup

When you create a new project using the CLI (`npx @tsdiapi/cli create app`), a basic configuration is automatically generated in `src/main.ts`:

```typescript
import { PrismaClient } from "@generated/prisma/client.js";
import { createApp } from "@tsdiapi/server";
import { ConfigType, ConfigSchema } from "./app.config.js";
import PrismaPlugin from "@tsdiapi/prisma";

createApp<ConfigType>({
    configSchema: ConfigSchema,
    plugins: [PrismaPlugin({ client: PrismaClient })]
});
```

## ⚙️ Configuration Options

The `createApp` function accepts an object with the following configuration options:

### Basic Configuration

```typescript
createApp<ConfigType>({
    // Directory containing your API controllers and services
    apiDir?: string;
    
    // TypeBox schema for validating your configuration
    configSchema?: TObject;
    
    // Enable/disable Fastify logger
    logger?: boolean;
    
    // Custom file loader for handling uploads
    fileLoader?: FileLoader;
    
    // Array of plugins to use
    plugins?: AppPlugin[];
})
```

### Fastify Configuration

```typescript
createApp<ConfigType>({
    // Customize Fastify server options
    fastifyOptions?: (defaultOptions: FastifyServerOptions) => FastifyServerOptions;
    
    // Configure CORS
    corsOptions?: FastifyCorsOptions | boolean | (defaultOptions: FastifyCorsOptions) => FastifyCorsOptions;
    
    // Configure Helmet security headers
    helmetOptions?: FastifyHelmetOptions | boolean | (defaultOptions: FastifyHelmetOptions) => FastifyHelmetOptions;
    
    // Configure Swagger documentation
    swaggerOptions?: FastifyDynamicSwaggerOptions | (defaultOptions: FastifyDynamicSwaggerOptions) => FastifyDynamicSwaggerOptions;
    
    // Configure Swagger UI
    swaggerUiOptions?: FastifySwaggerUiOptions | (defaultOptions: FastifySwaggerUiOptions) => FastifySwaggerUiOptions;
    
    // Configure static file serving
    staticOptions?: FastifyStaticOptions | boolean | (defaultOptions: FastifyStaticOptions) => FastifyStaticOptions;
    
    // Configure multipart form handling
    multipartOptions?: FastifyMultipartAttachFieldsToBodyOptions | (defaultOptions: FastifyMultipartAttachFieldsToBodyOptions) => FastifyMultipartAttachFieldsToBodyOptions;
})
```

### Lifecycle Hooks

```typescript
createApp<ConfigType>({
    // Called when the app is initialized
    onInit?: (ctx: AppContext<ConfigType>) => Promise<void> | void;
    
    // Called before the server starts
    beforeStart?: (ctx: AppContext<ConfigType>) => Promise<void> | void;
    
    // Called before the server is ready
    preReady?: (ctx: AppContext<ConfigType>) => Promise<void> | void;
    
    // Called after the server starts
    afterStart?: (ctx: AppContext<ConfigType>) => Promise<void> | void;
})
```

## 📦 Plugin System

Plugins can extend the functionality of your TSDIAPI server. Here's how to create and use them:

```typescript
// Example plugin definition
const MyPlugin: AppPlugin = {
    name: 'my-plugin',
    services: [MyService], // Optional: Array of service classes
    config: { /* plugin configuration */ },
    
    // Lifecycle hooks
    onInit: async (ctx) => {
        // Initialize plugin
    },
    beforeStart: async (ctx) => {
        // Run before server starts
    },
    afterStart: async (ctx) => {
        // Run after server starts
    },
    preReady: async (ctx) => {
        // Run before server is ready
    }
};

// Using the plugin
createApp<ConfigType>({
    plugins: [MyPlugin]
});
```

## 🔧 Environment Configuration

TSDIAPI automatically loads environment variables from `.env` files. The following variables are supported:

```env
PORT=3000              # Server port
HOST=localhost         # Server host
APP_NAME=MyApp        # Application name
APP_VERSION=1.0.0     # Application version
```

## 📝 Type Safety

The `createApp` function is fully type-safe. When you create a new project using the CLI, it automatically generates a configuration schema file (`app.config.ts`) that defines the structure of your environment variables:

```typescript
// app.config.ts
import { Type, Static } from '@sinclair/typebox';

export const ConfigSchema = Type.Object({
    NAME: Type.String(),
    VERSION: Type.String(),
    PORT: Type.Number(),
    HOST: Type.String(),
    DATABASE_URL: Type.String(),
    DATABASE_TYPE: Type.String()
});

export type ConfigType = Static<typeof ConfigSchema>;
```

This schema serves several important purposes:

1. **Environment Variable Validation**: The schema validates that all required environment variables are present and have the correct types.
2. **Type Safety**: The `ConfigType` type is automatically generated from the schema, providing full TypeScript type checking.
3. **Documentation**: The schema serves as documentation for the required environment variables.
4. **Transformation**: Environment variables are automatically transformed to their correct types (e.g., strings to numbers).

### Using Custom Environment Variables

You can extend the default schema with your own environment variables:

```typescript
// app.config.ts
import { Type, Static } from '@sinclair/typebox';

export const ConfigSchema = Type.Object({
    // Default variables
    NAME: Type.String(),
    VERSION: Type.String(),
    PORT: Type.Number(),
    HOST: Type.String(),
    DATABASE_URL: Type.String(),
    DATABASE_TYPE: Type.String(),
    
    // Custom variables
    JWT_SECRET: Type.String(),
    API_KEY: Type.String(),
    ENABLE_CACHE: Type.Boolean(),
    CACHE_TTL: Type.Number(),
    ALLOWED_ORIGINS: Type.Array(Type.String())
});

export type ConfigType = Static<typeof ConfigSchema>;
```

### Environment Variable Transformation

The schema automatically handles type transformations:

```typescript
// .env
PORT=3000                    // Will be transformed to number
ENABLE_CACHE=true           // Will be transformed to boolean
```

### Required vs Optional Variables

You can mark variables as optional using `Type.Optional()`:

```typescript
export const ConfigSchema = Type.Object({
    // Required variables
    DATABASE_URL: Type.String(),
    
    // Optional variables
    CACHE_TTL: Type.Optional(Type.Number()),
    ENABLE_LOGGING: Type.Optional(Type.Boolean())
});
```

### Using the Configuration

The configuration is automatically loaded and validated when the application starts. You can access it through the `AppContext`:

```typescript
createApp<ConfigType>({
    onInit: async (ctx) => {
        // Access configuration
        const port = ctx.projectConfig.get('PORT', 3000);
        const host = ctx.projectConfig.get('HOST', 'localhost');
        const databaseUrl = ctx.projectConfig.get('DATABASE_URL');
        console.log(`Server will run on ${host}:${port}`);
    }
});
```

## 🎯 Example Configuration

Here's a complete example of a configured TSDIAPI server:

```typescript
import { PrismaClient } from "@generated/prisma/client.js";
import { createApp } from "@tsdiapi/server";
import { ConfigType, ConfigSchema } from "./app.config.js";
import PrismaPlugin from "@tsdiapi/prisma";
import AuthPlugin from "./plugins/auth.js";

createApp<ConfigType>({
    apiDir: './api',
    configSchema: ConfigSchema,
    logger: true,
    
    // Fastify configuration
    fastifyOptions: (defaults) => ({
        ...defaults,
        trustProxy: true
    }),
    
    // Security configuration
    corsOptions: {
        origin: ['https://myapp.com'],
        credentials: true
    },
    helmetOptions: {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"]
            }
        }
    },
    
    // Documentation configuration
    swaggerOptions: {
        openapi: {
            info: {
                title: 'My API',
                version: '1.0.0'
            }
        }
    },
    
    // File upload configuration
    fileLoader: async (file) => {
        // Custom file processing
        return file;
    },
    
    // Plugins
    plugins: [
        PrismaPlugin({ client: PrismaClient }),
        AuthPlugin()
    ],
    
    // Lifecycle hooks
    onInit: async (ctx) => {
        console.log('Initializing application...');
    },
    afterStart: async (ctx) => {
        console.log(`Server started on ${ctx.fastify.server.address()}`);
    }
});
```

## 🔍 AppContext

The `AppContext` object is available in lifecycle hooks and plugins. It provides access to:

```typescript
interface AppContext<T> {
    fastify: FastifyInstance;          // Fastify server instance
    environment: 'production' | 'development';
    appDir: string;                    // Application directory
    options: AppOptions<T>;            // Application options
    fileLoader?: FileLoader;           // File loader function
    projectConfig: AppConfig<T>;       // Project configuration
    projectPackage: Record<string, any>; // Package.json contents
    plugins?: Record<string, AppPlugin>; // Loaded plugins
    useRoute: RouteBuilder;            // Route builder function
}
```

## 📚 Related Documentation

- [Routing Guide](./readme.routing.md)
- [Prisma Integration](./readme.prisma.md)

### Automatic Configuration Expansion

The TSDIAPI CLI (`@tsdiapi/cli`) provides automated project management and configuration:

1. **Project Creation**:
   ```bash
   npx @tsdiapi/cli create myapi
   ```
   This automatically:
   - Sets up the project structure
   - Creates initial configuration files
   - Generates `app.config.ts` with basic environment variables

2. **Plugin Integration**:
   ```bash
   npx @tsdiapi/cli plugins add prisma
   ```
   When you add a plugin, the CLI:
   - Adds necessary dependencies
   - Updates project configuration
   - Sets up plugin-specific environment variables

3. **Code Generation**:
   ```bash
   npx @tsdiapi/cli generate module user
   ```
   The CLI automatically:
   - Creates module structure
   - Sets up basic configuration
   - Generates necessary files

### Configuration Management

The CLI automatically manages your project configuration through:

1. **Environment Variables**:
   ```env
   PORT=3000
   HOST=localhost
   ```
   These are automatically loaded and validated against your `ConfigSchema`.

2. **Plugin Configuration**:
   When you add a plugin, the CLI automatically:
   - Updates `.env` with required variables
   - Extends `ConfigSchema` with plugin-specific types
   - Sets up default configuration values

3. **Project Structure**:
   The CLI maintains a consistent project structure


This automation ensures that your project configuration stays consistent and type-safe as you add new features and plugins.

## 📁 File Handling

TSDIAPI provides robust file handling capabilities through the `@fastify/multipart` plugin. Here's how it works:

### Basic File Upload

```typescript
export default function uploadController({ useRoute }: AppContext) {
  useRoute()
    .post("/upload")
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
      // Files are available in req.tempFiles
      const file = req.tempFiles[0];
      return { status: 200, data: { url: file.url } };
    })
    .build();
}
```

### File Storage and Processing

1. **Temporary Storage**:
   - Files are stored in memory as `Buffer` objects
   - Accessible through `req.tempFiles` array in route handlers
   - Each file has a unique ID and metadata

2. **File Object Structure**:
   ```typescript
   interface UploadFile {
       id: string;              // Unique identifier
       fieldname: string;       // Form field name
       filename: string;        // Original filename
       encoding: string;        // File encoding
       mimetype: string;        // MIME type
       filesize: number;        // File size in bytes
       buffer: Buffer;          // File content
       url?: string;            // URL after processing
       meta?: Record<string, any>; // Custom metadata
       s3bucket?: string;       // S3 bucket if uploaded
       s3region?: string;       // S3 region if uploaded
   }
   ```

3. **File Processing Options**:

   a. **Global File Loader** (Recommended):
   ```typescript
   createApp<ConfigType>({
     fileLoader: async (file: UploadFile) => {
       // Example: Upload to S3
       const s3Url = await uploadToS3(file.buffer, {
         bucket: 'my-bucket',
         key: `${file.id}-${file.filename}`
       });
       
       return {
         ...file,
         url: s3Url,
         s3bucket: 'my-bucket',
         s3region: 'us-east-1'
       };
     }
   });
   ```

   b. **Manual Processing in Handler**:
   ```typescript
   useRoute()
     .post("/upload")
     .acceptMultipart()
     .handler(async (req) => {
       const file = req.tempFiles[0];
       
       // Manual upload
       const s3Url = await uploadToS3(file.buffer, {
         bucket: 'my-bucket',
         key: `${file.id}-${file.filename}`
       });
       
       return { 
         status: 200, 
         data: { 
           url: s3Url,
           filename: file.filename
         } 
       };
     })
     .build();
   ```

4. **File Access in Routes**:
   ```typescript
   useRoute()
     .post("/process-files")
     .acceptMultipart()
     .handler(async (req) => {
       // Access all uploaded files
       const files = req.tempFiles;
       
       // Process each file
       const results = await Promise.all(
         files.map(async (file) => {
           // File is already processed if global fileLoader is set
           if (file.url) {
             return { url: file.url };
           }
           
           // Manual processing if needed
           const url = await uploadToStorage(file.buffer);
           return { url };
         })
       );
       
       return { status: 200, data: { files: results } };
     })
     .build();
   ```

### Best Practices

1. **Use Global File Loader**:
   - Set up `fileLoader` in `createApp` for consistent file processing
   - Handles all file uploads automatically
   - Can be configured for different storage providers

2. **File Validation**:
   ```typescript
   .fileOptions({
     maxFileSize: 5 * 1024 * 1024, // 5MB
     accept: ["image/*"],          // All image types
     maxFiles: 5                   // Maximum files per request
   })
   ```

3. **Error Handling**:
   ```typescript
   useRoute()
     .post("/upload")
     .acceptMultipart()
     .code(400, Type.Object({
       error: Type.String()
     }))
     .handler(async (req) => {
       if (!req.tempFiles?.length) {
         return { 
           status: 400, 
           data: { error: "No files uploaded" } 
         };
       }
       // Process files...
     })
     .build();
   ```

### File Object Structure

```typescript
interface UploadFile {
    id: string;              // Unique identifier
    fieldname: string;       // Form field name
    filename: string;        // Original filename
    encoding: string;        // File encoding
    mimetype: string;        // MIME type
    filesize: number;        // File size in bytes
    buffer: Buffer;          // File content
    url?: string;            // URL after processing
    meta?: Record<string, any>; // Custom metadata
    s3bucket?: string;       // S3 bucket if uploaded
    s3region?: string;       // S3 region if uploaded
}
```

### Error Handling

```typescript
useRoute()
  .post("/upload")
  .acceptMultipart()
  .fileOptions({
    maxFileSize: 5 * 1024 * 1024,
    accept: ["image/jpeg", "image/png"]
  })
  .code(400, Type.Object({
    errors: Type.Array(Type.String())
  }))
  .handler(async (req) => {
    // File validation errors are automatically handled
    return { status: 200, data: { success: true } };
  })
  .build();
```

### Security Considerations

1. **File Size Limits**: Both global and per-route limits prevent DoS attacks
2. **MIME Type Validation**: Ensures only allowed file types are uploaded
3. **Temporary Storage**: Files are stored in memory and processed immediately
4. **Unique Identifiers**: Each file gets a unique ID to prevent conflicts 
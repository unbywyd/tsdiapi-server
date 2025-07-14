/*
*   Swagger Configuration
*/
import { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import { FastifySwaggerUiOptions } from '@fastify/swagger-ui';
import { AppMainOptions, AppOptions } from './types.js';

export function setupSwagger(appOptions: AppOptions, options?: AppMainOptions): {
    swaggerOptions: FastifyDynamicSwaggerOptions;
    swaggerUiOptions: FastifySwaggerUiOptions;
} {
    const appName = options?.APP_NAME;
    const host = options?.HOST;
    const port = options?.PORT;
    const version = options?.APP_VERSION;
    const isProduction = process.env.NODE_ENV === 'production';

    const baseUrl = isProduction
        ? `https://${host}`
        : `http://${host}:${port}`;

    const swaggerOptionsHandler = 'function' === typeof appOptions?.swaggerOptions ? appOptions?.swaggerOptions : (defaultOptions: FastifyDynamicSwaggerOptions) => defaultOptions;
    const swaggerOptions = swaggerOptionsHandler({
        openapi: {
            info: {
                title: appName,
                description: `API Documentation for ${appName}`,
                version: version,
            },
            servers: [
                {
                    url: baseUrl,
                    description: isProduction ? 'Production server' : 'Development server',
                },
            ],
            components: {
                securitySchemes: {
                    BearerAuth: {
                        type: "http",
                        scheme: "bearer",
                        bearerFormat: "JWT"
                    },
                    BasicAuth: {
                        type: "http",
                        scheme: "basic"
                    },
                    ApiKeyAuth: {
                        type: "apiKey",
                        in: "header",
                        name: "X-API-Key"
                    }
                }
            },
            security: []
        },
        refResolver: {
            buildLocalReference(json, _baseUri, _fragment, i) {
                if (json.$id && typeof json.$id === 'string') return json.$id;
                return `def-${i}`;
            }
        }
    });

    const swaggerUiOptionsHandler = 'function' === typeof appOptions?.swaggerUiOptions ? appOptions?.swaggerUiOptions : (defaultOptions: FastifySwaggerUiOptions) => defaultOptions;
    const swaggerUiOptions = swaggerUiOptionsHandler({
        routePrefix: '/docs',
        uiConfig: {
            docExpansion: 'none',
            deepLinking: false,
            persistAuthorization: true,
            displayRequestDuration: true,
            filter: true,
        },
        staticCSP: true,
        transformSpecificationClone: true,
        uiHooks: {
            onRequest: (request, reply, next) => {
                // Add CORS headers
                reply.header('Access-Control-Allow-Origin', '*');
                reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
                next();
            }
        }
    });

    return {
        swaggerOptions,
        swaggerUiOptions,
    }
}




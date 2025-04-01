
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
                    url: `http://${host}:${port}`,
                    description: 'Development server',
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
    });
    const swaggerUiOptionsHandler = 'function' === typeof appOptions?.swaggerUiOptions ? appOptions?.swaggerUiOptions : (defaultOptions: FastifySwaggerUiOptions) => defaultOptions;
    const swaggerUiOptions = swaggerUiOptionsHandler({
        routePrefix: '/docs',
        uiConfig: {
            docExpansion: 'none',
            deepLinking: false
        },
        staticCSP: true,
        transformSpecificationClone: true
    });
    return {
        swaggerOptions,
        swaggerUiOptions,
    }
}




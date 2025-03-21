
/*
*   Swagger Configuration
*/
import fastifySwagger, { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import fastifySwaggerUi, { FastifySwaggerUiOptions } from '@fastify/swagger-ui';
import { FastifyInstance } from 'fastify/fastify.js';
import { AppMainOptions, AppOptions } from './types.js';

export async function setupSwagger(fastify: FastifyInstance, appOptions: AppOptions, options?: AppMainOptions): Promise<FastifySwaggerUiOptions> {
    const appName = options?.APP_NAME;
    const host = options?.HOST;
    const port = options?.PORT;
    const version = options?.APP_VERSION;
    const swaggerOptionsHandler = 'function' === typeof appOptions?.swaggerOptions ? appOptions?.swaggerOptions : (defaultOptions: FastifyDynamicSwaggerOptions) => defaultOptions;
    await fastify.register(fastifySwagger, swaggerOptionsHandler({
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
    }));
    const swaggerUiOptionsHandler = 'function' === typeof appOptions?.swaggerUiOptions ? appOptions?.swaggerUiOptions : (defaultOptions: FastifySwaggerUiOptions) => defaultOptions;
    const extendOptions = swaggerUiOptionsHandler({
        routePrefix: '/docs',
        uiConfig: {
            docExpansion: 'full',
            deepLinking: false,
        },
        staticCSP: true,
        transformSpecificationClone: true,

    })
    await fastify.register(fastifySwaggerUi, extendOptions);
    return extendOptions;
}




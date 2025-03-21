/*
*   Swagger Configuration
*/
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
export async function setupSwagger(fastify, appOptions, options) {
    const appName = options?.APP_NAME;
    const host = options?.HOST;
    const port = options?.PORT;
    const version = options?.APP_VERSION;
    const swaggerOptionsHandler = 'function' === typeof appOptions?.swaggerOptions ? appOptions?.swaggerOptions : (defaultOptions) => defaultOptions;
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
    const swaggerUiOptionsHandler = 'function' === typeof appOptions?.swaggerUiOptions ? appOptions?.swaggerUiOptions : (defaultOptions) => defaultOptions;
    const extendOptions = swaggerUiOptionsHandler({
        routePrefix: '/docs',
        uiConfig: {
            docExpansion: 'full',
            deepLinking: false,
        },
        staticCSP: true,
        transformSpecificationClone: true,
    });
    await fastify.register(fastifySwaggerUi, extendOptions);
    return extendOptions;
}
//# sourceMappingURL=swagger.js.map
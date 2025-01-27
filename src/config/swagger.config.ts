import * as oa from 'openapi3-ts';

export type SwaggerOptions = {
    baseDir: string;
    securitySchemes?: oa.OpenAPIObject['components']['securitySchemes'];
}
const config = {
    baseDir: '/docs',
    securitySchemes: {
        bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
        }
    }
} as SwaggerOptions;

export default config;
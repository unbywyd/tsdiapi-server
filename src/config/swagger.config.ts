import * as oa from 'openapi3-ts';

export type SwaggerOptions = {
    baseDir: string;
    securitySchemes?: oa.OpenAPIObject['components']['securitySchemes'];
}
const config = {
    baseDir: '/docs'
} as SwaggerOptions;

export default config;
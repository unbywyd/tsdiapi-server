import { OpenAPIObject } from "openapi3-ts/dist/oas30";

export type SwaggerOptions = {
    baseDir: string;
    securitySchemes?: OpenAPIObject['components']['securitySchemes'];
}
const config = {
    baseDir: '/docs'
} as SwaggerOptions;

export default config;
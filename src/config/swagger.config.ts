import { OpenAPIObject } from "openapi3-ts/dist/oas30";

export type SwaggerOptions = {
    baseDir: string;
    securitySchemes?: OpenAPIObject['components']['securitySchemes'];
}

const config = {
    baseDir: '/docs'
} as SwaggerOptions;

const getSwaggerOptions = async () => {
    return config;
}

export default getSwaggerOptions;
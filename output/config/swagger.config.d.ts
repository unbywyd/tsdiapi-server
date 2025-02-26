import { OpenAPIObject } from "openapi3-ts/dist/oas30";
export type SwaggerOptions = {
    baseDir: string;
    securitySchemes?: OpenAPIObject['components']['securitySchemes'];
};
declare const config: SwaggerOptions;
export default config;
//# sourceMappingURL=swagger.config.d.ts.map
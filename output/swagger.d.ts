import { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import { FastifySwaggerUiOptions } from '@fastify/swagger-ui';
import { AppMainOptions, AppOptions } from './types.js';
export declare function setupSwagger(appOptions: AppOptions, options?: AppMainOptions): {
    swaggerOptions: FastifyDynamicSwaggerOptions;
    swaggerUiOptions: FastifySwaggerUiOptions;
};
//# sourceMappingURL=swagger.d.ts.map
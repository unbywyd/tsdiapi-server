/*
*   Swagger Configuration
*/
import { FastifyStaticOptions } from '@fastify/static';
import { AppContext, AppOptions } from './types.js';
import path from 'node:path';

export function setupStatic(context: AppContext, appOptions: AppOptions) {
    if (!appOptions?.staticOptions) return false;
    const staticOptions = 'function' === typeof appOptions?.staticOptions ? appOptions?.staticOptions : (defaultOptions: FastifyStaticOptions) => defaultOptions;

    return staticOptions({
        root: path.join(context.appDir, 'public'),
        prefix: '/',
        index: ["index.html"],
    });
}




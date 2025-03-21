/*
*   Swagger Configuration
*/
import { FastifyInstance } from 'fastify/fastify.js';
import fastifyStatic, { FastifyStaticOptions } from '@fastify/static';

import { AppContext, AppOptions } from './types.js';
import path from 'node:path';

export async function setupStatic(fastify: FastifyInstance, context: AppContext, appOptions: AppOptions) {
    const staticOptions = 'function' === typeof appOptions?.staticOptions ? appOptions?.staticOptions : (defaultOptions: FastifyStaticOptions) => defaultOptions;
    await fastify.register(fastifyStatic, staticOptions({
        root: path.join(context.appDir, 'public'),
        prefix: '/public/',
    }));
}




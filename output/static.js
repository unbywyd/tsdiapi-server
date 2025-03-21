import fastifyStatic from '@fastify/static';
import path from 'node:path';
export async function setupStatic(fastify, context, appOptions) {
    const staticOptions = 'function' === typeof appOptions?.staticOptions ? appOptions?.staticOptions : (defaultOptions) => defaultOptions;
    await fastify.register(fastifyStatic, staticOptions({
        root: path.join(context.appDir, 'public'),
        prefix: '/',
        index: ["index.html"],
    }));
    fastify.get("/", async (req, reply) => {
        return reply.sendFile("index.html");
    });
}
//# sourceMappingURL=static.js.map
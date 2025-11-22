import 'reflect-metadata';
import fastifyMultipart from '@fastify/multipart';
import Fastify from 'fastify';
import { setupCors } from './cors.js';
import { setupHelmet } from './helmet.js';
import { setupRateLimit } from './rate-limit.js';
import { setupSwagger } from './swagger.js';
import { initApp } from './app.js';
import { pastel, rainbow, cristal, vice, passion } from 'gradient-string';
import path from 'path';
import { ensureDir } from 'fsesm';
import { findAvailablePort } from './find-port.js';
import fileLoader, { fileLoaderWithContext } from './file-loader.js';
import { makeLoadPath, removeTrailingSlash } from './utils.js';
import { setupStatic } from './static.js';
import { Container } from 'typedi';
import { RouteBuilder } from './route.js';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifyStatic from '@fastify/static';
import { getSyncQueueProvider } from "@tsdiapi/syncqueue";
import { createRequestContextHook, createRequestContextCleanupHook } from './request-context.js';
import { autoRegisterSchemas, getSchemaRegistry } from './schema-registry.js';
import { ResponseErrorSchema } from './response.js';
// Package version - exported for API versioning
export const VERSION = '0.3.5';
export const API_VERSION = 'v1';
export * from './types.js';
export * from './route.js';
export * from './meta.js';
export * from './response.js';
export * from './request-context.js';
export * from './schema-registry.js';
export { useSchema } from './schema-registry.js';
let context = null;
export function getContext() {
    return context;
}
function setContext(newContext) {
    context = newContext;
}
export async function createApp(options = {}) {
    const fastifyOptions = 'function' === typeof options.fastifyOptions ? options.fastifyOptions : (defaultOptions) => defaultOptions;
    const fastify = Fastify(fastifyOptions({
        logger: options.logger ?? false,
        ajv: {
            customOptions: { strict: false }
        }
    })).withTypeProvider();
    fastify.addHook('onClose', (_, done) => {
        console.log(cristal('👋 Bye bye! Fastify server is shutting down...'));
        done();
    });
    // Initialize request context for each incoming request
    // This hook runs at the very beginning of request processing
    fastify.addHook('onRequest', createRequestContextHook());
    // Clean up request context after response is sent
    // This helps prevent memory leaks by clearing large objects
    fastify.addHook('onResponse', createRequestContextCleanupHook());
    try {
        console.log(pastel.multiline("🚀 Welcome to TSDIAPI!"));
        console.log(rainbow("✨ Starting the server..."));
        const cwd = process.cwd();
        const multipartOptions = 'function' === typeof options.multipartOptions ? options.multipartOptions : (defaultOptions) => defaultOptions;
        options.corsOptions = await setupCors(options.corsOptions);
        options.rateLimitOptions = setupRateLimit(options.rateLimitOptions);
        options.multipartOptions = multipartOptions({
            limits: {
                fileSize: 50 * 1024 * 1024,
            },
            attachFieldsToBody: 'keyValues',
            onFile: async function (part) {
                const bufferPromise = await part.toBuffer();
                const uniqId = `${part.fieldname}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const file = {
                    id: uniqId,
                    fieldname: part.fieldname,
                    filename: part.filename,
                    encoding: part.encoding,
                    mimetype: part.mimetype,
                    buffer: bufferPromise,
                    filesize: bufferPromise.byteLength,
                };
                this.tempFiles = this.tempFiles || [];
                this.tempFiles.push(file);
            }
        });
        options.helmetOptions = setupHelmet(options.helmetOptions);
        const context = await initApp(cwd, options, fastify);
        setContext(context);
        if (options.fileLoader) {
            context.fileLoader = options.fileLoader;
        }
        // Initialize schema registry and register framework schemas
        try {
            const registry = getSchemaRegistry(fastify);
            if (!registry.isRegistered('ResponseErrorSchema')) {
                registry.register(ResponseErrorSchema);
                registry.resolveAndRegister();
            }
        }
        catch {
            // If registry not available, schema will be registered when used via withRef()
        }
        const pendingBuilds = [];
        function useRoute(controller) {
            const builder = new RouteBuilder(context);
            if (controller) {
                builder.controller(controller);
            }
            const originalBuild = builder.build;
            builder.build = async function () {
                const buildPromise = originalBuild.call(builder);
                pendingBuilds.push(buildPromise);
                await buildPromise;
            };
            return builder;
        }
        context.useRoute = useRoute;
        const host = context.projectConfig.get('HOST', 'localhost');
        const appOptions = {
            PORT: await findAvailablePort(host, context.projectConfig.get('PORT', 3000)),
            HOST: host,
            APP_NAME: context.projectPackage.name || context.projectConfig.get('APP_NAME', 'TSDIAPI Server'),
            APP_VERSION: context.projectPackage.version || context.projectConfig.get('APP_VERSION', '1.0.0'),
        };
        const { swaggerOptions, swaggerUiOptions } = setupSwagger(options, appOptions);
        context.options.swaggerOptions = swaggerOptions;
        context.options.swaggerUiOptions = swaggerUiOptions;
        context.options.staticOptions = setupStatic(context, options);
        const loadExtensions = [];
        if (options?.plugins && options.plugins.length > 0) {
            for (const plugin of options.plugins) {
                if (plugin) {
                    // Add the all plugins to the context before calling onInit
                    context.plugins[plugin.name] = plugin;
                }
            }
            for (const plugin of options.plugins) {
                if (plugin.onInit) {
                    try {
                        await plugin.onInit(context);
                    }
                    catch (error) {
                        console.error(`⚠️ Plugin ${plugin.name} failed to initialize: ${error.message}`);
                    }
                }
                if (plugin?.services?.length) {
                    for (const service of plugin.services) {
                        Container.get(service);
                    }
                }
            }
        }
        if (options?.onInit) {
            try {
                await options.onInit(context);
            }
            catch (error) {
                console.error(`OnInit error:`, error);
                process.exit(1);
            }
        }
        // Add custom JSON parser to handle empty body for application/json requests
        const defaultJsonParser = fastify.getDefaultJsonParser(undefined, undefined);
        fastify.addContentTypeParser("application/json", { parseAs: "string" }, (request, body, done) => {
            // Don't handle multipart requests with custom JSON parser
            if (request.isMultipart()) {
                return done(null, body);
            }
            if (body === '' || body == null || (Buffer.isBuffer(body) && body.length === 0)) {
                return done(null, {});
            }
            return defaultJsonParser(request, body, done);
        });
        await fastify.register(fastifyMultipart, context.options.multipartOptions);
        if (context.options.corsOptions) {
            await fastify.register(cors, context.options.corsOptions);
        }
        if (context.options.helmetOptions) {
            await fastify.register(helmet, context.options.helmetOptions);
        }
        if (context.options.rateLimitOptions && typeof context.options.rateLimitOptions === 'object') {
            await fastify.register(rateLimit, context.options.rateLimitOptions);
        }
        if (context.options.swaggerOptions) {
            await fastify.register(fastifySwagger, context.options.swaggerOptions);
        }
        if (context.options.swaggerUiOptions) {
            await fastify.register(fastifySwaggerUi, context.options.swaggerUiOptions);
        }
        if (context.options.staticOptions) {
            await fastify.register(fastifyStatic, context.options.staticOptions);
            fastify.get("/", async (_req, reply) => {
                return reply.sendFile("index.html");
            });
        }
        const apiDir = path.join(context.appDir, options.apiDir || 'api');
        const apiRelativePath = removeTrailingSlash(path.relative(context.appDir, apiDir));
        await ensureDir(apiDir);
        // Auto-register schemas only if legacy option is enabled
        // By default, only explicitly registered schemas (via useSchema()) are used
        if (options.legacyAutoSchemaRegistration === true) {
            console.log(cristal('⚠️  Legacy auto schema registration is enabled'));
            await autoRegisterSchemas(fastify, apiDir);
        }
        await fileLoader(makeLoadPath(apiRelativePath, 'service'), context.appDir);
        fastify.get("/404", function (_, res) {
            res.status(404).send({ status: 404, message: "Page Not Found!" });
        });
        // Add preParsing hook to handle empty body for JSON requests
        fastify.addHook('preParsing', async (req, _reply, payload) => {
            // Handle empty body for JSON requests (but not multipart)
            if (req.headers['content-type']?.includes('application/json') && !req.isMultipart()) {
                if (!payload) {
                    return '{}';
                }
                if (payload && typeof payload === 'string' && payload?.trim() === '') {
                    return '{}';
                }
            }
            return payload;
        });
        fastify.addHook('preHandler', async (req, _reply) => {
            // Handle empty body for JSON requests (but not multipart)
            if (req.headers['content-type']?.includes('application/json') && !req.isMultipart() && !req.body) {
                req.body = {};
            }
            if (req.body && typeof req.body === 'object') {
                req.body = convertDates(req.body);
            }
        });
        function convertDates(obj) {
            if (Array.isArray(obj)) {
                return obj.map(convertDates);
            }
            else if (obj !== null && typeof obj === 'object') {
                return Object.fromEntries(Object.entries(obj).map(([key, value]) => {
                    if (typeof value === 'string' && isISODate(value)) {
                        return [key, new Date(value)];
                    }
                    else if (typeof value === 'object') {
                        return [key, convertDates(value)];
                    }
                    return [key, value];
                }));
            }
            return obj;
        }
        function isISODate(_value) {
            try {
                if (!_value)
                    return false;
                const value = _value.trim();
                if (value.length < 10 || !value.includes('T'))
                    return false;
                if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?/.test(value))
                    return false;
                const date = new Date(value);
                return !isNaN(date.getTime());
            }
            catch (error) {
                return false;
            }
        }
        fastify.addHook('preValidation', async (req) => {
            // Handle empty body for JSON requests (but not multipart)
            if (req.headers['content-type']?.includes('application/json') && !req.isMultipart() && !req.body) {
                req.body = {};
            }
            if (req.isMultipart()) {
                const body = req.body;
                for (const key in body) {
                    const value = body[key];
                    if (Array.isArray(value) && value[0] instanceof Buffer) {
                        const files = value.map((v) => req.tempFiles.find((f) => f.buffer === v));
                        body[key] = files.map((file) => file ? file.id : "file not found");
                    }
                    else if (value instanceof Buffer) {
                        const file = req.tempFiles.find((f) => f.buffer === value);
                        body[key] = file ? file.id : "file not found";
                    }
                    else if ('string' === typeof value) { // FIX MULTIPART STRING JSON
                        {
                            try {
                                body[key] = JSON.parse(value);
                            }
                            catch (error) {
                            }
                        }
                    }
                }
            }
        });
        loadExtensions.push('extra');
        loadExtensions.push('module');
        loadExtensions.push('load');
        for (const ext of loadExtensions) {
            const extdi = `${ext}.di`;
            await fileLoader(makeLoadPath(apiRelativePath, extdi), context.appDir, true);
            await fileLoaderWithContext(makeLoadPath("", ext), context, context.appDir);
        }
        if (options?.plugins && options.plugins.length > 0) {
            for (const plugin of options.plugins) {
                if (plugin.beforeStart) {
                    try {
                        await plugin.beforeStart(context);
                    }
                    catch (error) {
                        console.error(`⚠️ Error in plugin "${plugin.name}" during beforeStart:\n`, error.stack || error);
                    }
                }
            }
        }
        if (options?.beforeStart) {
            try {
                await options.beforeStart(context);
            }
            catch (error) {
                console.error(`⚠️ Error in beforeStart:\n`, error.stack || error);
            }
        }
        try {
            await getSyncQueueProvider().resolveAll();
            await Promise.all(pendingBuilds);
            try {
                if (options?.preReady) {
                    await options.preReady(context);
                }
                if (options?.plugins && options.plugins.length > 0) {
                    for (const plugin of options.plugins) {
                        if (plugin.preReady) {
                            await plugin.preReady(context);
                        }
                    }
                }
            }
            catch (error) {
                console.error(`Error in preReady:`, error);
            }
            await fastify.ready();
            fastify.swagger();
            const port = appOptions.PORT;
            const appHost = appOptions.HOST;
            const environment = context.environment;
            await fastify.listen({ port });
            console.log(passion(`🚀 Server started at http://${appHost}:${port}\n🚨️ Environment: ${environment}`));
            console.log(vice(`Swagger UI is available at http://${appHost}:${port}${context.options?.swaggerUiOptions?.routePrefix}`));
            if (options?.afterStart) {
                try {
                    await options.afterStart(context);
                }
                catch (error) {
                    console.error(error);
                }
            }
            if (options?.plugins && options.plugins.length > 0) {
                for (const plugin of options.plugins) {
                    if (plugin.afterStart) {
                        try {
                            await plugin.afterStart(context);
                        }
                        catch (error) {
                            console.error(error);
                        }
                    }
                }
            }
        }
        catch (err) {
            fastify.log.error(err);
            process.exit(1);
        }
        try {
            ["SIGINT", "SIGTERM"].forEach(signal => {
                process.on(signal, async () => {
                    console.log(cristal(`
        👋 Forced shutdown due to timeout.
        🔌 Some processes didn't close in time!
        💀 Terminating immediately...
        `));
                    await gracefulShutdown(fastify);
                });
            });
        }
        catch (error) {
            console.error(cristal("❌ Error starting the server:"), error);
        }
        return context;
    }
    catch (error) {
        console.error(cristal("❌ Error starting the server:"), error);
    }
    return null;
}
const gracefulShutdown = async (server) => {
    console.log(rainbow("✨ Almost done, cleaning up resources..."));
    await server.close();
    process.exit(0);
};
//# sourceMappingURL=index.js.map
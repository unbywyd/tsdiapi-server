import 'reflect-metadata';
import fastifyMultipart from '@fastify/multipart';
import Fastify from 'fastify';
import { setupCors } from './cors.js';
import { setupHelmet } from './helmet.js';
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
export * from './types.js';
export * from './route.js';
export * from './metadata.js';
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
    try {
        console.log(pastel.multiline("🚀 Welcome to TSDIAPI!"));
        console.log(rainbow("✨ Starting the server..."));
        const cwd = process.cwd();
        const context = await initApp(cwd, options, fastify);
        if (options.fileLoader) {
            context.fileLoader = options.fileLoader;
        }
        const pendingBuilds = [];
        function useRoute() {
            const builder = new RouteBuilder(context);
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
        const multipartOptions = 'function' === typeof options.multipartOptions ? options.multipartOptions : (defaultOptions) => defaultOptions;
        await fastify.register(fastifyMultipart, multipartOptions({
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
        }));
        await setupCors(fastify, options.corsOptions);
        await setupHelmet(fastify, options.helmetOptions);
        const uiSwaggerOptions = await setupSwagger(fastify, options, appOptions);
        await setupStatic(fastify, context, options);
        const apiDir = path.join(context.appDir, options.apiDir || 'api');
        const apiRelativePath = removeTrailingSlash(path.relative(context.appDir, apiDir));
        await ensureDir(apiDir);
        await fileLoader(makeLoadPath(apiRelativePath, 'service'), context.appDir);
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
        fastify.get("/404", function (_, res) {
            res.status(404).send({ status: 404, message: "Page Not Found!" });
        });
        fastify.addHook('preValidation', async (req) => {
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
        loadExtensions.push('module');
        loadExtensions.push('load');
        for (const ext of loadExtensions) {
            const extdi = `${ext}.dl`;
            await fileLoader(makeLoadPath(apiRelativePath, extdi), context.appDir, true);
            await fileLoaderWithContext(makeLoadPath(apiRelativePath, ext), context, context.appDir);
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
        try {
            await Promise.all(pendingBuilds);
            await fastify.ready();
            fastify.swagger();
            const port = appOptions.PORT;
            const appHost = appOptions.HOST;
            const environment = context.environment;
            await fastify.listen({ port });
            console.log(passion(`🚀 Server started at http://${appHost}:${port}\n🚨️ Environment: ${environment}`));
            console.log(vice(`Swagger UI is available at http://${appHost}:${port}${uiSwaggerOptions.routePrefix}`));
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
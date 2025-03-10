import figlet from "figlet";
import boxen from 'boxen';
import { pastel, rainbow, cristal, vice, passion } from 'gradient-string';
import ora from 'ora';
import chalk from 'chalk';
import path from 'path';
import express from 'express';
import cors from 'cors';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import { createServer } from 'http';
import * as swaggerUiExpress from 'swagger-ui-express';
import { Container } from 'typedi';
import corsOptions from "./config/cors.config.js";
import swaggerOptions from './config/swagger.config.js';
import { App } from "./modules/app.js";
import { loadHelmetModule } from './modules/helmet.js';
import helmetOptions from './config/helmet.config.js';
export * as jsonschema from './modules/jsonschema.js';
import { createLogger, logger } from './modules/logger.js';
import fileLoader from './modules/file-loader.js';
import serverOptions from './config/server.config.js';
import customErrorHandlerMiddleware from './middlewares/error-handler.middleware.js';
import { loadMorganModule } from './modules/morgan.js';
import { findAvailablePort } from './modules/find-port.js';
import { getSyncQueueProvider } from '@tsdiapi/syncqueue';
import { getMetadataArgsStorage, useContainer as routingControllersUseContainer, useExpressServer, } from 'routing-controllers';
import { loadESMControllers } from './modules/load-esm-controllers.js';
export async function initApp(options) {
    try {
        await App.getAppConfig();
        const AppDir = App.appDir;
        const getConfig = App.getConfig.bind(App);
        const appConfig = App.appConfig;
        const environment = App.environment;
        const controllers = [AppDir + serverOptions.globControllersPath];
        const middlewares = [];
        const appDefaultOptions = {
            appConfig,
            environment,
            corsOptions: await corsOptions(),
            swaggerOptions: await swaggerOptions(),
            helmetOptions: await helmetOptions(),
            expressStaticOptions: {
                maxAge: 31557600000,
            },
        };
        console.log(pastel.multiline(figlet.textSync("TSDIAPI", { horizontalLayout: "full" })));
        const spinner = ora({
            text: chalk.blue("🔧 Initializing application..."),
            spinner: "dots",
        }).start();
        spinner.succeed(rainbow("✨ Starting the server..."));
        const appOptions = typeof options?.config === 'function' ? options.config(appDefaultOptions) : options?.config ? { ...appDefaultOptions, ...options.config } : appDefaultOptions;
        appOptions.helmetOptions = {
            ...appDefaultOptions.helmetOptions,
            ...appOptions.helmetOptions || {}
        };
        appOptions.corsOptions = {
            ...appDefaultOptions.corsOptions,
            ...appOptions.corsOptions || {}
        };
        appOptions.expressStaticOptions = {
            ...appDefaultOptions.expressStaticOptions,
            ...appOptions.expressStaticOptions || {}
        };
        const appPort = getConfig('PORT', 3100);
        const appName = getConfig('NAME', 'App');
        const appHost = getConfig('HOST', 'localhost');
        const appVersion = getConfig('VERSION', '1.0.0');
        appOptions['appName'] = appName;
        appOptions['appVersion'] = appVersion;
        appOptions['appPort'] = appPort;
        appOptions['appHost'] = appHost;
        let apiPrefix = getConfig('API_PREFIX', '/api/');
        if (!apiPrefix?.endsWith('/')) {
            apiPrefix = apiPrefix + '/';
        }
        appOptions['apiPrefix'] = apiPrefix;
        const app = express();
        const context = {
            app,
            apiDir: AppDir + '/api',
            routingControllersMetaStorage: null,
            schemas: {},
            appDir: AppDir,
            container: Container,
            config: appOptions,
            logger: await createLogger({ baseDir: appOptions?.loggerOptions?.baseDir || 'logs' }),
            plugins: {}
        };
        spinner.text = chalk.yellow("📦 Loading services...");
        const servicesPath = AppDir + serverOptions.globServicesPath;
        await fileLoader(servicesPath, true);
        Container.get(customErrorHandlerMiddleware);
        if (options?.plugins && options.plugins.length > 0) {
            for (const plugin of options.plugins) {
                if (plugin) {
                    context.plugins[plugin.name] = plugin;
                }
            }
            for (const plugin of options.plugins) {
                if (plugin.onInit) {
                    try {
                        await plugin.onInit(context);
                    }
                    catch (error) {
                        console.error(chalk.red(`⚠️ Plugin ${plugin.name} failed to initialize: ${error.message}`));
                    }
                }
                if (plugin?.globControllersPath) {
                    console.log(chalk.yellow(`Plugin "${plugin.name}" has auto-loaded controllers. The controllers will be included in the server.`));
                    controllers.push(plugin.globControllersPath);
                }
                if (plugin?.globMiddlewaresPath) {
                    console.log(chalk.yellow(`Plugin "${plugin.name}" has auto-loaded middlewares. The middlewares will be included in the server.`));
                    middlewares.push(plugin.globMiddlewaresPath);
                }
                if (plugin?.bootstrapFilesGlobPath) {
                    const startedWithSlash = plugin.bootstrapFilesGlobPath.startsWith("/") ? "" : "/";
                    try {
                        await fileLoader(AppDir + path.normalize("/api/**" + startedWithSlash + plugin.bootstrapFilesGlobPath), true);
                    }
                    catch (error) {
                        console.error(chalk.red(`⚠️ Plugin ${plugin.name} failed to load files: ${error.message}`));
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
        loadHelmetModule(app, appOptions.helmetOptions);
        app.use(cors(appOptions.corsOptions));
        app.options('*', cors());
        // Static files
        app.use("/public", express.static(path.join(AppDir, "public"), appOptions.expressStaticOptions));
        // Home page
        app.get("/", (req, res) => {
            res.json({
                title: appName,
                mode: appOptions.environment,
                date: new Date(),
            });
        });
        // 404 Page
        app.get("/404", function (req, res) {
            res.status(404).send({ status: 404, message: "Page Not Found!" });
        });
        routingControllersUseContainer(Container);
        loadMorganModule(app, logger);
        await loadESMControllers(controllers);
        await loadESMControllers([
            ...middlewares,
            AppDir + serverOptions.globMiddlewaresPath
        ]);
        useExpressServer(app, {
            validation: { stopAtFirstError: true, whitelist: true },
            cors: appOptions.corsOptions,
            classTransformer: true,
            defaultErrorHandler: false,
            routePrefix: apiPrefix
        });
        const syncQueueProvider = getSyncQueueProvider();
        await syncQueueProvider.resolveAll();
        syncQueueProvider.clear();
        const server = createServer(app);
        context.server = server;
        if (options?.plugins && options.plugins.length > 0) {
            for (const plugin of options.plugins) {
                if (plugin.beforeStart) {
                    try {
                        await plugin.beforeStart(context);
                    }
                    catch (error) {
                        console.error(chalk.red(`⚠️ Error in plugin "${plugin.name}" during beforeStart:\n`), error.stack || error);
                    }
                }
            }
        }
        if (options?.beforeStart) {
            try {
                await options.beforeStart(context);
            }
            catch (error) {
                console.error(`BeforeStart error:`, error);
            }
        }
        process.nextTick(async () => {
            const schemas = validationMetadatasToSchemas({
                refPointerPrefix: "#/components/schemas/",
            });
            const storage = getMetadataArgsStorage();
            context.routingControllersMetaStorage = storage;
            context.schemas = schemas;
            const defaultInfo = {
                description: `${appName} API Documentation`,
                title: appName,
                version: appVersion,
            };
            let info = defaultInfo;
            if (appOptions.swaggerOptions?.info) {
                if ("function" === typeof appOptions.swaggerOptions.info) {
                    info = appOptions.swaggerOptions.info(defaultInfo);
                }
                else if ("object" === typeof appOptions.swaggerOptions.info) {
                    info = {
                        ...defaultInfo,
                        ...appOptions.swaggerOptions.info,
                    };
                }
            }
            const spec = routingControllersToSpec(storage, { routePrefix: apiPrefix }, {
                components: {
                    schemas: schemas,
                    ...(appOptions.swaggerOptions?.securitySchemes ? { securitySchemes: appOptions.swaggerOptions.securitySchemes } : {}),
                },
                info: info,
            });
            const baseDir = appOptions?.swaggerOptions?.baseDir || '/docs';
            app.use(baseDir, swaggerUiExpress.serve, swaggerUiExpress.setup(spec));
            app.use("/docs-json", (req, res) => {
                res.json(spec);
            });
            const port = await findAvailablePort(appPort, 10);
            if (!port) {
                console.error(chalk.red("❌ Could not find an available port to start the server!"));
                return process.exit(1);
            }
            server.listen(port, async () => {
                try {
                    spinner.succeed(chalk.green("✅ Server started successfully!"));
                    logger.info(`🚀 Server started at http://${appHost}:${port}\n🚨️ Environment: ${appOptions.environment}`);
                    logger.info(`Documentation is available at http://${appHost}:${port}${baseDir}`);
                    const serverUrl = `http://${appHost}:${port}`;
                    const docsUrl = `http://${appHost}:${port}${baseDir}`;
                    console.log(boxen(`${chalk.green("🚀")} ${chalk.green("Server started successfully!")}\n` +
                        `${chalk.cyan("🌍 Server is running at:")} ${chalk.green(serverUrl)}\n` +
                        `${chalk.cyan("📖 API Docs:")} ${chalk.green(docsUrl)}`, { padding: 1, borderColor: "cyan", align: "left" }));
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
                catch (error) {
                    console.error(chalk.red("❌ Fatal error during application startup:"), error);
                }
            });
            server.on("error", (err) => {
                logger.error(err);
            });
            ["SIGINT", "SIGTERM"].forEach(signal => {
                process.on(signal, async () => {
                    console.error(boxen(cristal(`
                👋 Forced shutdown due to timeout.
                🔌 Some processes didn't close in time!
                💀 Terminating immediately...
                `), {
                        padding: 1,
                        margin: 1,
                        borderStyle: "bold",
                        borderColor: "red",
                        align: "left",
                    }));
                    await gracefulShutdown(server);
                });
            });
        });
    }
    catch (error) {
        console.error(chalk.red("❌ Fatal error during application startup:"), error);
    }
}
const gracefulShutdown = async (server) => {
    const shutdownSpinner = ora({
        text: passion("👋 Preparing for shutdown..."),
        spinner: "earth",
    }).start();
    shutdownSpinner.succeed(rainbow("✨ Almost done, cleaning up resources..."));
    server.close(() => {
        console.log(boxen(pastel(`
💥 Server has been shut down gracefully.
🔌 All connections closed. See you next time!
🚀 Keep building amazing things!`), {
            padding: 1,
            margin: 1,
            borderStyle: "double",
            borderColor: "magenta",
            align: "left",
        }));
        console.log(vice("\n👋 Bye-bye! Take care, and happy coding! 🚀\n"));
        process.exit(0);
    });
    process.exit(1);
};
//# sourceMappingURL=init.js.map
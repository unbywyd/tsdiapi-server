
import {
    getMetadataArgsStorage,
    useContainer as routingControllersUseContainer,
    useExpressServer,
} from 'routing-controllers';
import { routingControllersToSpec } from 'routing-controllers-openapi'
import { validationMetadatasToSchemas } from 'class-validator-jsonschema'
import { createServer, Server } from 'http'
import * as swaggerUiExpress from 'swagger-ui-express'
import { AsyncResolver } from 'prisma-class-dto-generator';

import path from 'path';
import express from 'express'
import cors from 'cors';

import corsOptions from "./config/cors.config";
import swaggerOptions from './config/swagger.config';
import { App } from "./modules/app";
import { AppContext, AppOptions, AppPlugin, CreateAppOptions } from "./types";
import { loadHelmetModule } from './modules/helmet';
import helmetOptions from './config/helmet.config';
import figlet from "figlet";
export * as jsonschema from './modules/jsonschema';
import type { HelmetOptions } from 'helmet';
import { createLogger, logger } from './modules/logger';
import Container from 'typedi';
import fileLoader, { getAppPath } from './modules/file-loader';
import serverOptions from './config/server.config';
import { CustomErrorHandler } from './middlewares/error-handler.middleware';
import { loadMorganModule } from './modules/morgan';
import { findAvailablePort } from './modules/find-port';

async function loadGradient() {
    return (await eval('import("gradient-string")')).default;
}
async function loadBoxen() {
    return (await eval('import("boxen")')).default;
}
async function loadOra() {
    return (await eval('import("ora")')).default;
}
async function loadChalk() {
    return (await eval('import("chalk")')).default;
}

export async function initApp(options?: CreateAppOptions) {
    const chalk = await loadChalk();
    try {
        await App.getAppConfig();
        const AppDir = App.appDir;
        const getConfig = App.getConfig.bind(App) as <T>(key: string, defaultValue?: T) => T;
        const appConfig = App.appConfig;
        const environment = App.environment;
        const controllers = [AppDir + serverOptions.globControllersPath];
        const middlewares = [];
        const appDefaultOptions: AppOptions = {
            appConfig,
            environment,
            corsOptions: await corsOptions(),
            swaggerOptions: await swaggerOptions(),
            helmetOptions: await helmetOptions(),
            expressStaticOptions: {
                maxAge: 31557600000,
            },
        }

        const ora = await loadOra();
        const gradient = await loadGradient();
        const boxen = await loadBoxen();

        console.log(gradient.pastel.multiline(figlet.textSync("TSDIAPI", { horizontalLayout: "full" })));

        const spinner = ora({
            text: chalk.blue("🔧 Initializing application..."),
            spinner: "dots",
        }).start();
        spinner.succeed(gradient.rainbow("✨ Starting the server..."));

        const appOptions = typeof options?.config === 'function' ? options.config(appDefaultOptions) : options?.config ? { ...appDefaultOptions, ...options.config } : appDefaultOptions;
        appOptions.helmetOptions = {
            ...appDefaultOptions.helmetOptions,
            ...appOptions.helmetOptions || {}
        } as HelmetOptions;

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

        const app: express.Application = express();
        const context: AppContext = {
            app,
            apiDir: AppDir + '/api',
            routingControllersMetaStorage: null,
            schemas: {},
            appDir: AppDir,
            container: Container,
            config: appOptions,
            logger: await createLogger({ baseDir: appOptions?.loggerOptions?.baseDir || 'logs' }),
            plugins: {} as Record<string, AppPlugin>
        }

        spinner.text = chalk.yellow("📦 Loading services...");
        const servicesPath = AppDir + serverOptions.globServicesPath;
        await fileLoader(servicesPath, true);
        Container.get(CustomErrorHandler);

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
                    } catch (error) {
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
                    } catch (error) {
                        console.error(chalk.red(`⚠️ Plugin ${plugin.name} failed to load files: ${error.message}`));
                    }
                }
            }
        }

        if (options?.onInit) {
            try {
                await options.onInit(context);
            } catch (error) {
                console.error(`OnInit error:`, error);
                process.exit(1);
            }
        }


        loadHelmetModule(app, appOptions.helmetOptions);
        app.use(cors(appOptions.corsOptions));
        app.options('*', cors());

        // Static files
        app.use(
            "/public",
            express.static(path.join(AppDir, "public"), appOptions.expressStaticOptions)
        );

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

        const packageMiddlewares = getAppPath() + '/middlewares/**/*.middleware{.ts,.js}';
        useExpressServer(app, {
            validation: { stopAtFirstError: true, whitelist: true },
            cors: appOptions.corsOptions,
            classTransformer: true,
            defaultErrorHandler: false,
            routePrefix: apiPrefix,
            controllers: controllers,
            middlewares: [
                ...middlewares,
                packageMiddlewares,
                AppDir + serverOptions.globMiddlewaresPath
            ],
        });
        await AsyncResolver.resolveAll();
        const server: Server = createServer(app);

        context.server = server;

        if (options?.plugins && options.plugins.length > 0) {
            for (const plugin of options.plugins) {
                if (plugin.beforeStart) {
                    try {
                        await plugin.beforeStart(context);
                    } catch (error) {
                        console.error(chalk.red(`⚠️ Error in plugin "${plugin.name}" during beforeStart:\n`), error.stack || error);
                    }
                }
            }
        }

        if (options?.beforeStart) {
            try {
                await options.beforeStart(context);
            } catch (error) {
                console.error(`BeforeStart error:`, error);
            }
        }

        process.nextTick(async () => {
            const schemas = validationMetadatasToSchemas({
                refPointerPrefix: "#/components/schemas/",
            });

            const storage = getMetadataArgsStorage();

            context.routingControllersMetaStorage = storage;
            context.schemas = schemas as any;

            const defaultInfo = {
                description: `${appName} API Documentation`,
                title: appName,
                version: appVersion,
            };
            let info = defaultInfo;
            if (appOptions.swaggerOptions?.info) {
                if ("function" === typeof appOptions.swaggerOptions.info) {
                    info = appOptions.swaggerOptions.info(defaultInfo);
                } else if ("object" === typeof appOptions.swaggerOptions.info) {
                    info = {
                        ...defaultInfo,
                        ...appOptions.swaggerOptions.info,
                    }
                }
            }
            const spec = routingControllersToSpec(
                storage,
                { routePrefix: apiPrefix },
                {
                    components: {
                        schemas: schemas as any,
                        ...(appOptions.swaggerOptions?.securitySchemes ? { securitySchemes: appOptions.swaggerOptions.securitySchemes } : {}),
                    },

                    info: info,
                }
            );
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
                    console.log(
                        boxen(
                            `${chalk.green("🚀")} ${chalk.green("Server started successfully!")}\n` +
                            `${chalk.cyan("🌍 Server is running at:")} ${chalk.green(serverUrl)}\n` +
                            `${chalk.cyan("📖 API Docs:")} ${chalk.green(docsUrl)}`,
                            { padding: 1, borderColor: "cyan", align: "left" }
                        )
                    );

                    if (options?.afterStart) {
                        try {
                            await options.afterStart(context);
                        } catch (error) {
                            console.error(error);
                        }
                    }
                    if (options?.plugins && options.plugins.length > 0) {
                        for (const plugin of options.plugins) {
                            if (plugin.afterStart) {
                                try {
                                    await plugin.afterStart(context);
                                } catch (error) {
                                    console.error(error);
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error(chalk.red("❌ Fatal error during application startup:"), error);
                }
            });
            server.on("error", (err: any) => {
                logger.error(err);
            });

            ["SIGINT", "SIGTERM"].forEach(signal => {
                process.on(signal, async () => {
                    console.log(chalk.yellow(`⚠️ Received ${signal}, shutting down gracefully...`));
                    await gracefulShutdown(server);
                });
            });
        });

    } catch (error) {
        console.error(chalk.red("❌ Fatal error during application startup:"), error);
    }
}

const gracefulShutdown = async (server: Server) => {
    const ora = await loadOra();
    const gradient = await loadGradient();
    const boxen = await loadBoxen();

    const shutdownSpinner = ora({
        text: gradient.passion("👋 Preparing for shutdown..."),
        spinner: "earth",
    }).start();

    shutdownSpinner.succeed(gradient.rainbow("✨ Almost done, cleaning up resources..."));

    server.close(() => {
        console.log(
            boxen(
                gradient.pastel(`
💥 Server has been shut down gracefully.
🔌 All connections closed. See you next time!
🚀 Keep building amazing things!`),
                {
                    padding: 1,
                    margin: 1,
                    borderStyle: "double",
                    borderColor: "magenta",
                    align: "left",
                }
            )
        );

        console.log(gradient.vice("\n👋 Bye-bye! Take care, and happy coding! 🚀\n"));
        process.exit(0);
    });

    console.error(
        boxen(
            gradient.cristal(`
👋 Forced shutdown due to timeout.
🔌 Some processes didn't close in time!
💀 Terminating immediately...
`),
            {
                padding: 1,
                margin: 1,
                borderStyle: "bold",
                borderColor: "red",
                align: "left",
            }
        )
    );
    process.exit(1);
};

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonschema = void 0;
exports.initApp = initApp;
const routing_controllers_1 = require("routing-controllers");
const routing_controllers_openapi_1 = require("routing-controllers-openapi");
const class_validator_jsonschema_1 = require("class-validator-jsonschema");
const http_1 = require("http");
const swaggerUiExpress = __importStar(require("swagger-ui-express"));
const routing_controllers_openapi_extra_1 = require("routing-controllers-openapi-extra");
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cors_config_1 = __importDefault(require("./config/cors.config"));
const swagger_config_1 = __importDefault(require("./config/swagger.config"));
const app_1 = require("./modules/app");
const helmet_1 = require("./modules/helmet");
const helmet_config_1 = __importDefault(require("./config/helmet.config"));
const figlet_1 = __importDefault(require("figlet"));
exports.jsonschema = __importStar(require("./modules/jsonschema"));
const logger_1 = require("./modules/logger");
const typedi_1 = __importDefault(require("typedi"));
const file_loader_1 = __importStar(require("./modules/file-loader"));
const server_config_1 = __importDefault(require("./config/server.config"));
const error_handler_middleware_1 = require("./middlewares/error-handler.middleware");
const morgan_1 = require("./modules/morgan");
function loadGradient() {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield eval('import("gradient-string")')).default;
    });
}
function loadBoxen() {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield eval('import("boxen")')).default;
    });
}
function loadOra() {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield eval('import("ora")')).default;
    });
}
function loadChalk() {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield eval('import("chalk")')).default;
    });
}
function initApp(options) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const chalk = yield loadChalk();
        try {
            yield app_1.App.getAppConfig();
            const AppDir = app_1.App.appDir;
            const getConfig = app_1.App.getConfig.bind(app_1.App);
            const appConfig = app_1.App.appConfig;
            const environment = app_1.App.environment;
            const controllers = [AppDir + server_config_1.default.globControllersPath];
            const middlewares = [];
            const appDefaultOptions = {
                appConfig,
                environment,
                corsOptions: yield (0, cors_config_1.default)(),
                swaggerOptions: yield (0, swagger_config_1.default)(),
                helmetOptions: yield (0, helmet_config_1.default)(),
                expressStaticOptions: {
                    maxAge: 31557600000,
                },
            };
            const ora = yield loadOra();
            const gradient = yield loadGradient();
            const boxen = yield loadBoxen();
            console.log(gradient.pastel.multiline(figlet_1.default.textSync("TSDIAPI", { horizontalLayout: "full" })));
            const spinner = ora({
                text: chalk.blue("🔧 Initializing application..."),
                spinner: "dots",
            }).start();
            spinner.succeed(gradient.rainbow("✨ Starting the server..."));
            const appOptions = typeof (options === null || options === void 0 ? void 0 : options.config) === 'function' ? options.config(appDefaultOptions) : (options === null || options === void 0 ? void 0 : options.config) ? Object.assign(Object.assign({}, appDefaultOptions), options.config) : appDefaultOptions;
            appOptions.helmetOptions = Object.assign(Object.assign({}, appDefaultOptions.helmetOptions), appOptions.helmetOptions || {});
            appOptions.corsOptions = Object.assign(Object.assign({}, appDefaultOptions.corsOptions), appOptions.corsOptions || {});
            appOptions.expressStaticOptions = Object.assign(Object.assign({}, appDefaultOptions.expressStaticOptions), appOptions.expressStaticOptions || {});
            const appPort = getConfig('PORT', 3100);
            const appName = getConfig('NAME', 'App');
            const appHost = getConfig('HOST', 'localhost');
            const appVersion = getConfig('VERSION', '1.0.0');
            appOptions['appName'] = appName;
            appOptions['appVersion'] = appVersion;
            appOptions['appPort'] = appPort;
            appOptions['appHost'] = appHost;
            let apiPrefix = getConfig('API_PREFIX', '/api/');
            if (!(apiPrefix === null || apiPrefix === void 0 ? void 0 : apiPrefix.endsWith('/'))) {
                apiPrefix = apiPrefix + '/';
            }
            appOptions['apiPrefix'] = apiPrefix;
            const app = (0, express_1.default)();
            const context = {
                app,
                apiDir: AppDir + '/api',
                routingControllersMetaStorage: null,
                schemas: {},
                appDir: AppDir,
                container: typedi_1.default,
                config: appOptions,
                logger: yield (0, logger_1.createLogger)({ baseDir: ((_a = appOptions === null || appOptions === void 0 ? void 0 : appOptions.loggerOptions) === null || _a === void 0 ? void 0 : _a.baseDir) || 'logs' }),
                plugins: {}
            };
            spinner.text = chalk.yellow("📦 Loading services...");
            const servicesPath = AppDir + server_config_1.default.globServicesPath;
            yield (0, file_loader_1.default)(servicesPath, true);
            typedi_1.default.get(error_handler_middleware_1.CustomErrorHandler);
            if ((options === null || options === void 0 ? void 0 : options.plugins) && options.plugins.length > 0) {
                for (const plugin of options.plugins) {
                    if (plugin) {
                        context.plugins[plugin.name] = plugin;
                    }
                }
                for (const plugin of options.plugins) {
                    if (plugin.onInit) {
                        try {
                            yield plugin.onInit(context);
                        }
                        catch (error) {
                            console.error(chalk.red(`⚠️ Plugin ${plugin.name} failed to initialize: ${error.message}`));
                        }
                    }
                    if (plugin === null || plugin === void 0 ? void 0 : plugin.globControllersPath) {
                        console.log(chalk.yellow(`Plugin "${plugin.name}" has auto-loaded controllers. The controllers will be included in the server.`));
                        controllers.push(plugin.globControllersPath);
                    }
                    if (plugin === null || plugin === void 0 ? void 0 : plugin.globMiddlewaresPath) {
                        console.log(chalk.yellow(`Plugin "${plugin.name}" has auto-loaded middlewares. The middlewares will be included in the server.`));
                        middlewares.push(plugin.globMiddlewaresPath);
                    }
                    if (plugin === null || plugin === void 0 ? void 0 : plugin.bootstrapFilesGlobPath) {
                        const startedWithSlash = plugin.bootstrapFilesGlobPath.startsWith("/") ? "" : "/";
                        try {
                            yield (0, file_loader_1.default)(AppDir + path_1.default.normalize("/api/**" + startedWithSlash + plugin.bootstrapFilesGlobPath), true);
                        }
                        catch (error) {
                            console.error(chalk.red(`⚠️ Plugin ${plugin.name} failed to load files: ${error.message}`));
                        }
                    }
                }
            }
            if (options === null || options === void 0 ? void 0 : options.onInit) {
                try {
                    yield options.onInit(context);
                }
                catch (error) {
                    console.error(`OnInit error:`, error);
                    process.exit(1);
                }
            }
            (0, helmet_1.loadHelmetModule)(app, appOptions.helmetOptions);
            app.use((0, cors_1.default)(appOptions.corsOptions));
            app.options('*', (0, cors_1.default)());
            // Static files
            app.use("/public", express_1.default.static(path_1.default.join(AppDir, "public"), appOptions.expressStaticOptions));
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
            (0, routing_controllers_1.useContainer)(typedi_1.default);
            (0, morgan_1.loadMorganModule)(app, logger_1.logger);
            const packageMiddlewares = (0, file_loader_1.getAppPath)() + '/middlewares/**/*.middleware{.ts,.js}';
            (0, routing_controllers_1.useExpressServer)(app, {
                validation: { stopAtFirstError: true, whitelist: true },
                cors: appOptions.corsOptions,
                classTransformer: true,
                defaultErrorHandler: false,
                routePrefix: apiPrefix,
                controllers: controllers,
                middlewares: [
                    ...middlewares,
                    packageMiddlewares,
                    AppDir + server_config_1.default.globMiddlewaresPath
                ],
            });
            yield routing_controllers_openapi_extra_1.AsyncResolver.resolveAll();
            const server = (0, http_1.createServer)(app);
            context.server = server;
            if ((options === null || options === void 0 ? void 0 : options.plugins) && options.plugins.length > 0) {
                for (const plugin of options.plugins) {
                    if (plugin.beforeStart) {
                        try {
                            yield plugin.beforeStart(context);
                        }
                        catch (error) {
                            console.error(chalk.red(`⚠️ Error in plugin "${plugin.name}" during beforeStart:\n`), error.stack || error);
                        }
                    }
                }
            }
            if (options === null || options === void 0 ? void 0 : options.beforeStart) {
                try {
                    yield options.beforeStart(context);
                }
                catch (error) {
                    console.error(`BeforeStart error:`, error);
                }
            }
            process.nextTick(() => __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c;
                const schemas = (0, class_validator_jsonschema_1.validationMetadatasToSchemas)({
                    refPointerPrefix: "#/components/schemas/",
                });
                const storage = (0, routing_controllers_1.getMetadataArgsStorage)();
                context.routingControllersMetaStorage = storage;
                context.schemas = schemas;
                const defaultInfo = {
                    description: `${appName} API Documentation`,
                    title: appName,
                    version: appVersion,
                };
                let info = defaultInfo;
                if ((_a = appOptions.swaggerOptions) === null || _a === void 0 ? void 0 : _a.info) {
                    if ("function" === typeof appOptions.swaggerOptions.info) {
                        info = appOptions.swaggerOptions.info(defaultInfo);
                    }
                    else if ("object" === typeof appOptions.swaggerOptions.info) {
                        info = Object.assign(Object.assign({}, defaultInfo), appOptions.swaggerOptions.info);
                    }
                }
                const spec = (0, routing_controllers_openapi_1.routingControllersToSpec)(storage, { routePrefix: apiPrefix }, {
                    components: Object.assign({ schemas: schemas }, (((_b = appOptions.swaggerOptions) === null || _b === void 0 ? void 0 : _b.securitySchemes) ? { securitySchemes: appOptions.swaggerOptions.securitySchemes } : {})),
                    info: info,
                });
                const baseDir = ((_c = appOptions === null || appOptions === void 0 ? void 0 : appOptions.swaggerOptions) === null || _c === void 0 ? void 0 : _c.baseDir) || '/docs';
                app.use(baseDir, swaggerUiExpress.serve, swaggerUiExpress.setup(spec));
                app.use("/docs-json", (req, res) => {
                    res.json(spec);
                });
                server.listen(appPort, () => __awaiter(this, void 0, void 0, function* () {
                    try {
                        spinner.succeed(chalk.green("✅ Server started successfully!"));
                        logger_1.logger.info(`🚀 Server started at http://${appHost}:${appPort}\n🚨️ Environment: ${appOptions.environment}`);
                        logger_1.logger.info(`Documentation is available at http://${appHost}:${appPort}${baseDir}`);
                        const serverUrl = `http://${appHost}:${appPort}`;
                        const docsUrl = `http://${appHost}:${appPort}${baseDir}`;
                        console.log(boxen(`${chalk.green("🚀")} ${chalk.green("Server started successfully!")}\n` +
                            `${chalk.cyan("🌍 Server is running at:")} ${chalk.green(serverUrl)}\n` +
                            `${chalk.cyan("📖 API Docs:")} ${chalk.green(docsUrl)}`, { padding: 1, borderColor: "cyan", align: "left" }));
                        if (options === null || options === void 0 ? void 0 : options.afterStart) {
                            try {
                                yield options.afterStart(context);
                            }
                            catch (error) {
                                console.error(error);
                            }
                        }
                        if ((options === null || options === void 0 ? void 0 : options.plugins) && options.plugins.length > 0) {
                            for (const plugin of options.plugins) {
                                if (plugin.afterStart) {
                                    try {
                                        yield plugin.afterStart(context);
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
                }));
                server.on("error", (err) => {
                    logger_1.logger.error(err);
                });
                ["SIGINT", "SIGTERM"].forEach(signal => {
                    process.on(signal, () => __awaiter(this, void 0, void 0, function* () {
                        console.log(chalk.yellow(`⚠️ Received ${signal}, shutting down gracefully...`));
                        yield gracefulShutdown(server);
                    }));
                });
            }));
        }
        catch (error) {
            console.error(chalk.red("❌ Fatal error during application startup:"), error);
        }
    });
}
const gracefulShutdown = (server) => __awaiter(void 0, void 0, void 0, function* () {
    const ora = yield loadOra();
    const gradient = yield loadGradient();
    const boxen = yield loadBoxen();
    const shutdownSpinner = ora({
        text: gradient.passion("👋 Preparing for shutdown..."),
        spinner: "earth",
    }).start();
    shutdownSpinner.succeed(gradient.rainbow("✨ Almost done, cleaning up resources..."));
    server.close(() => {
        console.log(boxen(gradient.pastel(`
💥 Server has been shut down gracefully.
🔌 All connections closed. See you next time!
🚀 Keep building amazing things!`), {
            padding: 1,
            margin: 1,
            borderStyle: "double",
            borderColor: "magenta",
            align: "left",
        }));
        console.log(gradient.vice("\n👋 Bye-bye! Take care, and happy coding! 🚀\n"));
        process.exit(0);
    });
    console.error(boxen(gradient.cristal(`
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
    process.exit(1);
});
//# sourceMappingURL=init.js.map
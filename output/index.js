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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
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
exports.Container = exports.logger = exports.getConfig = exports.environment = exports.AppDir = exports.AppConfig = exports.jsonschema = void 0;
exports.createApp = createApp;
require("reflect-metadata");
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routing_controllers_1 = require("routing-controllers");
const routing_controllers_openapi_1 = require("routing-controllers-openapi");
const app_1 = require("./modules/app");
Object.defineProperty(exports, "getConfig", { enumerable: true, get: function () { return app_1.getConfig; } });
Object.defineProperty(exports, "environment", { enumerable: true, get: function () { return app_1.environment; } });
Object.defineProperty(exports, "AppConfig", { enumerable: true, get: function () { return app_1.AppConfig; } });
Object.defineProperty(exports, "AppDir", { enumerable: true, get: function () { return app_1.AppDir; } });
(0, app_1.initAppModule)({
    appCwd: process.cwd()
});
const class_validator_jsonschema_1 = require("class-validator-jsonschema");
const server_config_1 = __importDefault(require("./config/server.config"));
const cors_config_1 = __importDefault(require("./config/cors.config"));
const swagger_config_1 = __importDefault(require("./config/swagger.config"));
const logger_1 = require("./modules/logger");
Object.defineProperty(exports, "logger", { enumerable: true, get: function () { return logger_1.logger; } });
const morgan_1 = require("./modules/morgan");
const helmet_1 = require("./modules/helmet");
const http_1 = require("http");
const swaggerUiExpress = __importStar(require("swagger-ui-express"));
const file_loader_1 = __importDefault(require("./modules/file-loader"));
const routing_controllers_openapi_extra_1 = require("routing-controllers-openapi-extra");
const typedi_1 = __importDefault(require("typedi"));
exports.Container = typedi_1.default;
const helmet_config_1 = __importDefault(require("./config/helmet.config"));
const chalk_1 = __importDefault(require("chalk"));
__exportStar(require("./types"), exports);
const figlet_1 = __importDefault(require("figlet"));
exports.jsonschema = __importStar(require("./modules/jsonschema"));
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
const appDefaultOptions = {
    appConfig: app_1.AppConfig,
    environment: app_1.environment,
    corsOptions: cors_config_1.default,
    swaggerOptions: swagger_config_1.default,
    helmetOptions: helmet_config_1.default,
    expressStaticOptions: {
        maxAge: 31557600000,
    },
};
function createApp(options) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const ora = yield loadOra();
            const gradient = yield loadGradient();
            const boxen = yield loadBoxen();
            console.log(gradient.pastel.multiline(figlet_1.default.textSync("TSDIAPI", { horizontalLayout: "full" })));
            const spinner = ora({
                text: chalk_1.default.blue("🔧 Initializing application..."),
                spinner: "dots",
            }).start();
            spinner.succeed(gradient.rainbow("✨ Starting the server..."));
            const appOptions = typeof (options === null || options === void 0 ? void 0 : options.config) === 'function' ? options.config(appDefaultOptions) : (options === null || options === void 0 ? void 0 : options.config) ? Object.assign(Object.assign({}, appDefaultOptions), options.config) : appDefaultOptions;
            appOptions.helmetOptions = Object.assign(Object.assign({}, appDefaultOptions.helmetOptions), appOptions.helmetOptions || {});
            appOptions.corsOptions = Object.assign(Object.assign({}, appDefaultOptions.corsOptions), appOptions.corsOptions || {});
            appOptions.expressStaticOptions = Object.assign(Object.assign({}, appDefaultOptions.expressStaticOptions), appOptions.expressStaticOptions || {});
            const app = (0, express_1.default)();
            const context = {
                app,
                apiDir: app_1.AppDir + '/api',
                routingControllersMetaStorage: null,
                schemas: {},
                appDir: app_1.AppDir,
                container: typedi_1.default,
                config: appOptions,
                logger: (0, logger_1.createLogger)({ baseDir: ((_a = appOptions === null || appOptions === void 0 ? void 0 : appOptions.loggerOptions) === null || _a === void 0 ? void 0 : _a.baseDir) || 'logs' }),
                plugins: {}
            };
            spinner.text = chalk_1.default.yellow("📦 Loading services...");
            // First load all the services
            const servicesPath = app_1.AppDir + server_config_1.default.globServicesPath;
            yield (0, file_loader_1.default)(servicesPath, true);
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
                            console.error(chalk_1.default.red(`⚠️ Plugin ${plugin.name} failed to initialize: ${error.message}`));
                        }
                    }
                    if (plugin === null || plugin === void 0 ? void 0 : plugin.bootstrapFilesGlobPath) {
                        const startedWithSlash = plugin.bootstrapFilesGlobPath.startsWith("/") ? "" : "/";
                        try {
                            yield (0, file_loader_1.default)(app_1.AppDir + "/api/**" + startedWithSlash + plugin.bootstrapFilesGlobPath, true);
                        }
                        catch (error) {
                            console.error(chalk_1.default.red(`⚠️ Plugin ${plugin.name} failed to load files: ${error.message}`));
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
            const apiPrefix = (0, app_1.getConfig)('API_PREFIX', '/api');
            const appPort = (0, app_1.getConfig)('PORT', 3100);
            const appName = (0, app_1.getConfig)('NAME', 'App');
            const appHost = (0, app_1.getConfig)('HOST', 'localhost');
            const appVersion = (0, app_1.getConfig)('VERSION', '1.0.0');
            (0, helmet_1.loadHelmetModule)(app, appOptions.helmetOptions);
            app.use((0, cors_1.default)(appOptions.corsOptions));
            app.options('*', (0, cors_1.default)());
            // Static files
            app.use("/public", express_1.default.static(path_1.default.join(app_1.AppDir, "public"), appOptions.expressStaticOptions));
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
            (0, routing_controllers_1.useExpressServer)(app, {
                validation: { stopAtFirstError: true, whitelist: true },
                cors: appOptions.corsOptions,
                classTransformer: true,
                defaultErrorHandler: false,
                routePrefix: apiPrefix,
                controllers: [app_1.AppDir + server_config_1.default.globControllersPath],
                middlewares: [
                    app_1.AppDir + '/app/middlewares/**/*.middleware.ts',
                    app_1.AppDir + server_config_1.default.globMiddlewaresPath
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
                            console.error(chalk_1.default.red(`⚠️ Error in plugin "${plugin.name}" during beforeStart:\n`), error.stack || error);
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
                        spinner.succeed(chalk_1.default.green("✅ Server started successfully!"));
                        logger_1.logger.info(`🚀 Server started at http://${appHost}:${appPort}\n🚨️ Environment: ${appOptions.environment}`);
                        logger_1.logger.info(`Documentation is available at http://${appHost}:${appPort}${baseDir}`);
                        const serverUrl = `http://${appHost}:${appPort}`;
                        const docsUrl = `http://${appHost}:${appPort}${baseDir}`;
                        console.log(boxen(`${chalk_1.default.green("🚀")} ${chalk_1.default.green("Server started successfully!")}\n` +
                            `${chalk_1.default.cyan("🌍 Server is running at:")} ${chalk_1.default.green(serverUrl)}\n` +
                            `${chalk_1.default.cyan("📖 API Docs:")} ${chalk_1.default.green(docsUrl)}`, { padding: 1, borderColor: "cyan", align: "left" }));
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
                        console.error(chalk_1.default.red("❌ Fatal error during application startup:"), error);
                    }
                }));
                server.on("error", (err) => {
                    logger_1.logger.error(err);
                });
                ["SIGINT", "SIGTERM"].forEach(signal => {
                    process.on(signal, () => __awaiter(this, void 0, void 0, function* () {
                        console.log(chalk_1.default.yellow(`⚠️ Received ${signal}, shutting down gracefully...`));
                        yield gracefulShutdown(server);
                    }));
                });
            }));
        }
        catch (error) {
            console.error(chalk_1.default.red("❌ Fatal error during application startup:"), error);
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
    setTimeout(() => {
        console.error(boxen(gradient.cristal(`
⏳ Forced shutdown due to timeout.
⚠ Some processes didn't close in time!
💀 Terminating immediately...
                `), {
            padding: 1,
            margin: 1,
            borderStyle: "bold",
            borderColor: "red",
            align: "left",
        }));
        process.exit(1);
    }, 5000);
});
//# sourceMappingURL=index.js.map
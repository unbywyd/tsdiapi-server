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
exports.App = void 0;
const dotenv = __importStar(require("dotenv"));
const class_transformer_1 = require("class-transformer");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const module_alias_1 = __importDefault(require("module-alias"));
class AppModule {
    constructor() {
        this.appDir = null;
        this.appRoot = null;
        this.environment = 'development';
        this.isProduction = false;
        this.isDevelopment = false;
        this.appConfig = null;
        this.initialized = false;
        this.alias = {
            '@base': '',
            '@api': '/api',
            '@features': '/api/features',
        };
    }
    getEnvFile(baseDir) {
        const envFilePath = path_1.default.resolve(baseDir, `.env.${process.env.NODE_ENV}`);
        if (fs_1.default.existsSync(envFilePath))
            return envFilePath;
        const defaultEnvFilePath = path_1.default.resolve(baseDir, '.env');
        if (fs_1.default.existsSync(defaultEnvFilePath)) {
            console.log(`Environment file not found: ${envFilePath}. Using default: ${defaultEnvFilePath}`);
            return defaultEnvFilePath;
        }
        return null;
    }
    fixModuleAlias(dirName) {
        const newAlias = Object.entries(this.alias).reduce((acc, [key, value]) => {
            acc[key] = dirName + value;
            return acc;
        }, {});
        module_alias_1.default.addAliases(newAlias);
    }
    getRootDir(cwd) {
        return this.isProduction ? path_1.default.join(cwd, 'dist') : path_1.default.join(cwd, 'src');
    }
    initialize(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.initialized)
                return;
            this.environment = process.env.NODE_ENV || 'development';
            this.isProduction = this.environment === 'production';
            this.isDevelopment = this.environment === 'development';
            this.appRoot = options.appCwd;
            this.appDir = this.getRootDir(options.appCwd);
            this.fixModuleAlias(this.appDir);
            const envFile = this.getEnvFile(this.appRoot);
            if (envFile) {
                dotenv.config({ path: envFile });
            }
            else {
                console.warn(`Environment file not found: ${envFile}`);
            }
            yield this.loadConfig();
            this.initialized = true;
        });
    }
    getAppConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.appConfig) {
                yield this.loadConfig();
            }
            return this.appConfig;
        });
    }
    loadConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.appConfig)
                return;
            const configAppFile = path_1.default.resolve(this.appDir, this.isDevelopment ? 'app.config.ts' : 'app.config.js');
            if (fs_1.default.existsSync(configAppFile)) {
                try {
                    const module = yield Promise.resolve(`${configAppFile}`).then(s => __importStar(require(s)));
                    const ConfigSchema = module.default;
                    this.appConfig = ConfigSchema ? this.createAppConfig(ConfigSchema) : this.createAppConfig();
                }
                catch (error) {
                    console.error(`Error loading config file: ${configAppFile}`, error);
                }
            }
            else {
                console.warn(`App config file not found: ${configAppFile}`);
                this.appConfig = this.createAppConfig();
            }
        });
    }
    _prepareEnv(env) {
        var _a;
        const envData = Object.assign({}, env);
        for (const key in envData) {
            const value = (_a = envData[key]) === null || _a === void 0 ? void 0 : _a.trim();
            if (value === 'true')
                envData[key] = true;
            else if (value === 'false')
                envData[key] = false;
            else if (value === 'null')
                envData[key] = null;
            else if (value === 'undefined')
                envData[key] = undefined;
        }
        return envData;
    }
    createAppConfig(ConfigSchema) {
        if (!ConfigSchema) {
            return (this.appConfig = this._prepareEnv(process.env || {}));
        }
        return (this.appConfig = (0, class_transformer_1.plainToClass)(ConfigSchema, this._prepareEnv(process.env || {}), {
            excludeExtraneousValues: true,
            exposeDefaultValues: true,
        }));
    }
    getConfig(key, defaultValue) {
        var _a;
        return ((_a = this.appConfig) === null || _a === void 0 ? void 0 : _a[key]) !== undefined ? this.appConfig[key] : defaultValue;
    }
    getAppDir() {
        return this.appDir;
    }
    getAppRoot() {
        return this.appRoot;
    }
    isProd() {
        return this.isProduction;
    }
    isDev() {
        return this.isDevelopment;
    }
}
exports.App = new AppModule();
//# sourceMappingURL=app.js.map
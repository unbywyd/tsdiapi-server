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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsDevelopment = exports.IsProduction = exports.environment = exports.AppRoot = exports.AppDir = exports.AppConfig = exports.getConfig = exports.createAppConfig = exports.initAppModule = exports.getRootDir = void 0;
const dotenv = __importStar(require("dotenv"));
const class_transformer_1 = require("class-transformer");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const module_alias_1 = __importDefault(require("module-alias"));
let AppDir = null;
exports.AppDir = AppDir;
let AppRoot = null;
exports.AppRoot = AppRoot;
let environment = 'development';
exports.environment = environment;
let IsProduction = false;
exports.IsProduction = IsProduction;
let IsDevelopment = false;
exports.IsDevelopment = IsDevelopment;
const getEnvFile = (baseDir) => {
    const fp = path_1.default.resolve(baseDir, `.env.${process.env.NODE_ENV}`);
    if (fs_1.default.existsSync(fp)) {
        return fp;
    }
    const fpDefault = path_1.default.resolve(baseDir, '.env');
    if (fs_1.default.existsSync(fpDefault)) {
        console.log(`Environment file not found: ${fp}. Using default: ${fpDefault}`);
        return fpDefault;
    }
    return null;
};
const alias = {
    '@base': '',
    '@api': '/api',
    "@features": "/api/features",
};
function fixModuleAlias(dirName) {
    const newAlias = Object.keys(alias).reduce((acc, key) => {
        const _acc = acc;
        const _alias = alias;
        _acc[key] = dirName + _alias[key];
        return acc;
    }, {});
    module_alias_1.default.addAliases(newAlias);
}
const getRootDir = (cwd) => {
    return IsProduction ? path_1.default.join(cwd, 'dist') : path_1.default.join(cwd, 'src');
};
exports.getRootDir = getRootDir;
const initAppModule = (options) => {
    exports.environment = environment = process.env.NODE_ENV || 'development';
    exports.IsProduction = IsProduction = environment === 'production';
    exports.IsDevelopment = IsDevelopment = environment === 'development';
    exports.AppDir = AppDir = (0, exports.getRootDir)(options.appCwd);
    exports.AppRoot = AppRoot = options.appCwd;
    fixModuleAlias(AppDir);
    const envFile = getEnvFile(AppRoot);
    if (envFile) {
        dotenv.config({
            path: envFile,
        });
    }
    else {
        console.warn(`Environment file not found: ${envFile}`);
    }
    const configAppFile = path_1.default.resolve(AppDir, IsDevelopment ? 'app.config.ts' : 'app.config.js');
    if (fs_1.default.existsSync(configAppFile)) {
        try {
            // Синхронный импорт через require
            const module = require(configAppFile);
            const ConfigSchema = module.default;
            if (ConfigSchema) {
                (0, exports.createAppConfig)(ConfigSchema);
            }
            else {
                console.warn(`ConfigSchema not found in: ${configAppFile}`);
                (0, exports.createAppConfig)();
            }
        }
        catch (error) {
            console.error(`Error loading config file: ${configAppFile}`, error);
        }
    }
    else {
        console.warn(`App config file not found: ${configAppFile}`);
        (0, exports.createAppConfig)();
    }
};
exports.initAppModule = initAppModule;
const _prepareEnv = (env) => {
    var _a;
    const envData = Object.assign({}, env);
    for (const key in envData) {
        const value = (_a = envData[key]) === null || _a === void 0 ? void 0 : _a.trim();
        if (value === 'true') {
            envData[key] = true;
        }
        else if (value === 'false') {
            envData[key] = false;
        }
        else if (value === 'null') {
            envData[key] = null;
        }
        else if (value === 'undefined') {
            envData[key] = undefined;
        }
    }
    return envData;
};
let AppConfig = null;
exports.AppConfig = AppConfig;
const createAppConfig = (ConfigSchema) => {
    if (!ConfigSchema) {
        exports.AppConfig = AppConfig = _prepareEnv(process.env || {});
        return AppConfig;
    }
    exports.AppConfig = AppConfig = (0, class_transformer_1.plainToClass)(ConfigSchema, _prepareEnv(process.env || {}), {
        excludeExtraneousValues: true,
        exposeDefaultValues: true,
    });
    return AppConfig;
};
exports.createAppConfig = createAppConfig;
const getConfig = (key, defaultValue) => {
    return AppConfig[key] !== undefined ? AppConfig[key] : defaultValue;
};
exports.getConfig = getConfig;
//# sourceMappingURL=app.js.map
import * as dotenv from 'dotenv';
import { plainToClass } from 'class-transformer';
import path from 'path';
import fs from 'fs';
import ModuleAlias from 'module-alias';
import { pathToFileURL } from 'node:url';
class AppModule {
    appDir = null;
    appRoot = null;
    environment = 'development';
    isProduction = false;
    isDevelopment = false;
    appConfig = null;
    initialized = false;
    alias = {
        '@base': '',
        '@api': '/api',
        '@features': '/api/features',
    };
    getEnvFile(baseDir) {
        const envFilePath = path.resolve(baseDir, `.env.${process.env.NODE_ENV}`);
        if (fs.existsSync(envFilePath))
            return envFilePath;
        const defaultEnvFilePath = path.resolve(baseDir, '.env');
        if (fs.existsSync(defaultEnvFilePath)) {
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
        ModuleAlias.addAliases(newAlias);
    }
    getRootDir(cwd) {
        return this.isProduction ? path.join(cwd, 'dist') : path.join(cwd, 'src');
    }
    async initialize(options) {
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
        await this.loadConfig();
        this.initialized = true;
    }
    async getAppConfig() {
        if (!this.appConfig) {
            await this.loadConfig();
        }
        return this.appConfig;
    }
    async loadConfig() {
        if (this.appConfig)
            return;
        const configAppFile = path.resolve(this.appDir, this.isDevelopment ? 'app.config.ts' : 'app.config.js');
        if (fs.existsSync(configAppFile)) {
            try {
                // Convert the absolute path to a file:// URL
                const configFileUrl = pathToFileURL(configAppFile).href;
                const module = await import(configFileUrl); // Use the file:// URL
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
    }
    _prepareEnv(env) {
        const envData = { ...env };
        for (const key in envData) {
            const value = envData[key]?.trim();
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
        return (this.appConfig = plainToClass(ConfigSchema, this._prepareEnv(process.env || {}), {
            excludeExtraneousValues: true,
            exposeDefaultValues: true,
        }));
    }
    getConfig(key, defaultValue) {
        return this.appConfig?.[key] !== undefined ? this.appConfig[key] : defaultValue;
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
export const App = new AppModule();
//# sourceMappingURL=app.js.map
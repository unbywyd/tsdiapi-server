import * as dotenv from 'dotenv';
import { plainToClass } from 'class-transformer';
import path from 'path';
import fs from 'fs';
import ModuleAlias from 'module-alias';

let AppDir = null as string | null;
let AppRoot = null as string | null;
let environment = 'development' as 'production' | 'development';
let IsProduction = false;
let IsDevelopment = false;

export type AppModuleConfigOptions = {
    appCwd: string;
}

const getEnvFile = (baseDir: string) => {
    const fp = path.resolve(baseDir, `.env.${process.env.NODE_ENV}`);
    if (fs.existsSync(fp)) {
        return fp;
    }
    const fpDefault = path.resolve(baseDir, '.env');
    if (fs.existsSync(fpDefault)) {
        console.log(`Environment file not found: ${fp}. Using default: ${fpDefault}`);
        return fpDefault;
    }
    return null;
}


const alias = {
    '@base': '',
    '@api': '/api',
    "@features": "/api/features",
}
function fixModuleAlias(dirName: string) {
    const newAlias = Object.keys(alias).reduce((acc, key) => {
        const _acc = acc as Record<string, string>;
        const _alias = alias as Record<string, string>;
        _acc[key] = dirName + _alias[key];
        return acc;
    }, {});

    ModuleAlias.addAliases(newAlias);
}

export const getRootDir = (cwd: string): string => {
    return IsProduction ? path.join(cwd, 'dist') : path.join(cwd, 'src');
}

export const initAppModule = (options: AppModuleConfigOptions) => {
    environment = process.env.NODE_ENV as 'production' | 'development' || 'development';
    IsProduction = environment === 'production';
    IsDevelopment = environment === 'development';

    AppDir = getRootDir(options.appCwd);
    AppRoot = options.appCwd;

    fixModuleAlias(AppDir);

    const envFile = getEnvFile(AppRoot);
    if (envFile) {
        dotenv.config({
            path: envFile,
        });
    } else {
        console.warn(`Environment file not found: ${envFile}`);
    }


    const configAppFile = path.resolve(AppDir, IsDevelopment ? 'app.config.ts' : 'app.config.js');
    if (fs.existsSync(configAppFile)) {
        try {
            // Синхронный импорт через require
            const module = require(configAppFile);
            const ConfigSchema = module.default;

            if (ConfigSchema) {
                createAppConfig(ConfigSchema);
            } else {
                console.warn(`ConfigSchema not found in: ${configAppFile}`);
                createAppConfig();
            }
        } catch (error) {
            console.error(`Error loading config file: ${configAppFile}`, error);
        }
    } else {
        console.warn(`App config file not found: ${configAppFile}`);
        createAppConfig();
    }
};

const _prepareEnv = (env: Record<string, any>): Record<string, any> => {
    const envData = { ...env };
    for (const key in envData) {
        const value = envData[key]?.trim();
        if (value === 'true') {
            envData[key] = true;
        } else if (value === 'false') {
            envData[key] = false;
        } else if (value === 'null') {
            envData[key] = null;
        } else if (value === 'undefined') {
            envData[key] = undefined;
        }
    }
    return envData;
};

let AppConfig = null as Record<string, any>;

export const createAppConfig = <T extends object>(ConfigSchema?: new () => T): T => {
    if (!ConfigSchema) {
        AppConfig = _prepareEnv(process.env || {});
        return AppConfig as T;
    }
    AppConfig = plainToClass(ConfigSchema, _prepareEnv(process.env || {}), {
        excludeExtraneousValues: true,
        exposeDefaultValues: true,
    });
    return AppConfig as T;
};



export const getConfig = <
    T extends object = Record<string, any>, // Тип объекта конфигурации
    K extends keyof T = keyof T // Ключ объекта конфигурации
>(
    key: K,
    defaultValue?: T[K]
): T[K] => {
    return (AppConfig as T)[key] !== undefined ? (AppConfig as T)[key] : defaultValue!;
};

export { AppConfig, AppDir, AppRoot, environment, IsProduction, IsDevelopment };

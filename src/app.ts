import { FastifyInstance } from "fastify";
import { readEnvFile, readPackageJson } from "fsesm";
import path from 'path';
import { AppContext, AppOptions, Env } from "./types.js";
import { AppConfig } from "./config-loader.js";

const getRootDir = (cwd: string, environment: Env): string => {
    const isProduction = environment === 'production';
    return isProduction ? path.join(cwd, 'dist') : path.join(cwd, 'src');
}

const loadPackage = async (cwd: string): Promise<Record<string, any>> => {
    const packageFile = await readPackageJson({ cwd: cwd });
    return packageFile?.data || {};
}

const loadEnv = async (environment: 'production' | 'development'): Promise<Record<string, any> | null> => {
    const envData = await readEnvFile(`.env.${environment}`);
    if (envData?.data) {
        for (const key in envData.data) {
            if (!process.env) process.env = {};
            process.env[key] = envData.data[key];
        }
    }
    return envData?.data || null;
}

export async function initApp<T extends object = Record<string, any>>(cwd: string, options: AppOptions<T>, fastify: FastifyInstance): Promise<Partial<AppContext<T>>> {
    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';
    const envData = await loadEnv(environment);
    const projectPackage = await loadPackage(cwd);
    const appDir = getRootDir(cwd, environment);
    const appConfig = new AppConfig<T>();
    appConfig.prepare(envData, options.configSchema);
    return {
        environment: environment,
        appDir: appDir,
        options: options,
        projectConfig: appConfig,
        projectPackage: projectPackage,
        plugins: {},
        fastify
    };
}
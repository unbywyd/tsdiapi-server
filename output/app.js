import { readEnvFile, readPackageJson } from "fsesm";
import path from 'path';
import { AppConfig } from "./config-loader.js";
const getRootDir = (cwd, environment) => {
    const isProduction = environment === 'production';
    return isProduction ? path.join(cwd, 'dist') : path.join(cwd, 'src');
};
const loadPackage = async (cwd) => {
    const packageFile = await readPackageJson({ cwd: cwd });
    return packageFile?.data || {};
};
const loadEnv = async (environment) => {
    const envData = await readEnvFile(`.env.${environment}`);
    if (envData?.data) {
        for (const key in envData.data) {
            if (!process.env)
                process.env = {};
            process.env[key] = envData.data[key];
        }
    }
    return envData?.data || null;
};
export async function initApp(cwd, options, fastify) {
    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';
    const envData = await loadEnv(environment);
    const projectPackage = await loadPackage(cwd);
    const appDir = getRootDir(cwd, environment);
    const appConfig = new AppConfig();
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
//# sourceMappingURL=app.js.map
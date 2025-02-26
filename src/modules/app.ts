import * as dotenv from 'dotenv';
import { plainToClass } from 'class-transformer';
import path from 'path';
import fs from 'fs';
import ModuleAlias from 'module-alias';

export type AppModuleConfigOptions = {
    appCwd: string;
};
class AppModule {
    public appDir: string | null = null;
    public appRoot: string | null = null;
    public environment: 'production' | 'development' = 'development';
    public isProduction = false;
    public isDevelopment = false;
    public appConfig: Record<string, any> | null = null;
    private initialized = false;

    private alias = {
        '@base': '',
        '@api': '/api',
        '@features': '/api/features',
    };

    private getEnvFile(baseDir: string): string | null {
        const envFilePath = path.resolve(baseDir, `.env.${process.env.NODE_ENV}`);
        if (fs.existsSync(envFilePath)) return envFilePath;

        const defaultEnvFilePath = path.resolve(baseDir, '.env');
        if (fs.existsSync(defaultEnvFilePath)) {
            console.log(`Environment file not found: ${envFilePath}. Using default: ${defaultEnvFilePath}`);
            return defaultEnvFilePath;
        }
        return null;
    }

    private fixModuleAlias(dirName: string): void {
        const newAlias = Object.entries(this.alias).reduce((acc, [key, value]) => {
            acc[key] = dirName + value;
            return acc;
        }, {} as Record<string, string>);

        ModuleAlias.addAliases(newAlias);
    }

    private getRootDir(cwd: string): string {
        return this.isProduction ? path.join(cwd, 'dist') : path.join(cwd, 'src');
    }

    public async initialize(options: AppModuleConfigOptions): Promise<void> {
        if (this.initialized) return;

        this.environment = (process.env.NODE_ENV as 'production' | 'development') || 'development';
        this.isProduction = this.environment === 'production';
        this.isDevelopment = this.environment === 'development';

        this.appRoot = options.appCwd;
        this.appDir = this.getRootDir(options.appCwd);

        this.fixModuleAlias(this.appDir);

        const envFile = this.getEnvFile(this.appRoot);
        if (envFile) {
            dotenv.config({ path: envFile });
        } else {
            console.warn(`Environment file not found: ${envFile}`);
        }

        await this.loadConfig();
        this.initialized = true;

    }

    public async getAppConfig(): Promise<Record<string, any>> {
        if (!this.appConfig) {
            await this.loadConfig();
        }
        return this.appConfig!;
    }

    private async loadConfig(): Promise<void> {
        if (this.appConfig) return;

        const configAppFile = path.resolve(this.appDir!, this.isDevelopment ? 'app.config.ts' : 'app.config.js');
        if (fs.existsSync(configAppFile)) {
            try {
                const module = await import(configAppFile);
                const ConfigSchema = module.default;
                this.appConfig = ConfigSchema ? this.createAppConfig(ConfigSchema) : this.createAppConfig();
            } catch (error) {
                console.error(`Error loading config file: ${configAppFile}`, error);
            }
        } else {
            console.warn(`App config file not found: ${configAppFile}`);
            this.appConfig = this.createAppConfig();
        }
    }

    private _prepareEnv(env: Record<string, any>): Record<string, any> {
        const envData = { ...env };
        for (const key in envData) {
            const value = envData[key]?.trim();
            if (value === 'true') envData[key] = true;
            else if (value === 'false') envData[key] = false;
            else if (value === 'null') envData[key] = null;
            else if (value === 'undefined') envData[key] = undefined;
        }
        return envData;
    }

    private createAppConfig<T extends object>(ConfigSchema?: new () => T): T {
        if (!ConfigSchema) {
            return (this.appConfig = this._prepareEnv(process.env || {})) as T;
        }
        return (this.appConfig = plainToClass(ConfigSchema, this._prepareEnv(process.env || {}), {
            excludeExtraneousValues: true,
            exposeDefaultValues: true,
        })) as T;
    }

    public getConfig<T extends object, K extends keyof T>(key: K, defaultValue?: T[K]): T[K] {
        return (this.appConfig as T)?.[key] !== undefined ? (this.appConfig as T)[key] : defaultValue!;
    }

    public getAppDir(): string | null {
        return this.appDir;
    }

    public getAppRoot(): string | null {
        return this.appRoot;
    }

    public isProd(): boolean {
        return this.isProduction;
    }

    public isDev(): boolean {
        return this.isDevelopment;
    }
}

export const App = new AppModule();

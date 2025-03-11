export type AppModuleConfigOptions = {
    appCwd: string;
};
declare class AppModule {
    appDir: string | null;
    appRoot: string | null;
    environment: 'production' | 'development';
    isProduction: boolean;
    isDevelopment: boolean;
    appConfig: Record<string, any> | null;
    private initialized;
    private getEnvFile;
    private getRootDir;
    initialize(options: AppModuleConfigOptions): Promise<void>;
    getAppConfig(): Promise<Record<string, any>>;
    env(key: string, defaultValue?: string): Promise<string | undefined>;
    private loadConfig;
    private _prepareEnv;
    private createAppConfig;
    getConfig<T extends object, K extends keyof T>(key: K, defaultValue?: T[K]): T[K];
    getAppDir(): string | null;
    getAppRoot(): string | null;
    isProd(): boolean;
    isDev(): boolean;
}
export declare const App: AppModule;
export {};
//# sourceMappingURL=app.d.ts.map
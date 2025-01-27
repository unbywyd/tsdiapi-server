declare let AppDir: string | null;
declare let AppRoot: string | null;
declare let environment: "production" | "development";
declare let IsProduction: boolean;
declare let IsDevelopment: boolean;
export type AppModuleConfigOptions = {
    appCwd: string;
};
export declare const getRootDir: (cwd: string) => string;
export declare const initAppModule: (options: AppModuleConfigOptions) => void;
declare let AppConfig: Record<string, any>;
export declare const createAppConfig: <T extends object>(ConfigSchema?: new () => T) => T;
export declare const getConfig: <T extends object = Record<string, any>, K extends keyof T = keyof T>(key: K, defaultValue?: T[K]) => T[K];
export { AppConfig, AppDir, AppRoot, environment, IsProduction, IsDevelopment };
//# sourceMappingURL=app.d.ts.map
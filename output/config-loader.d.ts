import { TObject } from "@sinclair/typebox";
export declare class AppConfig<T extends object = Record<string, any>> {
    private appConfig;
    get<K extends string>(key: K, defaultValue?: unknown): unknown;
    set<K extends keyof T>(key: K, value: T[K]): void;
    prepare(data?: Record<string, any>, schema?: TObject): void;
    getConfig<C extends object = T>(defaultConfig?: Partial<C>): C;
}
//# sourceMappingURL=config-loader.d.ts.map
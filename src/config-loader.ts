import { Value } from '@sinclair/typebox/value';
import { TObject } from "@sinclair/typebox";

export class AppConfig<T extends object = Record<string, any>> {
    private appConfig: Partial<T> = {};

    public get<K extends string>(key: K, defaultValue?: unknown): unknown
    public get<K extends keyof T>(key: K, defaultValue?: T[K]): T[K] | undefined {
        return this.appConfig[key] || defaultValue;
    }

    public set<K extends keyof T>(key: K, value: T[K]): void {
        this.appConfig[key] = value;
    }

    public prepare(data?: Record<string, any>, schema?: TObject): void {
        this.appConfig = (data || {}) as Partial<T>;
        if (schema) {
            try {
                this.appConfig = Value.Cast(schema, data) as Partial<T>;
            } catch (error) {
                console.error(`Error while parsing config schema: ${error.message}`);
            }
        }
    }

    public getConfig(): T {
        return this.appConfig as T;
    }
}
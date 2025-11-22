import 'reflect-metadata';
import { AppContext, AppOptions } from './types.js';
export declare const VERSION = "0.3.5";
export declare const API_VERSION = "v1";
export * from './types.js';
export * from './route.js';
export * from './meta.js';
export * from './response.js';
export * from './request-context.js';
export * from './schema-registry.js';
export { addSchema, refSchema } from './schema-registry.js';
export declare function getContext(): AppContext | null;
export declare function createApp<T extends object = Record<string, any>>(options?: AppOptions<T>): Promise<AppContext<T> | null>;
//# sourceMappingURL=index.d.ts.map
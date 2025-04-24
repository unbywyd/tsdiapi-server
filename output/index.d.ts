import 'reflect-metadata';
import { AppContext, AppOptions } from './types.js';
export * from './types.js';
export * from './route.js';
export * from './meta.js';
export * from './response.js';
export declare function getContext(): AppContext | null;
export declare function createApp<T extends object = Record<string, any>>(options?: AppOptions<T>): Promise<AppContext<T> | null>;
//# sourceMappingURL=index.d.ts.map
import 'reflect-metadata';
import { AppContext, AppOptions } from './types.js';
export * from './types.js';
export * from './route.js';
export declare function createApp<T extends object = Record<string, any>>(options?: AppOptions<T>): Promise<AppContext<T> | null>;
//# sourceMappingURL=index.d.ts.map
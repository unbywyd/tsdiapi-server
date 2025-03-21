import 'reflect-metadata';
import fastifyMultipart from '@fastify/multipart';
import { AppContext, AppOptions } from './types.js';
export declare const defaultAjvPlugins: (typeof fastifyMultipart.ajvFilePlugin)[];
export declare function createApp<T extends object = Record<string, any>>(options?: AppOptions<T>): Promise<AppContext<T> | null>;
//# sourceMappingURL=index.d.ts.map
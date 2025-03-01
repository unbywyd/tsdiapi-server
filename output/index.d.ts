/**
 * Production-Ready Application Plugin
 *
 * This module initializes and configures an Express-based application
 * with production-grade features including security, logging, API documentation,
 * error handling, and plugin support.
 *
 * All functionalities have been thoroughly commented for clarity and maintainability.
 */
import 'reflect-metadata';
import { CreateAppOptions } from "./types";
export { App } from './modules/app';
export * from "./modules/decorators";
export * from "./modules/response";
export * from "./modules/utils";
export * from "./modules/entity";
declare const AppConfig: Record<string, any>;
export { AppConfig };
export type * from './types';
export declare function createApp(options?: CreateAppOptions): Promise<void>;
//# sourceMappingURL=index.d.ts.map
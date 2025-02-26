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
export * as jsonschema from './modules/jsonschema';
export declare function initApp(options?: CreateAppOptions): Promise<void>;
//# sourceMappingURL=init.d.ts.map
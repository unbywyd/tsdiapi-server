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
import { getConfig, environment, AppConfig, AppDir } from "./modules/app";
import { logger } from './modules/logger';
import Container from 'typedi';
import { CreateAppOptions } from './types';
export * from './types';
export * as jsonschema from './modules/jsonschema';
export declare function createApp(options?: CreateAppOptions): Promise<void>;
export { AppConfig, AppDir, environment, getConfig, logger, Container };
//# sourceMappingURL=index.d.ts.map
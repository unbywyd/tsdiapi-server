/**
 * Production-Ready Application Plugin
 *
 * This module initializes and configures an Express-based application
 * with production-grade features including security, logging, API documentation,
 * error handling, and plugin support.
 *
 * All functionalities have been thoroughly commented for clarity and maintainability.
 */
import 'reflect-metadata'; // Enables metadata reflection used by decorators


import { initApp } from "./init.js";
import { App } from "./modules/app.js";
import { CreateAppOptions } from "./types/index.js";

export { App } from './modules/app.js';
export * from "./modules/decorators.js";
export * from "./modules/response.js";
export * from "./modules/utils.js";
export * from "./modules/entity.js";

export type * from './types/index.js';

export async function createApp(options?: CreateAppOptions) {
    App.initialize({
        appCwd: process.cwd(),
    }).then(() => {
        initApp(options);
    }).catch(error => {
        console.error('Error initializing app', error);
    });
}
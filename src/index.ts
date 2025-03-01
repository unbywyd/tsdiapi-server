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


import { initApp } from "./init";
import { App } from "./modules/app";
import { CreateAppOptions } from "./types";

export { App } from './modules/app';
export * from "./modules/decorators";
export * from "./modules/response";
export * from "./modules/utils";

// Fix for previous versions
const AppConfig = App.appConfig;
export { AppConfig };

export type * from './types';

export async function createApp(options?: CreateAppOptions) {
    App.initialize({
        appCwd: process.cwd(),
    }).then(() => {
        initApp(options);
    }).catch(error => {
        console.error('Error initializing app', error);
    });
}
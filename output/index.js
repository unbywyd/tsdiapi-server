"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppConfig = exports.App = void 0;
exports.createApp = createApp;
/**
 * Production-Ready Application Plugin
 *
 * This module initializes and configures an Express-based application
 * with production-grade features including security, logging, API documentation,
 * error handling, and plugin support.
 *
 * All functionalities have been thoroughly commented for clarity and maintainability.
 */
require("reflect-metadata"); // Enables metadata reflection used by decorators
const init_1 = require("./init");
const app_1 = require("./modules/app");
var app_2 = require("./modules/app");
Object.defineProperty(exports, "App", { enumerable: true, get: function () { return app_2.App; } });
// Fix for previous versions
const AppConfig = app_1.App.appConfig;
exports.AppConfig = AppConfig;
function createApp(options) {
    return __awaiter(this, void 0, void 0, function* () {
        app_1.App.initialize({
            appCwd: process.cwd(),
        }).then(() => {
            (0, init_1.initApp)(options);
        }).catch(error => {
            console.error('Error initializing app', error);
        });
    });
}
//# sourceMappingURL=index.js.map
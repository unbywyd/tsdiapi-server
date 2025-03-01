"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
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
__exportStar(require("./modules/decorators"), exports);
__exportStar(require("./modules/response"), exports);
__exportStar(require("./modules/utils"), exports);
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
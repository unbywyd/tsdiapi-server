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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.createLogger = createLogger;
const path_1 = __importDefault(require("path"));
const winston_1 = __importDefault(require("winston"));
const fs_1 = __importDefault(require("fs"));
const app_1 = require("./app");
class LoggerSingleton {
    constructor() { }
    static getInstance(config) {
        return __awaiter(this, void 0, void 0, function* () {
            yield app_1.App.getAppConfig();
            if (!LoggerSingleton.instance) {
                const logFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp(), winston_1.default.format.printf(({ timestamp, level, message }) => {
                    return `[${timestamp}] ${level}: ${message}`;
                }));
                const logsdir = path_1.default.join(app_1.App.appRoot, config.baseDir);
                const errorLogPath = path_1.default.join(logsdir, "error.log");
                const combinedLogPath = path_1.default.join(logsdir, "combined.log");
                if (!fs_1.default.existsSync(logsdir)) {
                    fs_1.default.mkdirSync(logsdir);
                }
                if (!fs_1.default.existsSync(errorLogPath)) {
                    fs_1.default.writeFileSync(errorLogPath, "");
                }
                if (!fs_1.default.existsSync(combinedLogPath)) {
                    fs_1.default.writeFileSync(combinedLogPath, "");
                }
                LoggerSingleton.instance = winston_1.default.createLogger(config.winstonOptions ? config.winstonOptions : {
                    format: logFormat,
                    transports: [
                        new winston_1.default.transports.Console(),
                        new winston_1.default.transports.File({ filename: errorLogPath, level: "error" }),
                        new winston_1.default.transports.File({ filename: combinedLogPath }),
                    ],
                });
            }
            return LoggerSingleton.instance;
        });
    }
}
let logger = null;
exports.logger = logger;
function createLogger(config) {
    return __awaiter(this, void 0, void 0, function* () {
        exports.logger = logger = yield LoggerSingleton.getInstance(config);
        return logger;
    });
}
//# sourceMappingURL=logger.js.map
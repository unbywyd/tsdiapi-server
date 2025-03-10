import path from "path";
import winston from "winston";
import fs from "fs";
import { App } from "./app.js";
class LoggerSingleton {
    static instance;
    constructor() { }
    static async getInstance(config) {
        await App.getAppConfig();
        if (!LoggerSingleton.instance) {
            const logFormat = winston.format.combine(winston.format.colorize(), winston.format.timestamp(), winston.format.printf(({ timestamp, level, message }) => {
                return `[${timestamp}] ${level}: ${message}`;
            }));
            const logsdir = path.join(App.appRoot, config.baseDir);
            const errorLogPath = path.join(logsdir, "error.log");
            const combinedLogPath = path.join(logsdir, "combined.log");
            if (!fs.existsSync(logsdir)) {
                fs.mkdirSync(logsdir);
            }
            if (!fs.existsSync(errorLogPath)) {
                fs.writeFileSync(errorLogPath, "");
            }
            if (!fs.existsSync(combinedLogPath)) {
                fs.writeFileSync(combinedLogPath, "");
            }
            LoggerSingleton.instance = winston.createLogger(config.winstonOptions ? config.winstonOptions : {
                format: logFormat,
                transports: [
                    new winston.transports.Console(),
                    new winston.transports.File({ filename: errorLogPath, level: "error" }),
                    new winston.transports.File({ filename: combinedLogPath }),
                ],
            });
        }
        return LoggerSingleton.instance;
    }
}
let logger = null;
export async function createLogger(config) {
    logger = await LoggerSingleton.getInstance(config);
    return logger;
}
export { logger };
//# sourceMappingURL=logger.js.map
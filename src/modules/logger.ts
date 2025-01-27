import path from "path";
import winston from "winston";
import fs from "fs";
import { AppRoot } from "./app";

type LoggerOptions = {
    baseDir: string;
    winstonOptions?: winston.LoggerOptions;
};
// Ленивая инициализация через Singleton
class LoggerSingleton {
    private static instance: winston.Logger;

    private constructor() { } // Запрещаем создание через new

    public static getInstance(config: LoggerOptions): winston.Logger {
        if (!LoggerSingleton.instance) {
            const logFormat = winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp(),
                winston.format.printf(({ timestamp, level, message }) => {
                    return `[${timestamp}] ${level}: ${message}`;
                })
            );

            const logsdir = path.join(AppRoot, config.baseDir);

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

let logger = null as winston.Logger | null;

// Экспортируем Singleton-инстанс
//const logger = LoggerSingleton.getInstance();
export function createLogger(config: LoggerOptions) {
    logger = LoggerSingleton.getInstance(config);
    return logger;
}

export { logger }
import winston from "winston";
type LoggerOptions = {
    baseDir: string;
    winstonOptions?: winston.LoggerOptions;
};
declare let logger: winston.Logger | null;
export declare function createLogger(config: LoggerOptions): winston.Logger;
export { logger };
//# sourceMappingURL=logger.d.ts.map
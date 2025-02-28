import type { HelmetOptions } from 'helmet';
import type { LoggerOptions } from "winston";
export interface AppOptions<T = any> {
    appConfig?: T;
    environment?: string;
    helmetOptions?: HelmetOptions;
    corsOptions?: Record<string, any>;
    expressStaticOptions?: Record<string, any>;
    swaggerOptions?: {
        securitySchemes?: Record<string, any>;
        baseDir?: string;
        info?: Record<string, any> | ((prev: Record<string, any>) => Record<string, any>);
    };
    loggerOptions?: {
        baseDir?: string;
        winstonOptions?: LoggerOptions;
    };
    [key: string]: any;
}
//# sourceMappingURL=AppOptions.d.ts.map
import { AppOptions } from "./AppOptions";
import { AppPlugin } from "./Plugin";
import type { Application } from "express";
import type { Server } from "http";
import type { Container } from "typedi";
import type { Logger } from "winston";
import type { MetadataArgsStorage } from 'routing-controllers';
export interface AppContext<T = any> {
    appDir: string;
    apiDir: string;
    routingControllersMetaStorage?: MetadataArgsStorage | null;
    schemas?: Record<string, any>;
    app: Application;
    server?: Server;
    container: typeof Container;
    plugins?: Record<string, AppPlugin>;
    config: AppOptions<T>;
    logger: Logger;
}
//# sourceMappingURL=AppContext.d.ts.map
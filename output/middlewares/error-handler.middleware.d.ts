import { ExpressErrorMiddlewareInterface } from "routing-controllers";
import * as express from "express";
export declare function toSlug(str: string): string;
export default class CustomErrorHandler implements ExpressErrorMiddlewareInterface {
    error(error: any, _req: express.Request, res: express.Response, next: express.NextFunction): void | express.Response<any, Record<string, any>>;
}
//# sourceMappingURL=error-handler.middleware.d.ts.map
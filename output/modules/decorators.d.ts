import { NextFunction, Request, Response } from "express";
export declare function UseJsonBody(): MethodDecorator;
export declare function UseUrlencodedBody(extended?: boolean): MethodDecorator;
export declare function UseMultipart(): MethodDecorator;
export declare function RequestGuard(validator: (request: Request, response: Response, next: NextFunction) => Promise<true | {
    message: string;
    status?: number;
}>): (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => void;
export declare function RequestResolver<T>(extractor: (req: any, res: Response, next: Function) => Promise<any>, dtoClass?: new () => T): ParameterDecorator;
/**
 * @BodyMultipart - merges req.body and req.files into one object.
 */
export declare function BodyMultipart<T>(type?: {
    new (): T;
}): ParameterDecorator;
//# sourceMappingURL=decorators.d.ts.map
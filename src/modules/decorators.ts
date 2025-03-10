import multer from "multer";
import bodyParser from 'body-parser';
import { NextFunction, Request, Response } from "express";
import { createParamDecorator, UseBefore } from "routing-controllers";
import { OpenAPI } from "routing-controllers-openapi";
import { toDTO } from "./utils.js";

export function UseJsonBody(): MethodDecorator {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        UseBefore(bodyParser.json())(target, propertyKey, descriptor);

        OpenAPI({
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                        },
                    },
                },
            },
        })(target, propertyKey, descriptor);
    };
}


export function UseUrlencodedBody(extended: boolean = true): MethodDecorator {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        UseBefore(bodyParser.urlencoded({ extended }))(target, propertyKey, descriptor);

        OpenAPI({
            requestBody: {
                required: true,
                content: {
                    "application/x-www-form-urlencoded": {
                        schema: {
                            type: "object",
                        },
                    },
                },
            },
        })(target, propertyKey, descriptor);
    };
}

export function UseMultipart(): MethodDecorator {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const upload = multer();
        UseBefore(upload.any())(target, propertyKey, descriptor);

        OpenAPI({
            requestBody: {
                required: true,
                content: {
                    "multipart/form-data": {
                        schema: {
                            type: "object",
                        },
                    },
                },
            },
        })(target, propertyKey, descriptor);
    };
}


export function RequestGuard(
    validator: (request: Request, response: Response, next: NextFunction) => Promise<true | { message: string, status?: number }>,
) {
    return function (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {
        UseBefore(async (req: Request, res: Response, next: NextFunction) => {
            try {
                const isValid = await validator(req, res, next);
                if (isValid !== true) {
                    const message = isValid?.message || "Access denied: Invalid data";
                    const status = isValid?.status || 403;
                    return res.status(status).send({ status: status, message: message });
                }
                next();
            } catch (err) {
                console.error(err);
                return res.status(500).send({ status: 500, message: "Server error during validation" });
            }
        })(target, propertyKey, descriptor);
    };
}

export function RequestResolver<T>(
    extractor: (req: any, res: Response, next: Function) => Promise<any>,
    dtoClass?: new () => T
): ParameterDecorator {
    return createParamDecorator({
        required: true,
        async value(action) {
            const { request, response, next } = action;
            try {
                const rawData = await extractor(request, response, next);
                if (!rawData) {
                    return null;
                }
                if (dtoClass) {
                    return toDTO(dtoClass, rawData);
                } else {
                    return rawData;
                }
            } catch (error) {
                console.error("RequestResolver error:", error);
                return null;
            }
        },
    });
}

/**
 * @BodyMultipart - merges req.body and req.files into one object.
 */
export function BodyMultipart<T>(type?: { new(): T }): ParameterDecorator {
    return createParamDecorator({
        required: true,
        async value(action) {
            const req: Request = action.request;
            const bodyData = type ? toDTO(type, req.body || {}) : req.body || {};

            const data = Array.isArray(req.files)
                ? { ...bodyData, files: req.files }
                : { ...bodyData, ...req.files || {} };

            return data;
        },
    });
}

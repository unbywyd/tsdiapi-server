import multer from "multer";
import bodyParser from 'body-parser';
import { createParamDecorator, UseBefore } from "routing-controllers";
import { OpenAPI } from "routing-controllers-openapi";
import { toDTO } from "./utils.js";
export function UseJsonBody() {
    return function (target, propertyKey, descriptor) {
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
export function UseUrlencodedBody(extended = true) {
    return function (target, propertyKey, descriptor) {
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
export function UseMultipart() {
    return function (target, propertyKey, descriptor) {
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
export function RequestGuard(validator) {
    return function (target, propertyKey, descriptor) {
        UseBefore(async (req, res, next) => {
            try {
                const isValid = await validator(req, res, next);
                if (isValid !== true) {
                    const message = isValid?.message || "Access denied: Invalid data";
                    const status = isValid?.status || 403;
                    return res.status(status).send({ status: status, message: message });
                }
                next();
            }
            catch (err) {
                console.error(err);
                return res.status(500).send({ status: 500, message: "Server error during validation" });
            }
        })(target, propertyKey, descriptor);
    };
}
export function RequestResolver(extractor, dtoClass) {
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
                }
                else {
                    return rawData;
                }
            }
            catch (error) {
                console.error("RequestResolver error:", error);
                return null;
            }
        },
    });
}
/**
 * @BodyMultipart - merges req.body and req.files into one object.
 */
export function BodyMultipart(type) {
    return createParamDecorator({
        required: true,
        async value(action) {
            const req = action.request;
            const bodyData = type ? toDTO(type, req.body || {}) : req.body || {};
            const data = Array.isArray(req.files)
                ? { ...bodyData, files: req.files }
                : { ...bodyData, ...req.files || {} };
            return data;
        },
    });
}
//# sourceMappingURL=decorators.js.map
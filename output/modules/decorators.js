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
exports.UseJsonBody = UseJsonBody;
exports.UseUrlencodedBody = UseUrlencodedBody;
exports.UseMultipart = UseMultipart;
exports.RequestGuard = RequestGuard;
exports.RequestResolver = RequestResolver;
exports.BodyMultipart = BodyMultipart;
const multer_1 = __importDefault(require("multer"));
const body_parser_1 = __importDefault(require("body-parser"));
const routing_controllers_1 = require("routing-controllers");
const routing_controllers_openapi_1 = require("routing-controllers-openapi");
const utils_1 = require("./utils");
function UseJsonBody() {
    return function (target, propertyKey, descriptor) {
        (0, routing_controllers_1.UseBefore)(body_parser_1.default.json())(target, propertyKey, descriptor);
        (0, routing_controllers_openapi_1.OpenAPI)({
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
function UseUrlencodedBody(extended = true) {
    return function (target, propertyKey, descriptor) {
        (0, routing_controllers_1.UseBefore)(body_parser_1.default.urlencoded({ extended }))(target, propertyKey, descriptor);
        (0, routing_controllers_openapi_1.OpenAPI)({
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
function UseMultipart() {
    return function (target, propertyKey, descriptor) {
        const upload = (0, multer_1.default)();
        (0, routing_controllers_1.UseBefore)(upload.any())(target, propertyKey, descriptor);
        (0, routing_controllers_openapi_1.OpenAPI)({
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
function RequestGuard(validator) {
    return function (target, propertyKey, descriptor) {
        (0, routing_controllers_1.UseBefore)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const isValid = yield validator(req, res, next);
                if (isValid !== true) {
                    const message = (isValid === null || isValid === void 0 ? void 0 : isValid.message) || "Access denied: Invalid data";
                    const status = (isValid === null || isValid === void 0 ? void 0 : isValid.status) || 403;
                    return res.status(status).send({ status: status, message: message });
                }
                next();
            }
            catch (err) {
                console.error(err);
                return res.status(500).send({ status: 500, message: "Server error during validation" });
            }
        }))(target, propertyKey, descriptor);
    };
}
function RequestResolver(extractor, dtoClass) {
    return (0, routing_controllers_1.createParamDecorator)({
        required: true,
        value(action) {
            return __awaiter(this, void 0, void 0, function* () {
                const { request, response, next } = action;
                try {
                    const rawData = yield extractor(request, response, next);
                    if (!rawData) {
                        return null;
                    }
                    if (dtoClass) {
                        return (0, utils_1.toDTO)(dtoClass, rawData);
                    }
                    else {
                        return rawData;
                    }
                }
                catch (error) {
                    console.error("RequestResolver error:", error);
                    return null;
                }
            });
        },
    });
}
/**
 * @BodyMultipart - merges req.body and req.files into one object.
 */
function BodyMultipart(type) {
    return (0, routing_controllers_1.createParamDecorator)({
        required: true,
        value(action) {
            return __awaiter(this, void 0, void 0, function* () {
                const req = action.request;
                const bodyData = type ? (0, utils_1.toDTO)(type, req.body || {}) : req.body || {};
                const data = Array.isArray(req.files)
                    ? Object.assign(Object.assign({}, bodyData), { files: req.files }) : Object.assign(Object.assign({}, bodyData), req.files || {});
                return data;
            });
        },
    });
}
//# sourceMappingURL=decorators.js.map
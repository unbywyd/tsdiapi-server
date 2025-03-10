var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsBoolean, IsNumber, IsString } from "class-validator";
import { Expose } from "class-transformer";
import { validationMetadatasToSchemas } from "class-validator-jsonschema";
import { OpenAPI } from "routing-controllers-openapi";
import { toSlug, toDTO } from "./utils.js";
import { IsEntity } from "./entity.js";
export function getOpenAPIResponse(responseClass, options) {
    const isArray = options?.isArray || false;
    const schemas = validationMetadatasToSchemas({
        refPointerPrefix: "#/components/schemas/",
    });
    const schemaName = responseClass.name;
    if (!schemas[schemaName]) {
        throw new Error(`Schema not found for ${schemaName}`);
    }
    const schemaReference = isArray
        ? { type: "array", items: { $ref: `#/components/schemas/${schemaName}` } }
        : { $ref: `#/components/schemas/${schemaName}` };
    return {
        "400": {
            description: "Bad request",
            content: {
                "application/json": {
                    schema: {
                        $ref: `#/components/schemas/IResponseError`,
                    },
                },
            },
        },
        "200": {
            description: "Successful response",
            content: {
                "application/json": {
                    schema: schemaReference,
                },
            },
        },
    };
}
export class IResponseErrorMessage {
    message;
    slug;
}
__decorate([
    IsString(),
    Expose(),
    __metadata("design:type", String)
], IResponseErrorMessage.prototype, "message", void 0);
__decorate([
    IsString(),
    Expose(),
    __metadata("design:type", String)
], IResponseErrorMessage.prototype, "slug", void 0);
export class IResponseError {
    message;
    errors = [];
    status = 401;
    constructor(_message, status = 401) {
        const message = _message instanceof Error ? _message.message : _message;
        this.message = message;
        this.errors = [{ message, slug: toSlug(message) }];
        this.status = status;
    }
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], IResponseError.prototype, "message", void 0);
__decorate([
    IsEntity(() => IResponseErrorMessage, { each: true }),
    __metadata("design:type", Array)
], IResponseError.prototype, "errors", void 0);
__decorate([
    IsNumber(),
    __metadata("design:type", Number)
], IResponseError.prototype, "status", void 0);
export class OutputSuccessOrFailDTO {
    success;
}
__decorate([
    IsBoolean(),
    Expose(),
    __metadata("design:type", Boolean)
], OutputSuccessOrFailDTO.prototype, "success", void 0);
export function successOrFailResponse(success) {
    return toDTO(OutputSuccessOrFailDTO, { success });
}
export function Summary(summary) {
    return OpenAPI((operation) => {
        operation.summary = summary;
        return operation;
    });
}
export function SuccessResponse(responseClass, options) {
    return (target, propertyKey, descriptor) => {
        const newResponses = getOpenAPIResponse(responseClass, options);
        return OpenAPI((operation) => {
            operation.responses = {
                ...(operation.responses || {}),
                ...newResponses,
            };
            return operation;
        })(target, propertyKey, descriptor);
    };
}
export function responseError(message, status = 401) {
    return new IResponseError(message, status);
}
export function responseSuccess(data) {
    return data;
}
//# sourceMappingURL=response.js.map
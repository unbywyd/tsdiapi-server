import { Type } from "@sinclair/typebox";
export class ResponseErrorClass {
    status;
    data;
    constructor(message, status, details) {
        this.status = status;
        this.data = {
            error: message,
            details
        };
    }
}
export class ResponseClass {
    status;
    data;
    constructor(data, status) {
        this.status = status;
        this.data = data;
    }
}
export const ResponseErrorSchema = Type.Object({
    error: Type.String(),
    details: Type.Optional(Type.Any({
        default: null
    }))
});
export const useResponseErrorSchema = (code, schema) => {
    const errorSchema = Type.Object({
        error: Type.String(),
        details: Type.Optional(schema ?? Type.Any({
            default: null
        }))
    });
    const sendError = (message, details) => {
        return new ResponseErrorClass(message, code, details);
    };
    return {
        register: [code, errorSchema],
        send: sendError
    };
};
export const useResponseSchema = (code, schema) => {
    const sendSuccess = (data) => {
        return new ResponseClass(data, code);
    };
    return {
        register: [code, schema],
        send: sendSuccess
    };
};
export const buildResponseCodes = (successSchema, errorSchema) => {
    const defaultErrorSchema = errorSchema ?? ResponseErrorSchema;
    return {
        200: successSchema,
        400: defaultErrorSchema,
        401: defaultErrorSchema,
        403: defaultErrorSchema,
        409: defaultErrorSchema,
        422: defaultErrorSchema,
        429: defaultErrorSchema,
        500: defaultErrorSchema,
        503: defaultErrorSchema
    };
};
export const useResponseSchemas = (successSchema, errorSchema) => {
    const { register: errorRegister, send: sendError } = useResponseErrorSchema(400, errorSchema);
    const { register: successRegister, send: sendSuccess } = useResponseSchema(200, successSchema);
    const send = (data) => {
        if (typeof data === 'object' && 'error' in data) {
            const error = data;
            return sendError(error.error, error.details ?? undefined);
        }
        if (data instanceof ResponseClass) {
            return sendSuccess(data.data);
        }
        else if (data instanceof ResponseErrorClass) {
            return sendError(data.data.error, data.data.details);
        }
    };
    return {
        codes: {
            200: successRegister[1],
            400: errorRegister[1],
            401: errorRegister[1],
            403: errorRegister[1],
            409: errorRegister[1],
            422: errorRegister[1],
            429: errorRegister[1],
            500: errorRegister[1],
            503: errorRegister[1]
        },
        sendError,
        sendSuccess,
        send
    };
};
// Response helpers
export const responseSuccess = (data) => new ResponseClass(data, 200);
export const response200 = (data) => new ResponseClass(data, 200);
export const response201 = (data) => new ResponseClass(data, 201);
export const response202 = (data) => new ResponseClass(data, 202);
export const response204 = (data) => new ResponseClass(data, 204);
export const responseNull = () => new ResponseClass(null, 204);
export const responseError = (data) => new ResponseClass(data, 400);
export const responseForbidden = (data) => new ResponseClass(data, 403);
export const responseNotFound = (data) => new ResponseClass(data, 404);
export const responseConflict = (data) => new ResponseClass(data, 409);
export const responseUnprocessableEntity = (data) => new ResponseClass(data, 422);
export const responseTooManyRequests = (data) => new ResponseClass(data, 429);
export const responseInternalServerError = (data) => new ResponseClass(data, 500);
export const responseServiceUnavailable = (data) => new ResponseClass(data, 503);
// Response error with details
export const response400Error = (message, details) => new ResponseErrorClass(message, 400, details); // Bad Response
export const response401Error = (message, details) => new ResponseErrorClass(message, 401, details); // Unauthorized
export const response403Error = (message, details) => new ResponseErrorClass(message, 403, details); // Forbidden
export const response404Error = (message, details) => new ResponseErrorClass(message, 404, details); // Not Found
export const response409Error = (message, details) => new ResponseErrorClass(message, 409, details); // Conflict
export const response422Error = (message, details) => new ResponseErrorClass(message, 422, details); // Unprocessable Entity
export const response429Error = (message, details) => new ResponseErrorClass(message, 429, details); // Too Many Responses
export const responseForbiddenError = (message, details) => new ResponseErrorClass(message, 403, details);
export const responseNotFoundError = (message, details) => new ResponseErrorClass(message, 404, details);
export const responseConflictError = (message, details) => new ResponseErrorClass(message, 409, details);
export const responseUnprocessableEntityError = (message, details) => new ResponseErrorClass(message, 422, details);
export const responseTooManyRequestsError = (message, details) => new ResponseErrorClass(message, 429, details);
export const responseBadRequestError = (message, details) => new ResponseErrorClass(message, 400, details);
// Server errors (5xx)
export const response500Error = (message, details) => new ResponseErrorClass(message, 500, details); // Internal Server Error
export const response503Error = (message, details) => new ResponseErrorClass(message, 503, details); // Service Unavailable
//# sourceMappingURL=response.js.map
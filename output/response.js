import { Type } from "@sinclair/typebox";
export class ResponseError extends Error {
    status;
    data;
    constructor(message, status, details) {
        super(message);
        this.name = 'ResponseError';
        this.message = message;
        this.status = status;
        this.data = {
            error: message,
            details
        };
    }
}
export class ResponseBadRequest extends ResponseError {
    constructor(message, details) {
        super(message, 400, details);
    }
}
export class ResponseUnauthorized extends ResponseError {
    constructor(message, details) {
        super(message, 401, details);
    }
}
export class ResponseForbidden extends ResponseError {
    constructor(message, details) {
        super(message, 403, details);
    }
}
export class ResponseNotFound extends ResponseError {
    constructor(message, details) {
        super(message, 404, details);
    }
}
export class ResponseConflict extends ResponseError {
    constructor(message, details) {
        super(message, 409, details);
    }
}
export class ResponseUnprocessableEntity extends ResponseError {
    constructor(message, details) {
        super(message, 422, details);
    }
}
export class ResponseTooManyRequests extends ResponseError {
    constructor(message, details) {
        super(message, 429, details);
    }
}
export class ResponseInternalServerError extends ResponseError {
    constructor(message, details) {
        super(message, 500, details);
    }
}
export class ResponseServiceUnavailable extends ResponseError {
    constructor(message, details) {
        super(message, 503, details);
    }
}
export class Response {
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
        return new ResponseError(message, code, details);
    };
    return {
        register: [code, errorSchema],
        send: sendError
    };
};
export const useResponseSchema = (code, schema) => {
    const sendSuccess = (data) => {
        return new Response(data, code);
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
        404: defaultErrorSchema,
        409: defaultErrorSchema,
        422: defaultErrorSchema,
        429: defaultErrorSchema,
        500: defaultErrorSchema,
        503: defaultErrorSchema
    };
};
export const buildExtraResponseCodes = (successSchema, errorSchema) => {
    const defaultErrorSchema = errorSchema ?? ResponseErrorSchema;
    return {
        200: successSchema,
        400: defaultErrorSchema,
        401: defaultErrorSchema,
        403: defaultErrorSchema
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
        if (data instanceof Response) {
            return sendSuccess(data.data);
        }
        else if (data instanceof ResponseError) {
            return sendError(data.data.error, data.data.details);
        }
    };
    return {
        codes: {
            200: successRegister[1],
            400: errorRegister[1],
            401: errorRegister[1],
            403: errorRegister[1]
        },
        sendError,
        sendSuccess,
        send
    };
};
// Response helpers
export const responseSuccess = (data) => new Response(data, 200);
export const response200 = (data) => new Response(data, 200);
export const response201 = (data) => new Response(data, 201);
export const response202 = (data) => new Response(data, 202);
export const response204 = (data) => new Response(data, 204);
export const responseNull = () => new Response(null, 204);
export const responseError = (data) => new Response(data, 400);
export const responseForbidden = (data) => new Response(data, 403);
export const responseNotFound = (data) => new Response(data, 404);
export const responseConflict = (data) => new Response(data, 409);
export const responseUnprocessableEntity = (data) => new Response(data, 422);
export const responseTooManyRequests = (data) => new Response(data, 429);
export const responseInternalServerError = (data) => new Response(data, 500);
export const responseServiceUnavailable = (data) => new Response(data, 503);
// Response error with details
export const response400Error = (message, details) => new ResponseError(message, 400, details); // Bad Response
export const response401Error = (message, details) => new ResponseError(message, 401, details); // Unauthorized
export const response403Error = (message, details) => new ResponseError(message, 403, details); // Forbidden
export const response404Error = (message, details) => new ResponseError(message, 404, details); // Not Found
export const response409Error = (message, details) => new ResponseError(message, 409, details); // Conflict
export const response422Error = (message, details) => new ResponseError(message, 422, details); // Unprocessable Entity
export const response429Error = (message, details) => new ResponseError(message, 429, details); // Too Many Responses
export const responseForbiddenError = (message, details) => new ResponseError(message, 403, details);
export const responseNotFoundError = (message, details) => new ResponseError(message, 404, details);
export const responseConflictError = (message, details) => new ResponseError(message, 409, details);
export const responseUnprocessableEntityError = (message, details) => new ResponseError(message, 422, details);
export const responseTooManyRequestsError = (message, details) => new ResponseError(message, 429, details);
export const responseBadRequestError = (message, details) => new ResponseError(message, 400, details);
// Server errors (5xx)
export const response500Error = (message, details) => new ResponseError(message, 500, details); // Internal Server Error
export const response503Error = (message, details) => new ResponseError(message, 503, details); // Service Unavailable
//# sourceMappingURL=response.js.map
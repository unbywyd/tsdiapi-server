import { Type } from "@sinclair/typebox";
export class ResponseError {
    status;
    data;
    constructor(status, message, details) {
        this.status = status;
        this.data = {
            error: message,
            details
        };
    }
    toJSON() {
        return {
            status: this.status,
            data: this.data
        };
    }
    throw() {
        throw this;
    }
}
export class ResponseBadRequest extends ResponseError {
    constructor(message, details) {
        super(400, message, details);
    }
}
export class ResponseUnauthorized extends ResponseError {
    constructor(message, details) {
        super(401, message, details);
    }
}
export class ResponseForbidden extends ResponseError {
    constructor(message, details) {
        super(403, message, details);
    }
}
export class ResponseNotFound extends ResponseError {
    constructor(message, details) {
        super(404, message, details);
    }
}
export class ResponseConflict extends ResponseError {
    constructor(message, details) {
        super(409, message, details);
    }
}
export class ResponseUnprocessableEntity extends ResponseError {
    constructor(message, details) {
        super(422, message, details);
    }
}
export class ResponseTooManyRequests extends ResponseError {
    constructor(message, details) {
        super(429, message, details);
    }
}
export class ResponseInternalServerError extends ResponseError {
    constructor(message, details) {
        super(500, message, details);
    }
}
export class ResponseServiceUnavailable extends ResponseError {
    constructor(message, details) {
        super(503, message, details);
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
}, { $id: 'ResponseErrorSchema' });
// Simple success/failure response schemas
export const ResponseSuccessSchema = Type.Object({
    success: Type.Literal(true)
}, { $id: 'ResponseSuccessSchema' });
export const ResponseFailureSchema = Type.Object({
    success: Type.Literal(false),
    error: Type.Optional(Type.String())
}, { $id: 'ResponseFailureSchema' });
// Schema will be registered automatically when used in routes
export const useResponseErrorSchema = (code, schema) => {
    const errorSchema = Type.Object({
        error: Type.String(),
        details: Type.Optional(schema ?? Type.Any({
            default: null
        }))
    });
    const sendError = (message, details) => {
        return new ResponseError(code, message, details);
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
export const response204 = () => new Response(null, 204);
export const responseNull = () => new Response(null, 204);
export const responseError = (message, details) => new ResponseError(400, message, details);
// Simple success/failure helpers
// Returns { success: true } with status 200
export const responseOk = () => new Response({ success: true }, 200);
// Returns { success: false } with status 400
// Optionally includes error message: { success: false, error: "message" }
export const responseFail = (error) => {
    const data = error ? { success: false, error } : { success: false };
    return new Response(data, 400);
};
// Response error with details
export const response400 = (message, details) => {
    return new ResponseError(400, message, details);
};
export const response401 = (message, details) => {
    return new ResponseError(401, message, details);
};
export const response403 = (message, details) => {
    return new ResponseError(403, message, details);
};
export const response404 = (message, details) => {
    return new ResponseError(404, message, details);
};
export const response409 = (message, details) => {
    return new ResponseError(409, message, details);
};
export const response422 = (message, details) => {
    return new ResponseError(422, message, details);
};
export const response429 = (message, details) => {
    return new ResponseError(429, message, details);
};
export const response500 = (message, details) => {
    return new ResponseError(500, message, details);
};
export const response503 = (message, details) => {
    return new ResponseError(503, message, details);
};
export const responseForbidden = (message, details) => new ResponseError(403, message, details);
export const responseNotFound = (message, details) => new ResponseError(404, message, details);
export const responseConflict = (message, details) => new ResponseError(409, message, details);
export const responseUnprocessableEntity = (message, details) => new ResponseError(422, message, details);
export const responseTooManyRequests = (message, details) => new ResponseError(429, message, details);
export const responseBadRequest = (message, details) => new ResponseError(400, message, details);
//# sourceMappingURL=response.js.map
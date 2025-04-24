import { Static, TSchema, Type } from "@sinclair/typebox";

export class ResponseError<T extends number, P> extends Error {
    status: T;
    data: {
        error: string;
        details?: P;
    }
    constructor(message: string, status: T, details?: P) {
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

export class ResponseBadRequest<T> extends ResponseError<400, T> {
    constructor(message: string, details?: T) {
        super(message, 400, details);
    }
}

export class ResponseUnauthorized<T> extends ResponseError<401, T> {
    constructor(message: string, details?: T) {
        super(message, 401, details);
    }
}

export class ResponseForbidden<T> extends ResponseError<403, T> {
    constructor(message: string, details?: T) {
        super(message, 403, details);
    }
}

export class ResponseNotFound<T> extends ResponseError<404, T> {
    constructor(message: string, details?: T) {
        super(message, 404, details);
    }
}

export class ResponseConflict<T> extends ResponseError<409, T> {
    constructor(message: string, details?: T) {
        super(message, 409, details);
    }
}

export class ResponseUnprocessableEntity<T> extends ResponseError<422, T> {
    constructor(message: string, details?: T) {
        super(message, 422, details);
    }
}

export class ResponseTooManyRequests<T> extends ResponseError<429, T> {
    constructor(message: string, details?: T) {
        super(message, 429, details);
    }
}

export class ResponseInternalServerError<T> extends ResponseError<500, T> {
    constructor(message: string, details?: T) {
        super(message, 500, details);
    }
}

export class ResponseServiceUnavailable<T> extends ResponseError<503, T> {
    constructor(message: string, details?: T) {
        super(message, 503, details);
    }
}



export class Response<T, S extends number> {
    status: S;
    data: T;
    constructor(data: T, status: S) {
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


export const useResponseErrorSchema = <S extends TSchema, Code extends number>(code: Code, schema?: S) => {
    const errorSchema = Type.Object({
        error: Type.String(),
        details: Type.Optional(schema ?? Type.Any({
            default: null
        }))
    });

    const sendError = <P extends Static<S>>(message: string, details?: P) => {
        return new ResponseError<typeof code, P>(message, code, details);
    };

    return {
        register: [code, errorSchema] as const,
        send: sendError
    };
};

export const useResponseSchema = <S extends TSchema, Code extends number>(code: Code, schema: S) => {
    const sendSuccess = <P extends Static<S>>(data: P) => {
        return new Response<P, typeof code>(data, code);
    };

    return {
        register: [code, schema] as const,
        send: sendSuccess
    };
};

export const buildResponseCodes = <S extends TSchema, E extends TSchema = typeof ResponseErrorSchema>(
    successSchema: S,
    errorSchema?: E
) => {
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
    } as const;
};

export const buildExtraResponseCodes = <S extends TSchema, E extends TSchema>(
    successSchema: S,
    errorSchema?: E
) => {
    const defaultErrorSchema = errorSchema ?? ResponseErrorSchema;

    return {
        200: successSchema,
        400: defaultErrorSchema,
        401: defaultErrorSchema,
        403: defaultErrorSchema
    }
}

export const useResponseSchemas = <S extends TSchema, E extends TSchema>(
    successSchema: S,
    errorSchema?: E
) => {
    const { register: errorRegister, send: sendError } = useResponseErrorSchema(400, errorSchema);
    const { register: successRegister, send: sendSuccess } = useResponseSchema(200, successSchema);

    const send: <T extends Static<typeof errorSchema> | Static<typeof successSchema>>(data: T) => ReturnType<typeof sendError> | ReturnType<typeof sendSuccess> = (data) => {
        if (typeof data === 'object' && 'error' in data) {
            const error = data as { error: string, details?: Static<E> };
            return sendError(error.error, error.details ?? undefined) as ReturnType<typeof sendError>;
        }
        if (data instanceof Response) {
            return sendSuccess(data.data) as ReturnType<typeof sendSuccess>;
        } else if (data instanceof ResponseError) {
            return sendError(data.data.error, data.data.details) as ReturnType<typeof sendError>;
        }
    }
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
export const responseSuccess = <T>(data: T) => new Response(data, 200 as const);
export const response200 = <T>(data: T) => new Response(data, 200 as const);
export const response201 = <T>(data: T) => new Response(data, 201 as const);
export const response202 = <T>(data: T) => new Response(data, 202 as const);
export const response204 = <T>(data: T) => new Response(data, 204 as const);
export const responseNull = () => new Response(null, 204 as const);
export const responseError = <T>(data: T) => new Response(data, 400 as const);
export const responseForbidden = <T>(data: T) => new Response(data, 403 as const);
export const responseNotFound = <T>(data: T) => new Response(data, 404 as const);
export const responseConflict = <T>(data: T) => new Response(data, 409 as const);
export const responseUnprocessableEntity = <T>(data: T) => new Response(data, 422 as const);
export const responseTooManyRequests = <T>(data: T) => new Response(data, 429 as const);
export const responseInternalServerError = <T>(data: T) => new Response(data, 500 as const);
export const responseServiceUnavailable = <T>(data: T) => new Response(data, 503 as const);


// Response error with details
export const response400Error = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseError(message, 400 as const, details); // Bad Response
export const response401Error = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseError(message, 401 as const, details); // Unauthorized
export const response403Error = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseError(message, 403 as const, details); // Forbidden
export const response404Error = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseError(message, 404 as const, details); // Not Found
export const response409Error = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseError(message, 409 as const, details); // Conflict
export const response422Error = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseError(message, 422 as const, details); // Unprocessable Entity
export const response429Error = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseError(message, 429 as const, details); // Too Many Responses

export const responseForbiddenError = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseError(message, 403 as const, details);
export const responseNotFoundError = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseError(message, 404 as const, details);
export const responseConflictError = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseError(message, 409 as const, details);
export const responseUnprocessableEntityError = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseError(message, 422 as const, details);
export const responseTooManyRequestsError = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseError(message, 429 as const, details);
export const responseBadRequestError = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseError(message, 400 as const, details);

// Server errors (5xx)
export const response500Error = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseError(message, 500 as const, details); // Internal Server Error
export const response503Error = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseError(message, 503 as const, details); // Service Unavailable

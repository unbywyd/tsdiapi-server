import { Static, TSchema, Type } from "@sinclair/typebox";


export class ResponseErrorClass<T extends number, P> {
    status: T;
    data: {
        error: string;
        details?: P;
    }
    constructor(message: string, status: T, details?: P) {
        this.status = status;
        this.data = {
            error: message,
            details
        };
    }
}

export class ResponseClass<T, S extends number> {
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
        return new ResponseErrorClass<typeof code, P>(message, code, details);
    };

    return {
        register: [code, errorSchema] as const,
        send: sendError
    };
};

export const useResponseSchema = <S extends TSchema, Code extends number>(code: Code, schema: S) => {
    const sendSuccess = <P extends Static<S>>(data: P) => {
        return new ResponseClass<P, typeof code>(data, code);
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
        409: defaultErrorSchema,
        422: defaultErrorSchema,
        429: defaultErrorSchema,
        500: defaultErrorSchema,
        503: defaultErrorSchema
    } as const;
};

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
        if (data instanceof ResponseClass) {
            return sendSuccess(data.data) as ReturnType<typeof sendSuccess>;
        } else if (data instanceof ResponseErrorClass) {
            return sendError(data.data.error, data.data.details) as ReturnType<typeof sendError>;
        }
    }
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
export const responseSuccess = <T>(data: T) => new ResponseClass(data, 200 as const);
export const response200 = <T>(data: T) => new ResponseClass(data, 200 as const);
export const response201 = <T>(data: T) => new ResponseClass(data, 201 as const);
export const response202 = <T>(data: T) => new ResponseClass(data, 202 as const);
export const response204 = <T>(data: T) => new ResponseClass(data, 204 as const);
export const responseNull = () => new ResponseClass(null, 204 as const);
export const responseError = <T>(data: T) => new ResponseClass(data, 400 as const);
export const responseForbidden = <T>(data: T) => new ResponseClass(data, 403 as const);
export const responseNotFound = <T>(data: T) => new ResponseClass(data, 404 as const);
export const responseConflict = <T>(data: T) => new ResponseClass(data, 409 as const);
export const responseUnprocessableEntity = <T>(data: T) => new ResponseClass(data, 422 as const);
export const responseTooManyRequests = <T>(data: T) => new ResponseClass(data, 429 as const);
export const responseInternalServerError = <T>(data: T) => new ResponseClass(data, 500 as const);
export const responseServiceUnavailable = <T>(data: T) => new ResponseClass(data, 503 as const);


// Response error with details
export const response400Error = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseErrorClass(message, 400 as const, details); // Bad Response
export const response401Error = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseErrorClass(message, 401 as const, details); // Unauthorized
export const response403Error = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseErrorClass(message, 403 as const, details); // Forbidden
export const response404Error = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseErrorClass(message, 404 as const, details); // Not Found
export const response409Error = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseErrorClass(message, 409 as const, details); // Conflict
export const response422Error = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseErrorClass(message, 422 as const, details); // Unprocessable Entity
export const response429Error = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseErrorClass(message, 429 as const, details); // Too Many Responses

export const responseForbiddenError = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseErrorClass(message, 403 as const, details);
export const responseNotFoundError = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseErrorClass(message, 404 as const, details);
export const responseConflictError = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseErrorClass(message, 409 as const, details);
export const responseUnprocessableEntityError = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseErrorClass(message, 422 as const, details);
export const responseTooManyRequestsError = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseErrorClass(message, 429 as const, details);
export const responseBadRequestError = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseErrorClass(message, 400 as const, details);

// Server errors (5xx)
export const response500Error = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseErrorClass(message, 500 as const, details); // Internal Server Error
export const response503Error = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseErrorClass(message, 503 as const, details); // Service Unavailable

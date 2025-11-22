import { Static, TSchema, Type } from "@sinclair/typebox";

export class ResponseError<T extends number, P> {
    status: T;
    data: {
        error: string;
        details?: P;
    }
    constructor(status: T, message: string, details?: P) {
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

export class ResponseBadRequest<T> extends ResponseError<400, T> {
    constructor(message: string, details?: T) {
        super(400, message, details);
    }
}

export class ResponseUnauthorized<T> extends ResponseError<401, T> {
    constructor(message: string, details?: T) {
        super(401, message, details);
    }
}

export class ResponseForbidden<T> extends ResponseError<403, T> {
    constructor(message: string, details?: T) {
        super(403, message, details);
    }
}

export class ResponseNotFound<T> extends ResponseError<404, T> {
    constructor(message: string, details?: T) {
        super(404, message, details);
    }
}

export class ResponseConflict<T> extends ResponseError<409, T> {
    constructor(message: string, details?: T) {
        super(409, message, details);
    }
}

export class ResponseUnprocessableEntity<T> extends ResponseError<422, T> {
    constructor(message: string, details?: T) {
        super(422, message, details);
    }
}

export class ResponseTooManyRequests<T> extends ResponseError<429, T> {
    constructor(message: string, details?: T) {
        super(429, message, details);
    }
}

export class ResponseInternalServerError<T> extends ResponseError<500, T> {
    constructor(message: string, details?: T) {
        super(500, message, details);
    }
}

export class ResponseServiceUnavailable<T> extends ResponseError<503, T> {
    constructor(message: string, details?: T) {
        super(503, message, details);
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
}, {
    $id: 'ResponseErrorSchema'
});


export const useResponseErrorSchema = <S extends TSchema, Code extends number>(code: Code, schema?: S) => {
    const errorSchema = Type.Object({
        error: Type.String(),
        details: Type.Optional(schema ?? Type.Any({
            default: null
        }))
    }, {
        $id: `ResponseErrorSchema_${code}`
    });

    const sendError = <P extends Static<S>>(message: string, details?: P) => {
        return new ResponseError<typeof code, P>(code, message, details);
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
export const responseError = <T>(message: string, details?: T) => new ResponseError(400, message, details);


// Response error with details
export const response400 = <P>(message: string, details?: P) => {
    return new ResponseError(400, message, details);
};

export const response401 = <P>(message: string, details?: P) => {
    return new ResponseError(401, message, details);
};

export const response403 = <P>(message: string, details?: P) => {
    return new ResponseError(403, message, details);
};

export const response404 = <P>(message: string, details?: P) => {
    return new ResponseError(404, message, details);
};

export const response409 = <P>(message: string, details?: P) => {
    return new ResponseError(409, message, details);
};

export const response422 = <P>(message: string, details?: P) => {
    return new ResponseError(422, message, details);
};

export const response429 = <P>(message: string, details?: P) => {
    return new ResponseError(429, message, details);
};

export const response500 = <P>(message: string, details?: P) => {
    return new ResponseError(500, message, details);
};

export const response503 = <P>(message: string, details?: P) => {
    return new ResponseError(503, message, details);
};

export const responseForbidden = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseError(403, message, details);
export const responseNotFound = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseError(404, message, details);
export const responseConflict = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseError(409, message, details);
export const responseUnprocessableEntity = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseError(422, message, details);
export const responseTooManyRequests = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseError(429, message, details);
export const responseBadRequest = <P extends TSchema>(message: string, details?: Static<P>) => new ResponseError(400, message, details);

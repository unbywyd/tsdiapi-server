import { Static, TSchema, Type } from "@sinclair/typebox";

export type StatusCode = 200 | 201 | 202 | 204 | 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 | 503;

export class ResponseErrorClass<T extends StatusCode, P> {
    status: T;
    data: {
        error: string;
        payload?: P;
    }
    constructor(message: string, status: T, payload?: P) {
        this.status = status;
        this.data = {
            error: message,
            payload
        };
    }
}

export class ResponseSuccessClass<T, S extends StatusCode> {
    status: S;
    data: T;
    constructor(data: T, status: S) {
        this.status = status;
        this.data = data;
    }
}

export const ResponseErrorSchema = Type.Object({
    error: Type.String(),
    payload: Type.Optional(Type.Any({
        default: null
    }))
});

export const useResponseErrorSchema = <S extends TSchema, C extends StatusCode>(code: C, schema: S) => {
    const errorSchema = Type.Object({
        error: Type.String(),
        payload: Type.Optional(schema)
    });

    const sendError = <P extends Static<S>>(message: string, payload: P) => {
        return new ResponseErrorClass<C, P>(message, code, payload);
    };

    return {
        register: [code, errorSchema] as const,
        send: sendError
    };
};

export const useResponseSchema = <S extends TSchema, C extends StatusCode>(code: C, schema: S) => {
    const sendSuccess = <P extends Static<S>>(data: P) => {
        return new ResponseSuccessClass<P, C>(data, code);
    };

    return {
        register: [code, schema] as const,
        send: sendSuccess
    };
};

export const useSuccessResponseSchema = <S extends TSchema>(schema: S) => {
    return useResponseSchema(200, schema);
}

export const useErrorResponseSchema = <E extends TSchema>(schema: E) => {
    return useResponseErrorSchema(400, schema);
}

export const useForbiddenResponseSchema = <E extends TSchema>(schema: E) => {
    return useResponseErrorSchema(403, schema);
}

export const useNotFoundResponseSchema = <E extends TSchema>(schema: E) => {
    return useResponseErrorSchema(404, schema);
}

export const useConflictResponseSchema = <E extends TSchema>(schema: E) => {
    return useResponseErrorSchema(409, schema);
}

export const useUnprocessableEntityResponseSchema = <E extends TSchema>(schema: E) => {
    return useResponseErrorSchema(422, schema);
}

export const useTooManyRequestsResponseSchema = <E extends TSchema>(schema: E) => {
    return useResponseErrorSchema(429, schema);
}

export const useInternalServerErrorResponseSchema = <E extends TSchema>(schema: E) => {
    return useResponseErrorSchema(500, schema);
}

export const useServiceUnavailableResponseSchema = <E extends TSchema>(schema: E) => {
    return useResponseErrorSchema(503, schema);
}


export const useResponseSchemas = <S extends TSchema, E extends TSchema, SC extends StatusCode, EC extends StatusCode>(
    successCode: SC,
    successSchema: S,
    errorCode: EC,
    errorSchema: E
) => {
    const { register: errorRegister, send: sendError } = useResponseErrorSchema(errorCode, errorSchema);
    const { register: successRegister, send: sendSuccess } = useResponseSchema(successCode, successSchema);
    return {
        errorRegister,
        sendError,
        successRegister,
        sendSuccess
    };
};

export const useBaseResponseSchemas = <S extends TSchema, E extends TSchema>(
    successSchema: S,
    errorSchema: E
) => {
    const { register: errorRegister, send: sendError } = useResponseErrorSchema(400, errorSchema);
    const { register: successRegister, send: sendSuccess } = useResponseSchema(200, successSchema);
    return {
        errorRegister,
        sendError,
        successRegister,
        sendSuccess
    };
};

// Client errors (4xx)
export const Response400Error = <P extends TSchema>(message: string, payload?: Static<P>) => new ResponseErrorClass(message, 400 as const, payload); // Bad Response
export const Response401Error = <P extends TSchema>(message: string, payload?: Static<P>) => new ResponseErrorClass(message, 401 as const, payload); // Unauthorized
export const Response403Error = <P extends TSchema>(message: string, payload?: Static<P>) => new ResponseErrorClass(message, 403 as const, payload); // Forbidden
export const Response404Error = <P extends TSchema>(message: string, payload?: Static<P>) => new ResponseErrorClass(message, 404 as const, payload); // Not Found
export const Response409Error = <P extends TSchema>(message: string, payload?: Static<P>) => new ResponseErrorClass(message, 409 as const, payload); // Conflict
export const Response422Error = <P extends TSchema>(message: string, payload?: Static<P>) => new ResponseErrorClass(message, 422 as const, payload); // Unprocessable Entity
export const Response429Error = <P extends TSchema>(message: string, payload?: Static<P>) => new ResponseErrorClass(message, 429 as const, payload); // Too Many Responses

export const ResponseForbiddenError = <P extends TSchema>(message: string, payload?: Static<P>) => new ResponseErrorClass(message, 403 as const, payload);
export const ResponseNotFoundError = <P extends TSchema>(message: string, payload?: Static<P>) => new ResponseErrorClass(message, 404 as const, payload);
export const ResponseConflictError = <P extends TSchema>(message: string, payload?: Static<P>) => new ResponseErrorClass(message, 409 as const, payload);
export const ResponseUnprocessableEntityError = <P extends TSchema>(message: string, payload?: Static<P>) => new ResponseErrorClass(message, 422 as const, payload);
export const ResponseTooManyRequestsError = <P extends TSchema>(message: string, payload?: Static<P>) => new ResponseErrorClass(message, 429 as const, payload);
export const ResponseBadRequestError = <P extends TSchema>(message: string, payload?: Static<P>) => new ResponseErrorClass(message, 400 as const, payload);

// Server errors (5xx)
export const Response500Error = <P extends TSchema>(message: string, payload?: Static<P>) => new ResponseErrorClass(message, 500 as const, payload); // Internal Server Error
export const Response503Error = <P extends TSchema>(message: string, payload?: Static<P>) => new ResponseErrorClass(message, 503 as const, payload); // Service Unavailable


export const ResponseSuccess = <T>(data: T) => new ResponseSuccessClass(data, 200 as const);
export const Response200Success = <T>(data: T) => new ResponseSuccessClass(data, 200 as const);
export const Response201Success = <T>(data: T) => new ResponseSuccessClass(data, 201 as const);
export const Response202Success = <T>(data: T) => new ResponseSuccessClass(data, 202 as const);
export const Response204Success = <T>(data: T) => new ResponseSuccessClass(data, 204 as const);
export const ResponseNullSuccess = () => new ResponseSuccessClass(null, 204 as const);

import { Static, TSchema } from "@sinclair/typebox";
export declare class ResponseError<T extends number, P> {
    status: T;
    data: {
        error: string;
        details?: P;
    };
    constructor(status: T, message: string, details?: P);
    toJSON(): {
        status: T;
        data: {
            error: string;
            details?: P;
        };
    };
    throw(): void;
}
export declare class ResponseBadRequest<T> extends ResponseError<400, T> {
    constructor(message: string, details?: T);
}
export declare class ResponseUnauthorized<T> extends ResponseError<401, T> {
    constructor(message: string, details?: T);
}
export declare class ResponseForbidden<T> extends ResponseError<403, T> {
    constructor(message: string, details?: T);
}
export declare class ResponseNotFound<T> extends ResponseError<404, T> {
    constructor(message: string, details?: T);
}
export declare class ResponseConflict<T> extends ResponseError<409, T> {
    constructor(message: string, details?: T);
}
export declare class ResponseUnprocessableEntity<T> extends ResponseError<422, T> {
    constructor(message: string, details?: T);
}
export declare class ResponseTooManyRequests<T> extends ResponseError<429, T> {
    constructor(message: string, details?: T);
}
export declare class ResponseInternalServerError<T> extends ResponseError<500, T> {
    constructor(message: string, details?: T);
}
export declare class ResponseServiceUnavailable<T> extends ResponseError<503, T> {
    constructor(message: string, details?: T);
}
export declare class Response<T, S extends number> {
    status: S;
    data: T;
    constructor(data: T, status: S);
}
export declare const ResponseErrorSchema: import("@sinclair/typebox").TObject<{
    error: import("@sinclair/typebox").TString;
    details: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
}>;
export declare const useResponseErrorSchema: <S extends TSchema, Code extends number>(code: Code, schema?: S) => {
    register: readonly [Code, import("@sinclair/typebox").TObject<{
        error: import("@sinclair/typebox").TString;
        details: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny> | (S extends import("@sinclair/typebox").TOptional<infer S_1 extends TSchema> ? import("@sinclair/typebox").TOptional<S_1> : import("@sinclair/typebox").Ensure<import("@sinclair/typebox").TOptional<S>>);
    }>];
    send: <P extends Static<S>>(message: string, details?: P) => ResponseError<Code, P>;
};
export declare const useResponseSchema: <S extends TSchema, Code extends number>(code: Code, schema: S) => {
    register: readonly [Code, S];
    send: <P extends Static<S>>(data: P) => Response<P, Code>;
};
export declare const buildResponseCodes: <S extends TSchema, E extends TSchema = import("@sinclair/typebox").TObject<{
    error: import("@sinclair/typebox").TString;
    details: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
}>>(successSchema: S, errorSchema?: E) => {
    readonly 200: S;
    readonly 400: import("@sinclair/typebox").TObject<{
        error: import("@sinclair/typebox").TString;
        details: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
    }> | E;
    readonly 401: import("@sinclair/typebox").TObject<{
        error: import("@sinclair/typebox").TString;
        details: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
    }> | E;
    readonly 403: import("@sinclair/typebox").TObject<{
        error: import("@sinclair/typebox").TString;
        details: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
    }> | E;
    readonly 404: import("@sinclair/typebox").TObject<{
        error: import("@sinclair/typebox").TString;
        details: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
    }> | E;
    readonly 409: import("@sinclair/typebox").TObject<{
        error: import("@sinclair/typebox").TString;
        details: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
    }> | E;
    readonly 422: import("@sinclair/typebox").TObject<{
        error: import("@sinclair/typebox").TString;
        details: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
    }> | E;
    readonly 429: import("@sinclair/typebox").TObject<{
        error: import("@sinclair/typebox").TString;
        details: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
    }> | E;
    readonly 500: import("@sinclair/typebox").TObject<{
        error: import("@sinclair/typebox").TString;
        details: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
    }> | E;
    readonly 503: import("@sinclair/typebox").TObject<{
        error: import("@sinclair/typebox").TString;
        details: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
    }> | E;
};
export declare const buildExtraResponseCodes: <S extends TSchema, E extends TSchema>(successSchema: S, errorSchema?: E) => {
    200: S;
    400: import("@sinclair/typebox").TObject<{
        error: import("@sinclair/typebox").TString;
        details: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
    }> | E;
    401: import("@sinclair/typebox").TObject<{
        error: import("@sinclair/typebox").TString;
        details: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
    }> | E;
    403: import("@sinclair/typebox").TObject<{
        error: import("@sinclair/typebox").TString;
        details: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
    }> | E;
};
export declare const useResponseSchemas: <S extends TSchema, E extends TSchema>(successSchema: S, errorSchema?: E) => {
    codes: {
        200: S;
        400: import("@sinclair/typebox").TObject<{
            error: import("@sinclair/typebox").TString;
            details: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny> | (E extends import("@sinclair/typebox").TOptional<infer S_1 extends TSchema> ? import("@sinclair/typebox").TOptional<S_1> : import("@sinclair/typebox").Ensure<import("@sinclair/typebox").TOptional<E>>);
        }>;
        401: import("@sinclair/typebox").TObject<{
            error: import("@sinclair/typebox").TString;
            details: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny> | (E extends import("@sinclair/typebox").TOptional<infer S_1 extends TSchema> ? import("@sinclair/typebox").TOptional<S_1> : import("@sinclair/typebox").Ensure<import("@sinclair/typebox").TOptional<E>>);
        }>;
        403: import("@sinclair/typebox").TObject<{
            error: import("@sinclair/typebox").TString;
            details: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny> | (E extends import("@sinclair/typebox").TOptional<infer S_1 extends TSchema> ? import("@sinclair/typebox").TOptional<S_1> : import("@sinclair/typebox").Ensure<import("@sinclair/typebox").TOptional<E>>);
        }>;
    };
    sendError: <P extends (E & {
        params: [];
    })["static"]>(message: string, details?: P) => ResponseError<400, P>;
    sendSuccess: <P extends (S & {
        params: [];
    })["static"]>(data: P) => Response<P, 200>;
    send: <T extends Static<typeof errorSchema> | Static<typeof successSchema>>(data: T) => ReturnType<(<P extends (E & {
        params: [];
    })["static"]>(message: string, details?: P) => ResponseError<400, P>)> | ReturnType<(<P extends (S & {
        params: [];
    })["static"]>(data: P) => Response<P, 200>)>;
};
export declare const responseSuccess: <T>(data: T) => Response<T, 200>;
export declare const response200: <T>(data: T) => Response<T, 200>;
export declare const response201: <T>(data: T) => Response<T, 201>;
export declare const response202: <T>(data: T) => Response<T, 202>;
export declare const response204: <T>(data: T) => Response<T, 204>;
export declare const responseNull: () => Response<any, 204>;
export declare const responseError: <T>(message: string, details?: T) => ResponseError<400, T>;
export declare const response400: <P>(message: string, details?: P) => ResponseError<400, P>;
export declare const response401: <P>(message: string, details?: P) => ResponseError<401, P>;
export declare const response403: <P>(message: string, details?: P) => ResponseError<403, P>;
export declare const response404: <P>(message: string, details?: P) => ResponseError<404, P>;
export declare const response409: <P>(message: string, details?: P) => ResponseError<409, P>;
export declare const response422: <P>(message: string, details?: P) => ResponseError<422, P>;
export declare const response429: <P>(message: string, details?: P) => ResponseError<429, P>;
export declare const response500: <P>(message: string, details?: P) => ResponseError<500, P>;
export declare const response503: <P>(message: string, details?: P) => ResponseError<503, P>;
export declare const responseForbidden: <P extends TSchema>(message: string, details?: Static<P>) => ResponseError<403, (P & {
    params: [];
})["static"]>;
export declare const responseNotFound: <P extends TSchema>(message: string, details?: Static<P>) => ResponseError<404, (P & {
    params: [];
})["static"]>;
export declare const responseConflict: <P extends TSchema>(message: string, details?: Static<P>) => ResponseError<409, (P & {
    params: [];
})["static"]>;
export declare const responseUnprocessableEntity: <P extends TSchema>(message: string, details?: Static<P>) => ResponseError<422, (P & {
    params: [];
})["static"]>;
export declare const responseTooManyRequests: <P extends TSchema>(message: string, details?: Static<P>) => ResponseError<429, (P & {
    params: [];
})["static"]>;
export declare const responseBadRequest: <P extends TSchema>(message: string, details?: Static<P>) => ResponseError<400, (P & {
    params: [];
})["static"]>;
//# sourceMappingURL=response.d.ts.map
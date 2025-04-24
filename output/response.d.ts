import { Static, TSchema } from "@sinclair/typebox";
export declare class ResponseErrorClass<T extends number, P> {
    status: T;
    data: {
        error: string;
        details?: P;
    };
    constructor(message: string, status: T, details?: P);
}
export declare class ResponseClass<T, S extends number> {
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
    send: <P extends Static<S>>(message: string, details?: P) => ResponseErrorClass<Code, P>;
};
export declare const useResponseSchema: <S extends TSchema, Code extends number>(code: Code, schema: S) => {
    register: readonly [Code, S];
    send: <P extends Static<S>>(data: P) => ResponseClass<P, Code>;
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
        409: import("@sinclair/typebox").TObject<{
            error: import("@sinclair/typebox").TString;
            details: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny> | (E extends import("@sinclair/typebox").TOptional<infer S_1 extends TSchema> ? import("@sinclair/typebox").TOptional<S_1> : import("@sinclair/typebox").Ensure<import("@sinclair/typebox").TOptional<E>>);
        }>;
        422: import("@sinclair/typebox").TObject<{
            error: import("@sinclair/typebox").TString;
            details: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny> | (E extends import("@sinclair/typebox").TOptional<infer S_1 extends TSchema> ? import("@sinclair/typebox").TOptional<S_1> : import("@sinclair/typebox").Ensure<import("@sinclair/typebox").TOptional<E>>);
        }>;
        429: import("@sinclair/typebox").TObject<{
            error: import("@sinclair/typebox").TString;
            details: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny> | (E extends import("@sinclair/typebox").TOptional<infer S_1 extends TSchema> ? import("@sinclair/typebox").TOptional<S_1> : import("@sinclair/typebox").Ensure<import("@sinclair/typebox").TOptional<E>>);
        }>;
        500: import("@sinclair/typebox").TObject<{
            error: import("@sinclair/typebox").TString;
            details: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny> | (E extends import("@sinclair/typebox").TOptional<infer S_1 extends TSchema> ? import("@sinclair/typebox").TOptional<S_1> : import("@sinclair/typebox").Ensure<import("@sinclair/typebox").TOptional<E>>);
        }>;
        503: import("@sinclair/typebox").TObject<{
            error: import("@sinclair/typebox").TString;
            details: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny> | (E extends import("@sinclair/typebox").TOptional<infer S_1 extends TSchema> ? import("@sinclair/typebox").TOptional<S_1> : import("@sinclair/typebox").Ensure<import("@sinclair/typebox").TOptional<E>>);
        }>;
    };
    sendError: <P extends (E & {
        params: [];
    })["static"]>(message: string, details?: P) => ResponseErrorClass<400, P>;
    sendSuccess: <P extends (S & {
        params: [];
    })["static"]>(data: P) => ResponseClass<P, 200>;
    send: <T extends Static<typeof errorSchema> | Static<typeof successSchema>>(data: T) => ReturnType<(<P extends (E & {
        params: [];
    })["static"]>(message: string, details?: P) => ResponseErrorClass<400, P>)> | ReturnType<(<P extends (S & {
        params: [];
    })["static"]>(data: P) => ResponseClass<P, 200>)>;
};
export declare const responseSuccess: <T>(data: T) => ResponseClass<T, 200>;
export declare const response200: <T>(data: T) => ResponseClass<T, 200>;
export declare const response201: <T>(data: T) => ResponseClass<T, 201>;
export declare const response202: <T>(data: T) => ResponseClass<T, 202>;
export declare const response204: <T>(data: T) => ResponseClass<T, 204>;
export declare const responseNull: () => ResponseClass<any, 204>;
export declare const responseError: <T>(data: T) => ResponseClass<T, 400>;
export declare const responseForbidden: <T>(data: T) => ResponseClass<T, 403>;
export declare const responseNotFound: <T>(data: T) => ResponseClass<T, 404>;
export declare const responseConflict: <T>(data: T) => ResponseClass<T, 409>;
export declare const responseUnprocessableEntity: <T>(data: T) => ResponseClass<T, 422>;
export declare const responseTooManyRequests: <T>(data: T) => ResponseClass<T, 429>;
export declare const responseInternalServerError: <T>(data: T) => ResponseClass<T, 500>;
export declare const responseServiceUnavailable: <T>(data: T) => ResponseClass<T, 503>;
export declare const response400Error: <P extends TSchema>(message: string, details?: Static<P>) => ResponseErrorClass<400, (P & {
    params: [];
})["static"]>;
export declare const response401Error: <P extends TSchema>(message: string, details?: Static<P>) => ResponseErrorClass<401, (P & {
    params: [];
})["static"]>;
export declare const response403Error: <P extends TSchema>(message: string, details?: Static<P>) => ResponseErrorClass<403, (P & {
    params: [];
})["static"]>;
export declare const response404Error: <P extends TSchema>(message: string, details?: Static<P>) => ResponseErrorClass<404, (P & {
    params: [];
})["static"]>;
export declare const response409Error: <P extends TSchema>(message: string, details?: Static<P>) => ResponseErrorClass<409, (P & {
    params: [];
})["static"]>;
export declare const response422Error: <P extends TSchema>(message: string, details?: Static<P>) => ResponseErrorClass<422, (P & {
    params: [];
})["static"]>;
export declare const response429Error: <P extends TSchema>(message: string, details?: Static<P>) => ResponseErrorClass<429, (P & {
    params: [];
})["static"]>;
export declare const responseForbiddenError: <P extends TSchema>(message: string, details?: Static<P>) => ResponseErrorClass<403, (P & {
    params: [];
})["static"]>;
export declare const responseNotFoundError: <P extends TSchema>(message: string, details?: Static<P>) => ResponseErrorClass<404, (P & {
    params: [];
})["static"]>;
export declare const responseConflictError: <P extends TSchema>(message: string, details?: Static<P>) => ResponseErrorClass<409, (P & {
    params: [];
})["static"]>;
export declare const responseUnprocessableEntityError: <P extends TSchema>(message: string, details?: Static<P>) => ResponseErrorClass<422, (P & {
    params: [];
})["static"]>;
export declare const responseTooManyRequestsError: <P extends TSchema>(message: string, details?: Static<P>) => ResponseErrorClass<429, (P & {
    params: [];
})["static"]>;
export declare const responseBadRequestError: <P extends TSchema>(message: string, details?: Static<P>) => ResponseErrorClass<400, (P & {
    params: [];
})["static"]>;
export declare const response500Error: <P extends TSchema>(message: string, details?: Static<P>) => ResponseErrorClass<500, (P & {
    params: [];
})["static"]>;
export declare const response503Error: <P extends TSchema>(message: string, details?: Static<P>) => ResponseErrorClass<503, (P & {
    params: [];
})["static"]>;
//# sourceMappingURL=response.d.ts.map
import { Static, TSchema } from "@sinclair/typebox";
export type StatusCode = 200 | 201 | 202 | 204 | 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 | 503;
export declare class ResponseErrorClass<T extends StatusCode, P> {
    status: T;
    data: {
        error: string;
        payload?: P;
    };
    constructor(message: string, status: T, payload?: P);
}
export declare class ResponseSuccessClass<T, S extends StatusCode> {
    status: S;
    data: T;
    constructor(data: T, status: S);
}
export declare const ResponseErrorSchema: import("@sinclair/typebox").TObject<{
    error: import("@sinclair/typebox").TString;
    payload: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
}>;
export declare const useResponseErrorSchema: <S extends TSchema, C extends StatusCode>(code: C, schema: S) => {
    register: readonly [C, import("@sinclair/typebox").TObject<{
        error: import("@sinclair/typebox").TString;
        payload: S extends import("@sinclair/typebox").TOptional<infer S_1 extends TSchema> ? import("@sinclair/typebox").TOptional<S_1> : import("@sinclair/typebox").Ensure<import("@sinclair/typebox").TOptional<S>>;
    }>];
    send: <P extends Static<S>>(message: string, payload: P) => ResponseErrorClass<C, P>;
};
export declare const useResponseSchema: <S extends TSchema, C extends StatusCode>(code: C, schema: S) => {
    register: readonly [C, S];
    send: <P extends Static<S>>(data: P) => ResponseSuccessClass<P, C>;
};
export declare const useResponseSchemas: <S extends TSchema, E extends TSchema, SC extends StatusCode, EC extends StatusCode>(successCode: SC, successSchema: S, errorCode: EC, errorSchema: E) => {
    errorRegister: readonly [EC, import("@sinclair/typebox").TObject<{
        error: import("@sinclair/typebox").TString;
        payload: E extends import("@sinclair/typebox").TOptional<infer S_1 extends TSchema> ? import("@sinclair/typebox").TOptional<S_1> : import("@sinclair/typebox").Ensure<import("@sinclair/typebox").TOptional<E>>;
    }>];
    sendError: <P extends (E & {
        params: [];
    })["static"]>(message: string, payload: P) => ResponseErrorClass<EC, P>;
    successRegister: readonly [SC, S];
    sendSuccess: <P extends (S & {
        params: [];
    })["static"]>(data: P) => ResponseSuccessClass<P, SC>;
};
export declare const useBaseResponseSchemas: <S extends TSchema, E extends TSchema>(successSchema: S, errorSchema: E) => {
    errorRegister: readonly [400, import("@sinclair/typebox").TObject<{
        error: import("@sinclair/typebox").TString;
        payload: E extends import("@sinclair/typebox").TOptional<infer S_1 extends TSchema> ? import("@sinclair/typebox").TOptional<S_1> : import("@sinclair/typebox").Ensure<import("@sinclair/typebox").TOptional<E>>;
    }>];
    sendError: <P extends (E & {
        params: [];
    })["static"]>(message: string, payload: P) => ResponseErrorClass<400, P>;
    successRegister: readonly [200, S];
    sendSuccess: <P extends (S & {
        params: [];
    })["static"]>(data: P) => ResponseSuccessClass<P, 200>;
};
export declare const Response400Error: <P extends TSchema>(message: string, payload?: Static<P>) => ResponseErrorClass<400, (P & {
    params: [];
})["static"]>;
export declare const Response401Error: <P extends TSchema>(message: string, payload?: Static<P>) => ResponseErrorClass<401, (P & {
    params: [];
})["static"]>;
export declare const Response403Error: <P extends TSchema>(message: string, payload?: Static<P>) => ResponseErrorClass<403, (P & {
    params: [];
})["static"]>;
export declare const Response404Error: <P extends TSchema>(message: string, payload?: Static<P>) => ResponseErrorClass<404, (P & {
    params: [];
})["static"]>;
export declare const Response409Error: <P extends TSchema>(message: string, payload?: Static<P>) => ResponseErrorClass<409, (P & {
    params: [];
})["static"]>;
export declare const Response422Error: <P extends TSchema>(message: string, payload?: Static<P>) => ResponseErrorClass<422, (P & {
    params: [];
})["static"]>;
export declare const Response429Error: <P extends TSchema>(message: string, payload?: Static<P>) => ResponseErrorClass<429, (P & {
    params: [];
})["static"]>;
export declare const ResponseForbiddenError: <P extends TSchema>(message: string, payload?: Static<P>) => ResponseErrorClass<403, (P & {
    params: [];
})["static"]>;
export declare const ResponseNotFoundError: <P extends TSchema>(message: string, payload?: Static<P>) => ResponseErrorClass<404, (P & {
    params: [];
})["static"]>;
export declare const ResponseConflictError: <P extends TSchema>(message: string, payload?: Static<P>) => ResponseErrorClass<409, (P & {
    params: [];
})["static"]>;
export declare const ResponseUnprocessableEntityError: <P extends TSchema>(message: string, payload?: Static<P>) => ResponseErrorClass<422, (P & {
    params: [];
})["static"]>;
export declare const ResponseTooManyRequestsError: <P extends TSchema>(message: string, payload?: Static<P>) => ResponseErrorClass<429, (P & {
    params: [];
})["static"]>;
export declare const ResponseBadRequestError: <P extends TSchema>(message: string, payload?: Static<P>) => ResponseErrorClass<400, (P & {
    params: [];
})["static"]>;
export declare const Response500Error: <P extends TSchema>(message: string, payload?: Static<P>) => ResponseErrorClass<500, (P & {
    params: [];
})["static"]>;
export declare const Response503Error: <P extends TSchema>(message: string, payload?: Static<P>) => ResponseErrorClass<503, (P & {
    params: [];
})["static"]>;
export declare const ResponseSuccess: <T>(data: T) => ResponseSuccessClass<T, 200>;
export declare const Response200Success: <T>(data: T) => ResponseSuccessClass<T, 200>;
export declare const Response201Success: <T>(data: T) => ResponseSuccessClass<T, 201>;
export declare const Response202Success: <T>(data: T) => ResponseSuccessClass<T, 202>;
export declare const Response204Success: <T>(data: T) => ResponseSuccessClass<T, 204>;
export declare const ResponseNullSuccess: () => ResponseSuccessClass<any, 204>;
//# sourceMappingURL=response.d.ts.map
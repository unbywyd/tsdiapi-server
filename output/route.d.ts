import { FastifyError, FastifyInstance, FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { Static, TSchema } from '@sinclair/typebox';
import { AppContext, UploadFile } from './types.js';
export type FileOptions = {
    maxFileSize?: number;
    accept?: string[];
    maxFiles?: number;
};
export declare function groupFilesByFieldname(files: UploadFile[]): Record<string, UploadFile[]>;
export type OnSendHook = (this: RouteBuilder, request: RequestWithState, reply: FastifyReply, payload: unknown) => void | Promise<void>;
export type PreValidationHook = (this: RouteBuilder, request: RequestWithState, reply: FastifyReply) => void | Promise<void> | false;
export type OnRequestHook = (this: RouteBuilder, request: RequestWithState, reply: FastifyReply) => void | Promise<void>;
export type PreSerializationHook = (this: RouteBuilder, request: RequestWithState, reply: FastifyReply, payload: unknown) => void | Promise<void>;
export type OnResponseHook = (this: RouteBuilder, request: RequestWithState, reply: FastifyReply) => void | Promise<void>;
export type OnErrorHook = (this: RouteBuilder, error: FastifyError, request: RequestWithState, reply: FastifyReply) => void | Promise<void>;
export type ErrorHandlerHook = (this: RouteBuilder, error: FastifyError, request: RequestWithState, reply: FastifyReply) => void | Promise<void>;
export type PreParsingHook = (this: RouteBuilder, request: RequestWithState, reply: FastifyReply, payload: unknown) => void | Promise<void>;
export type GuardFn<TResponses extends Record<number, TSchema>> = (this: RouteBuilder, request: RequestWithState, reply: FastifyReply) => boolean | ResponseUnion<TResponses> | Promise<boolean | ResponseUnion<TResponses>>;
export type StatusSchemas = Record<number, TSchema>;
export type ResponseUnion<TResponses extends StatusSchemas> = {
    [K in keyof TResponses]: K extends number ? {
        status: K;
        data: Static<TResponses[K]>;
    } : never;
}[keyof TResponses];
type MergeStatus<TCurrent extends StatusSchemas, Code extends number, Schema extends TSchema> = TCurrent & {
    [P in Code]: Schema;
};
export type HookType = 'preHandler' | 'onRequest' | 'preValidation' | 'preParsing' | 'preSerialization' | 'onSend' | 'onResponse' | 'onError';
export type PrehandlerFn<TResponses extends StatusSchemas, TState> = (this: RouteBuilder, request: RequestWithState, reply: FastifyReply) => Promise<ResponseUnion<TResponses>> | ResponseUnion<TResponses>;
declare module 'fastify' {
    interface FastifyRequest {
        routeData?: unknown;
        tempFiles?: Array<UploadFile>;
        session?: Record<string, any> | null;
    }
}
export type RequestWithState<Params extends TSchema = TSchema, Body extends TSchema = TSchema, Query extends TSchema = TSchema, Headers extends TSchema = TSchema, TState = unknown> = FastifyRequest<{
    Params: Static<Params>;
    Body: Static<Body>;
    Querystring: Static<Query>;
    Headers: Static<Headers>;
}> & {
    routeData: TState;
};
export declare class RouteBuilder<Params extends TSchema = TSchema, Body extends TSchema = TSchema, Query extends TSchema = TSchema, Headers extends TSchema = TSchema, TResponses extends StatusSchemas = {}, TState = unknown> {
    private appContext;
    private config;
    fastify: FastifyInstance;
    constructor(appContext: AppContext<Record<string, any>>);
    setRequestFormat(contentType: string): this;
    acceptJson(): this;
    acceptMultipart(): this;
    acceptText(): this;
    setResponseFormat(contentType: string): this;
    json(): this;
    binary(): this;
    rawResponse(contentType: string): this;
    multipart(): this;
    consumes(consumes: string[]): this;
    text(): this;
    responseType(type: string): this;
    get(path: string): this;
    post(path: string): this;
    put(path: string): this;
    delete(path: string): this;
    patch(path: string): this;
    options(path: string): this;
    tags(tags: string[]): this;
    summary(summary: string): this;
    description(description: string): this;
    auth(type?: "bearer" | "basic" | "apiKey", guard?: GuardFn<TResponses>): this;
    params<T extends TSchema>(schema: T): RouteBuilder<T, Body, Query, Headers, TResponses, TState>;
    body<T extends TSchema>(schema: T): RouteBuilder<Params, T, Query, Headers, TResponses, TState>;
    query<T extends TSchema>(schema: T): RouteBuilder<Params, Body, T, Headers, TResponses, TState>;
    headers<T extends TSchema>(schema: T): RouteBuilder<Params, Body, Query, T, TResponses, TState>;
    code<Code extends number, T extends TSchema>(code: Code, schema: T): RouteBuilder<Params, Body, Query, Headers, MergeStatus<TResponses, Code, T>, TState>;
    guard(fn: GuardFn<TResponses>): this;
    onRequest(fn: OnRequestHook): this;
    preValidation(fn: PreValidationHook): this;
    preParsing(fn: PreParsingHook): this;
    preSerialization(fn: PreSerializationHook): this;
    preHandler(fn: PrehandlerFn<StatusSchemas, unknown>): this;
    onSend(fn: OnSendHook): this;
    onResponse(fn: OnResponseHook): this;
    onError(fn: OnErrorHook): this;
    setErrorHandler(fn: ErrorHandlerHook): this;
    resolve<TNewState extends TState>(fn: (req: FastifyRequest) => Promise<TNewState> | TNewState): RouteBuilder<Params, Body, Query, Headers, TResponses, TNewState>;
    handler(fn: (req: RequestWithState<Params, Body, Query, Headers, TState>, reply: FastifyReply) => Promise<ResponseUnion<TResponses> | string> | (ResponseUnion<TResponses> | string)): this;
    responseHeader<Code extends keyof TResponses>(name: string, value: string, statusCode: Code): this;
    cacheControl(value: string): this;
    fileOptions(options: FileOptions, key?: keyof Static<Body>): this;
    modify(fn: (routeConfig: RouteOptions & {
        state?: TState;
    }) => Promise<RouteOptions> | RouteOptions): this;
    build(): Promise<void>;
}
export {};
//# sourceMappingURL=route.d.ts.map
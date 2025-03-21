import { FastifyError, FastifyInstance, FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { Static, TSchema } from '@sinclair/typebox';
import { AppContext, UploadFile } from './types.js';
export type FileOptions = {
    maxFileSize?: number;
    accept?: string[];
    maxFiles?: number;
};
export type OnSendHook = (this: RouteBuilder, request: RequestWithState, reply: FastifyReply, payload: unknown) => void | Promise<void>;
export type PreValidationHook = (this: RouteBuilder, request: RequestWithState, reply: FastifyReply) => void | Promise<void> | false;
export type OnRequestHook = (this: RouteBuilder, request: RequestWithState, reply: FastifyReply) => void | Promise<void>;
export type PreSerializationHook = (this: RouteBuilder, request: RequestWithState, reply: FastifyReply, payload: unknown) => void | Promise<void>;
export type OnResponseHook = (this: RouteBuilder, request: RequestWithState, reply: FastifyReply) => void | Promise<void>;
export type OnErrorHook = (this: RouteBuilder, error: FastifyError, request: RequestWithState, reply: FastifyReply) => void | Promise<void>;
export type ErrorHandlerHook = (this: RouteBuilder, error: FastifyError, request: RequestWithState, reply: FastifyReply) => void | Promise<void>;
export type PreParsingHook = (this: RouteBuilder, request: RequestWithState, reply: FastifyReply, payload: unknown) => void | Promise<void>;
export type GuardFn<TResponses extends Record<number, TSchema>, TState> = (this: RouteBuilder, request: RequestWithState, reply: FastifyReply) => boolean | ResponseUnion<TResponses> | Promise<boolean | ResponseUnion<TResponses>>;
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
export type PrehandlerFn = (this: RouteBuilder, req: RequestWithState, reply: FastifyReply) => Promise<unknown> | unknown;
export type HandlerFn = (this: RouteBuilder, req: RequestWithState, reply: FastifyReply) => Promise<unknown> | unknown;
export interface RouteConfig<TState = unknown> {
    method: string;
    url: string;
    modify?: (routeConfig: RouteOptions) => Promise<RouteOptions> | RouteOptions;
    schema: {
        params?: TSchema;
        body?: TSchema;
        querystring?: TSchema;
        headers?: TSchema;
        response?: Record<number, TSchema>;
    };
    errorHandler?: ErrorHandlerHook;
    fileOptions?: Record<string, FileOptions>;
    guards: Array<GuardFn<StatusSchemas, TState>>;
    preHandlers: Array<PrehandlerFn> | null;
    preValidation: PreValidationHook | null;
    preParsing: PreParsingHook | null;
    preSerialization: PreSerializationHook | null;
    onRequest: OnRequestHook | null;
    onSend: OnSendHook | null;
    onResponse: OnResponseHook | null;
    onError: OnErrorHook | null;
    resolver?: (req: FastifyRequest) => Promise<TState> | TState;
    responseHeaders: Record<string, string>;
    isMultipart?: boolean;
    responseType?: string;
    cacheControl?: string;
    handler?: HandlerFn;
    prefix?: string;
    tags?: string[];
    summary?: string;
    version?: string;
    description?: string;
    security?: Array<{
        [key: string]: string[];
    }>;
}
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
    version(version: string): this;
    get(path: string): this;
    post(path: string): this;
    put(path: string): this;
    delete(path: string): this;
    patch(path: string): this;
    options(path: string): this;
    tags(tags: string[]): this;
    summary(summary: string): this;
    description(description: string): this;
    auth(type?: "bearer" | "basic" | "apiKey", guard?: GuardFn<TResponses, TState>): this;
    params<T extends TSchema>(schema: T): RouteBuilder<T, Body, Query, Headers, TResponses, TState>;
    body<T extends TSchema>(schema: T): RouteBuilder<Params, T, Query, Headers, TResponses, TState>;
    query<T extends TSchema>(schema: T): RouteBuilder<Params, Body, T, Headers, TResponses, TState>;
    headers<T extends TSchema>(schema: T): RouteBuilder<Params, Body, Query, T, TResponses, TState>;
    code<Code extends number, T extends TSchema>(code: Code, schema: T): RouteBuilder<Params, Body, Query, Headers, MergeStatus<TResponses, Code, T>, TState>;
    guard(fn: (this: RouteBuilder, request: RequestWithState<Params, Body, Query, Headers, TState>, reply: FastifyReply) => boolean | ResponseUnion<TResponses> | Promise<boolean | ResponseUnion<TResponses>>): this;
    onRequest(fn: (this: RouteBuilder, request: RequestWithState<Params, Body, Query, Headers, TState>, reply: FastifyReply) => void | Promise<void>): this;
    preValidation(fn: (this: RouteBuilder, request: RequestWithState<Params, Body, Query, Headers, TState>, reply: FastifyReply) => void | Promise<void> | false): this;
    preParsing(fn: (this: RouteBuilder, request: RequestWithState<Params, Body, Query, Headers, TState>, reply: FastifyReply, payload: unknown) => void | Promise<void>): this;
    preSerialization(fn: (this: RouteBuilder, request: RequestWithState<Params, Body, Query, Headers, TState>, reply: FastifyReply, payload: unknown) => void | Promise<void>): this;
    preHandler(fn: (this: RouteBuilder, request: RequestWithState<Params, Body, Query, Headers, TState>, reply: FastifyReply) => void | Promise<void>): this;
    onSend(fn: (this: RouteBuilder, request: RequestWithState<Params, Body, Query, Headers, TState>, reply: FastifyReply, payload: unknown) => void | Promise<void>): this;
    onResponse(fn: (this: RouteBuilder, request: RequestWithState<Params, Body, Query, Headers, TState>, reply: FastifyReply) => void | Promise<void>): this;
    onError(fn: (this: RouteBuilder, error: FastifyError, request: RequestWithState<Params, Body, Query, Headers, TState>, reply: FastifyReply) => void | Promise<void>): this;
    setErrorHandler(fn: (this: RouteBuilder, error: FastifyError, request: RequestWithState<Params, Body, Query, Headers, TState>, reply: FastifyReply) => void | Promise<void>): this;
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
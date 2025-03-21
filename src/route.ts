import { FastifyError, FastifyInstance, FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { Static, TSchema, Type, } from '@sinclair/typebox';
import { AppContext, UploadFile } from './types.js';
import { fileTypeFromBuffer } from 'file-type';

export type FileOptions = {
    maxFileSize?: number;
    accept?: string[];
    maxFiles?: number;
};

function groupFilesByFieldname(files: UploadFile[]): Record<string, UploadFile[]> {
    return files.reduce<Record<string, UploadFile[]>>((acc, file) => {
        if (!acc[file.fieldname]) {
            acc[file.fieldname] = [];
        }
        acc[file.fieldname].push(file);
        return acc;
    }, {});
}

export type OnSendHook = (this: RouteBuilder, request: RequestWithState, reply: FastifyReply, payload: unknown) => void | Promise<void>;
export type PreValidationHook = (this: RouteBuilder, request: RequestWithState, reply: FastifyReply) => void | Promise<void> | false;
export type OnRequestHook = (this: RouteBuilder, request: RequestWithState, reply: FastifyReply) => void | Promise<void>;
export type PreSerializationHook = (
    this: RouteBuilder,
    request: RequestWithState,
    reply: FastifyReply,
    payload: unknown
) => void | Promise<void>;

export type OnResponseHook = (this: RouteBuilder, request: RequestWithState, reply: FastifyReply) => void | Promise<void>;
export type OnErrorHook = (this: RouteBuilder, error: FastifyError, request: RequestWithState, reply: FastifyReply) => void | Promise<void>;
export type ErrorHandlerHook = (
    this: RouteBuilder,
    error: FastifyError,
    request: RequestWithState,
    reply: FastifyReply
) => void | Promise<void>;

export type PreParsingHook = (
    this: RouteBuilder,
    request: RequestWithState,
    reply: FastifyReply,
    payload: unknown
) => void | Promise<void>;


export type GuardFn<TResponses extends Record<number, TSchema>> = (
    this: RouteBuilder,
    request: RequestWithState,
    reply: FastifyReply
) => boolean | ResponseUnion<TResponses> | Promise<boolean | ResponseUnion<TResponses>>;

export type StatusSchemas = Record<number, TSchema>;


export type ResponseUnion<TResponses extends StatusSchemas> =
    {
        [K in keyof TResponses]:
        K extends number
        ? { status: K; data: Static<TResponses[K]> }
        : never;
    }[keyof TResponses];

type MergeStatus<
    TCurrent extends StatusSchemas,
    Code extends number,
    Schema extends TSchema
> = TCurrent & { [P in Code]: Schema };

export type HookType = 'preHandler' | 'onRequest' | 'preValidation' | 'preParsing' | 'preSerialization' | 'onSend' | 'onResponse' | 'onError';

export type PrehandlerFn<TResponses extends StatusSchemas, TState> = (
    this: RouteBuilder,
    request: RequestWithState,
    reply: FastifyReply
) => Promise<ResponseUnion<TResponses>> | ResponseUnion<TResponses>;


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
    guards: Array<GuardFn<StatusSchemas>>;
    preHandlers: Array<PrehandlerFn<StatusSchemas, TState>> | null;
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
    handler?: (this: RouteBuilder, req: FastifyRequest, reply: FastifyReply) => Promise<unknown> | unknown;
    tags?: string[];
    summary?: string;
    description?: string;
    security?: Array<{ [key: string]: string[] }>;
}

declare module 'fastify' {
    interface FastifyRequest {
        routeData?: unknown;
        tempFiles?: Array<UploadFile>;
        session?: Record<string, any> | null;
    }
}

export type RequestWithState<
    Params extends TSchema = TSchema,
    Body extends TSchema = TSchema,
    Query extends TSchema = TSchema,
    Headers extends TSchema = TSchema,
    TState = unknown
> = FastifyRequest<
    {
        Params: Static<Params>;
        Body: Static<Body>;
        Querystring: Static<Query>;
        Headers: Static<Headers>;
    }
> & {
    routeData: TState;
};

export class RouteBuilder<
    Params extends TSchema = TSchema,
    Body extends TSchema = TSchema,
    Query extends TSchema = TSchema,
    Headers extends TSchema = TSchema,
    TResponses extends StatusSchemas = {},
    TState = unknown
> {
    private config: RouteConfig<TState> = {
        method: 'GET',
        url: '',
        schema: { response: {} },
        guards: [],
        preHandlers: [],
        preValidation: null,
        preParsing: null,
        preSerialization: null,
        onRequest: null,
        onSend: null,
        onResponse: null,
        onError: null,
        responseHeaders: {},
    };

    fastify: FastifyInstance;
    constructor(private appContext: AppContext<Record<string, any>>) {
        this.fastify = appContext.fastify;
    }

    public setRequestFormat(contentType: string): this {
        if (contentType === 'multipart/form-data') {
            this.config.isMultipart = true;
        }
        (this.config.schema as any).consumes = [contentType];
        return this;
    }

    public acceptJson(): this {
        return this.setRequestFormat('application/json');
    }

    public acceptMultipart(): this {
        return this.setRequestFormat('multipart/form-data');
    }

    public acceptText(): this {
        return this.setRequestFormat('text/plain');
    }

    public setResponseFormat(contentType: string): this {
        this.config.responseType = contentType;
        return this;
    }

    public json(): this {
        return this.setResponseFormat('application/json');
    }

    public binary(): this {
        return this.setResponseFormat('application/octet-stream');
    }
    public rawResponse(contentType: string): this {
        return this.setResponseFormat(contentType);
    }
    public multipart(): this {
        return this.setResponseFormat('multipart/form-data');
    }

    public consumes(consumes: string[]): this {
        (this.config.schema as any).consumes = consumes;
        return this;
    }

    public text(): this {
        return this.setResponseFormat('text/plain');
    }

    public responseType(type: string): this {
        this.config.responseType = type;
        return this;
    }

    public get(path: string): this {
        this.config.method = 'GET';
        this.config.url = path;
        return this;
    }

    public post(path: string): this {
        this.config.method = 'POST';
        this.config.url = path;
        return this;
    }

    public put(path: string): this {
        this.config.method = 'PUT';
        this.config.url = path;
        return this;
    }

    public delete(path: string): this {
        this.config.method = 'DELETE';
        this.config.url = path;
        return this;
    }

    public patch(path: string): this {
        this.config.method = 'PATCH';
        this.config.url = path;
        return this;
    }

    public options(path: string): this {
        this.config.method = 'OPTIONS';
        this.config.url = path;
        return this;
    }

    public tags(tags: string[]): this {
        this.config.tags = tags;
        return this;
    }

    public summary(summary: string): this {
        this.config.summary = summary;
        return this;
    }

    public description(description: string): this {
        this.config.description = description;
        return this;
    }

    public auth(type: "bearer" | "basic" | "apiKey" = "bearer", guard?: GuardFn<TResponses>): this {

        if (!this.config.schema.headers) {
            this.config.schema.headers = Type.Object({});
        }

        if (!("Authorization" in (this.config.schema.headers as any).properties)) {
            this.config.schema.headers = Type.Composite([
                this.config.schema.headers,
                Type.Object({
                    Authorization: Type.String({
                        description: `Authorization token (${type.toUpperCase()})`
                    })
                })
            ]);
        }

        if (guard) {
            this.guard(guard);
        }

        const securityName = type === "bearer"
            ? "BearerAuth"
            : type === "basic"
                ? "BasicAuth"
                : "ApiKeyAuth";

        if (!this.config.security) {
            this.config.security = [];
        }

        if (!this.config.security.some(s => securityName in s)) {
            this.config.security.push({ [securityName]: [] });
        }

        return this;
    }

    public params<T extends TSchema>(
        schema: T
    ): RouteBuilder<T, Body, Query, Headers, TResponses, TState> {
        this.config.schema.params = schema;
        return this as unknown as RouteBuilder<T, Body, Query, Headers, TResponses, TState>;
    }

    public body<T extends TSchema>(
        schema: T
    ): RouteBuilder<Params, T, Query, Headers, TResponses, TState> {
        this.config.schema.body = schema;
        return this as unknown as RouteBuilder<Params, T, Query, Headers, TResponses, TState>;
    }

    public query<T extends TSchema>(
        schema: T
    ): RouteBuilder<Params, Body, T, Headers, TResponses, TState> {
        this.config.schema.querystring = schema;
        return this as unknown as RouteBuilder<Params, Body, T, Headers, TResponses, TState>;
    }
    public headers<T extends TSchema>(
        schema: T
    ): RouteBuilder<Params, Body, Query, T, TResponses, TState> {
        this.config.schema.headers = schema;
        return this as unknown as RouteBuilder<Params, Body, Query, T, TResponses, TState>;
    }

    public code<
        Code extends number,
        T extends TSchema
    >(
        code: Code,
        schema: T
    ): RouteBuilder<Params, Body, Query, Headers, MergeStatus<TResponses, Code, T>, TState> {
        this.config.schema.response[code] = Type.Object({
            status: Type.Literal(code),
            data: schema
        });
        return this as unknown as RouteBuilder<
            Params,
            Body,
            Query,
            Headers,
            MergeStatus<TResponses, Code, T>,
            TState
        >;
    }

    public guard(
        fn: GuardFn<TResponses>
    ): this {
        this.config.guards.push(async (req, reply) => {
            const result = await fn.call(this, req, reply);

            if (result === true) return true;

            if (typeof result === "object" && "status" in result && "data" in result) {
                reply.code(result.status).send(result);
                return false;
            }

            throw new Error(`Guard returned an invalid error object`);
        });

        return this;
    }

    public onRequest(fn: OnRequestHook): this {
        this.config.onRequest = fn;
        return this;
    }

    public preValidation(fn: PreValidationHook): this {
        this.config.preValidation = fn;
        return this;
    }

    public preParsing(fn: PreParsingHook): this {
        this.config.preParsing = fn;
        return this;
    }

    public preSerialization(fn: PreSerializationHook): this {
        this.config.preSerialization = fn;
        return this;
    }

    public preHandler(fn: PrehandlerFn<StatusSchemas, unknown>): this {
        this.config.preHandlers.push(fn);
        return this;
    }

    public onSend(fn: OnSendHook): this {
        this.config.onSend = fn;
        return this;
    }

    public onResponse(fn: OnResponseHook): this {
        this.config.onResponse = fn;
        return this;
    }

    public onError(fn: OnErrorHook): this {
        this.config.onError = fn;
        return this;
    }

    public setErrorHandler(fn: ErrorHandlerHook): this {
        this.config.errorHandler = fn;
        return this;
    }

    public resolve<TNewState extends TState>(
        fn: (req: FastifyRequest) => Promise<TNewState> | TNewState
    ): RouteBuilder<Params, Body, Query, Headers, TResponses, TNewState> {
        this.config.resolver = fn;
        return this as unknown as RouteBuilder<
            Params,
            Body,
            Query,
            Headers,
            TResponses,
            TNewState
        >;
    }

    public handler(
        fn: (
            req: RequestWithState<Params, Body, Query, Headers, TState>,
            reply: FastifyReply
        ) => Promise<ResponseUnion<TResponses> | string> | (ResponseUnion<TResponses> | string)
    ): this {
        this.config.handler = fn;
        return this;
    }

    public responseHeader<Code extends keyof TResponses>(
        name: string,
        value: string,
        statusCode: Code
    ): this {
        if (!(statusCode in this.config.schema.response)) {
            throw new Error(
                `Cannot add header to status ${statusCode.toString()}: this status is not defined in .success() or .error()`
            );
        }

        this.config.responseHeaders[name] = value;

        const schema = this.config.schema.response[statusCode as number];
        if (schema && typeof schema === 'object') {
            if (!schema.properties) {
                schema.properties = {};
            }
            schema.properties[name] = Type.String(); // Swagger требует type
        }

        return this;
    }

    public cacheControl(value: string): this {
        this.config.cacheControl = value;
        return this;
    }
    public fileOptions(
        options: FileOptions,
        key?: keyof Static<Body>
    ): this {
        if (!this.config.fileOptions) {
            this.config.fileOptions = {};
        }
        const field = key || 'default';
        this.config.fileOptions[field as string] = options;
        return this;
    }

    public modify(
        fn: (routeConfig: RouteOptions & { state?: TState }) => Promise<RouteOptions> | RouteOptions
    ): this {
        this.config.modify = fn;
        return this;
    }

    public async build(): Promise<void> {
        const {
            method,
            url,
            schema,
            guards,
            resolver,
            handler,
            responseHeaders,
            responseType,
            cacheControl,
            modify,
            tags,
            description,
            summary,
            security,
            isMultipart,
            fileOptions,
            errorHandler,
            preHandlers,
            preParsing,
            preValidation,
            preSerialization,
            onRequest,
            onSend,
            onResponse,
            onError
        } = this.config;

        if (!handler) {
            throw new Error('Handler is required');
        }
        if (!method || !url) {
            throw new Error('Method and URL are required');
        }

        const resolvePreHandler = async (req: FastifyRequest) => {
            if (resolver) {
                req.routeData = (await resolver(req)) as TState;
            }
        };
        const preHandlersWithResolver = [resolvePreHandler, ...guards];
        const tempFilesPrehandler = async (req: FastifyRequest) => {
            if (req.tempFiles.length) {
                const files = groupFilesByFieldname(req.tempFiles);
                if (!req.body) {
                    req.body = {};
                }
                for (const [key, value] of Object.entries(files)) {
                    const urls = value.filter(f => f.url).map(file => file.url);

                    const isArray = (req.body as any)[key] instanceof Array;
                    if (isArray) {
                        (req.body as any)[key] = urls.length ? urls : [];
                    } else {
                        (req.body as any)[key] = urls[0] || null;
                    }
                }
            }
        }
        const allPreHandlers = [...preHandlersWithResolver, ...preHandlers];
        if (isMultipart && fileOptions) {
            allPreHandlers.push(tempFilesPrehandler);
        }
        const extendedSchema = {
            tags: tags || [],
            summary: summary || '',
            description: description || '',
            security: security || [],
            ...schema,
        }

        const onErrorHandler = (error: FastifyError, req: FastifyRequest, reply: FastifyReply) => {
            if (errorHandler) {
                errorHandler.call(this, error, req, reply);
            } else {
                reply.status(500).send({
                    status: 500,
                    data: { error: 'Internal server error' },
                });
            }
        }

        let newRouteOptions: RouteOptions = {
            method,
            url,
            schema: extendedSchema,
            preHandler: allPreHandlers.length ? allPreHandlers.map((fn) => async (req, reply) => {
                const result = await fn.call(this, req, reply);
                if (result === false) {
                    return;
                }
            }) : undefined,
            preValidation: async (req, reply) => {
                if (preValidation) {
                    const result = await preValidation.call(this, req, reply);
                    if (result === false) {
                        return;
                    }
                }
                if (isMultipart && fileOptions) {
                    const errors: string[] = [];
                    const fileCounts: Record<string, number> = {};
                    const defaultOptions = fileOptions.default || null;
                    for (const file of req.tempFiles) {
                        const options = fileOptions[file.fieldname] || defaultOptions;

                        if (!options) continue;
                        if (options.maxFileSize && file.filesize > options.maxFileSize) {
                            errors.push(`File "${file.filename}" exceeds max size of ${options.maxFileSize} bytes.`);
                        }

                        if (options.accept) {
                            const fileType = await fileTypeFromBuffer(file.buffer);
                            const actualMime = fileType?.mime || file.mimetype;

                            const allowedTypes = options.accept.map(type =>
                                type.endsWith('/*') ? type.replace('/*', '') : type
                            );

                            const isValidMime = allowedTypes.some(type =>
                                actualMime.startsWith(type)
                            );

                            if (!isValidMime) {
                                errors.push(`File "${file.filename}" has an invalid MIME type "${actualMime}". Allowed: ${options.accept.join(', ')}`);
                            }
                        }
                        fileCounts[file.fieldname] = (fileCounts[file.fieldname] || 0) + 1;
                    }
                    for (const file of req.tempFiles) {
                        const options = fileOptions[file.fieldname] || defaultOptions;
                        if (options.maxFiles && (fileCounts[file.fieldname] || 0) > options.maxFiles) {
                            const messageError = `Field "${file.fieldname}" exceeds max allowed files (${options.maxFiles}).`;
                            if (!errors.includes(messageError)) {
                                errors.push(`Field "${file.fieldname}" exceeds max allowed files (${options.maxFiles}).`);
                            }
                        }
                    }
                    if (errors.length > 0) {
                        reply.status(400).send({
                            status: 400,
                            data: { errors },
                        });
                    } else {
                        if (this.appContext.fileLoader) {
                            for (const file of req.tempFiles) {
                                const uploadedFile = await this.appContext.fileLoader(file, this as unknown as RouteBuilder<TSchema, TSchema, TSchema, TSchema, {}, unknown>);
                                req.tempFiles[req.tempFiles.indexOf(file)] = uploadedFile;
                            }
                        }
                    }
                }
            },
            errorHandler: onErrorHandler,
            preSerialization: async (req, reply, payload) => {
                if (preSerialization) {
                    await preSerialization.call(this, req, reply, payload);
                }
            },
            preParsing: async (req, reply, payload) => {
                if (preParsing) {
                    await preParsing.call(this, req, reply, payload);
                }
            },
            onResponse: async (req, reply) => {
                if (onResponse) {
                    await onResponse.call(this, req, reply);
                }
            },
            onRequest: async (req, reply) => {
                if (onRequest) {
                    await onRequest.call(this, req, reply);
                }
            },
            onSend: async (req, reply, payload) => {
                if (onSend) {
                    await onSend.call(this, req, reply, payload);
                }
            },
            onError: async (error, req, reply) => {
                if (onError) {
                    await onError.call(this, error, req, reply);
                }
            },
            handler: async (req, reply) => {
                for (const [headerName, headerValue] of Object.entries(responseHeaders)) {
                    reply.header(headerName, headerValue);
                }
                if (cacheControl) {
                    reply.header('Cache-Control', cacheControl);
                }
                if (responseType) {
                    reply.type(responseType);
                }

                if (handler) {
                    const result = await handler.call(this, req, reply) as ResponseUnion<TResponses>;
                    if (
                        result &&
                        typeof result === 'object' &&
                        'status' in result
                    ) {
                        reply.code(result.status);
                        return result;
                    }
                    reply.type(this.config.responseType || 'text/html');
                    return result;
                } else {
                    return { status: 'No handler provided' };
                }
            }
        };

        if (modify) {
            newRouteOptions = await modify(newRouteOptions);
        }
        this.fastify.route(newRouteOptions);
    }
}


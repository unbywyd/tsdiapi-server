import { FastifyError, FastifyInstance, FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { Static, TDate, TSchema, Type, } from '@sinclair/typebox';
import { AppContext, UploadFile } from './types.js';
import { fileTypeFromBuffer } from 'file-type';
import { MetaSchemaStorage, MetaRouteEntry, metaRouteSchemaStorage } from './meta.js';
import { ResponseError } from './response.js';

export type FileOptions = {
    maxFileSize?: number;
    accept?: string[];
    maxFiles?: number;
};

export function DateString(defaultValue?: string | Date) {
    return Type.String({
        format: 'date-time',
        ...(defaultValue ? {
            default: new Date(defaultValue).toISOString()
        } : {})
    }) as unknown as TDate;
}

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
export type GuardFn<TResponses extends Record<number, TSchema>, TState> = (
    this: RouteBuilder,
    request: RequestWithState,
    reply: FastifyReply
) => boolean | ResponseUnion<TResponses> | Promise<boolean | ResponseUnion<TResponses>> | void | Promise<void>;

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
        consumes?: string[];
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
    resolver?: (
        req: FastifyRequest,
        reply: FastifyReply
    ) => Promise<TState | ResponseUnion<StatusSchemas>> | (TState | ResponseUnion<StatusSchemas>);
    responseHeaders: Record<string, string>;
    isMultipart?: boolean;
    responseType?: string;
    cacheControl?: string;
    handler?: HandlerFn;
    prefix?: string;
    controller?: string;
    tags?: string[];
    summary?: string;
    version?: string;
    description?: string;
    security?: Array<{ [key: string]: string[] }>;
}

export function trimSlashes(input: string): string {
    return input.replace(/^[/\\]+|[/\\]+$/g, '');
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
    private extraMetaStorage: MetaSchemaStorage = new MetaSchemaStorage();
    private config: RouteConfig<TState> = {
        method: 'GET',
        url: '',
        schema: { response: {} },
        guards: [],
        preHandlers: [],
        prefix: '/api',
        preValidation: null,
        version: null,
        preParsing: null,
        preSerialization: null,
        onRequest: null,
        onSend: null,
        onResponse: null,
        onError: null,
        responseHeaders: {},
    };

    withRef<T extends TSchema>(schema: T): TSchema {
        if (schema && schema.$id) {
            if (!this.fastify.getSchema(schema.$id)) {
                this.fastify.addSchema(schema);
            }
            return Type.Ref(schema.$id);
        }
        return schema;
    }

    fastify: FastifyInstance;
    constructor(private appContext: AppContext<Record<string, any>>) {
        this.fastify = appContext.fastify;
    }

    public setRequestFormat(contentType: string): this {
        if (contentType === 'multipart/form-data') {
            this.config.isMultipart = true;
        }
        this.config.schema.consumes = [contentType];
        return this;
    }

    public controller(controllerPath: string): this {
        const cleanedPath = trimSlashes(controllerPath);
        const [controller, ...rest] = cleanedPath.split('/');
        const remainingUrl = rest.join('/');
        this.config.controller = controller;
        if (remainingUrl) {
            this.config.url = `/${remainingUrl}`;
        }
        this.tags([controller]);
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
        this.config.schema.consumes = consumes;
        return this;
    }

    public text(): this {
        return this.setResponseFormat('text/plain');
    }

    public responseType(type: string): this {
        this.config.responseType = type;
        return this;
    }

    public version(version: string): this {
        this.config.version = version;
        return this;
    }

    // -------------------------
    // 2) HTTP-методы
    // -------------------------

    public get(path?: string): this {
        this.config.method = 'GET';
        if (path) {
            this.config.url = path;
        }
        return this;
    }

    public post(path?: string): this {
        this.config.method = 'POST';
        if (path) {
            this.config.url = path;
        }
        return this;
    }

    public put(path?: string): this {
        this.config.method = 'PUT';
        if (path) {
            this.config.url = path;
        }
        return this;
    }

    public delete(path?: string): this {
        this.config.method = 'DELETE';
        if (path) {
            this.config.url = path;
        }
        return this;
    }

    public patch(path?: string): this {
        this.config.method = 'PATCH';
        if (path) {
            this.config.url = path;
        }
        return this;
    }

    public options(path?: string): this {
        this.config.method = 'OPTIONS';
        if (path) {
            this.config.url = path;
        }
        return this;
    }

    // Swagger-совместимость
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

    public auth(type: "bearer" | "basic" | "apiKey" = "bearer", guard?: GuardFn<TResponses, TState>): this {

        if (!this.config.schema.headers) {
            this.config.schema.headers = Type.Object({});
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


    // --------------------------
    // 3) Определение схемы
    // --------------------------

    public params<T extends TSchema>(
        schema: T
    ): RouteBuilder<T, Body, Query, Headers, TResponses, TState> {
        this.extraMetaStorage.add({
            type: 'params',
            schema: schema,
            id: schema.$id || undefined
        });
        this.config.schema.params = this.withRef(schema);
        return this as unknown as RouteBuilder<T, Body, Query, Headers, TResponses, TState>;
    }

    public body<T extends TSchema>(
        schema: T
    ): RouteBuilder<Params, T, Query, Headers, TResponses, TState> {
        this.extraMetaStorage.add({
            type: 'body',
            schema: schema,
            id: schema.$id || undefined
        });
        this.config.schema.body = this.withRef(schema);
        return this as unknown as RouteBuilder<Params, T, Query, Headers, TResponses, TState>;
    }

    public query<T extends TSchema>(
        schema: T
    ): RouteBuilder<Params, Body, T, Headers, TResponses, TState> {
        this.extraMetaStorage.add({
            type: 'query',
            schema: schema,
            id: schema.$id || undefined
        });
        this.config.schema.querystring = this.withRef(schema);
        return this as unknown as RouteBuilder<Params, Body, T, Headers, TResponses, TState>;
    }

    public headers<T extends TSchema>(
        schema: T
    ): RouteBuilder<Params, Body, Query, T, TResponses, TState> {
        this.extraMetaStorage.add({
            type: 'headers',
            schema: schema,
            id: schema.$id || undefined
        });
        this.config.schema.headers = this.withRef(schema);
        return this as unknown as RouteBuilder<Params, Body, Query, T, TResponses, TState>;
    }

    public code<
        Code extends number,
        T extends TSchema
    >(
        code: Code,
        schema: T
    ): RouteBuilder<Params, Body, Query, Headers, MergeStatus<TResponses, Code, T>, TState> {
        return this.codes({ [code]: schema });
    }

    public codes<
        TNewResponses extends Record<number, TSchema>
    >(
        responses: TNewResponses
    ): RouteBuilder<Params, Body, Query, Headers, TResponses & TNewResponses, TState> {
        for (const [code, schema] of Object.entries(responses)) {
            const statusCode = Number(code);
            this.extraMetaStorage.add({
                type: 'response',
                statusCode,
                schema,
                id: schema.$id || undefined
            });
            this.config.schema.response[statusCode] = Type.Object({
                status: Type.Literal(statusCode),
                data: this.withRef(schema)
            });
        }
        return this as unknown as RouteBuilder<Params, Body, Query, Headers, TResponses & TNewResponses, TState>;
    }

    // --------------------------
    // 4) Guard-функции
    // --------------------------

    public guard(
        fn: (
            this: RouteBuilder,
            request: RequestWithState<Params, Body, Query, Headers, TState>,
            reply: FastifyReply
        ) => boolean | ResponseUnion<TResponses> | Promise<boolean | ResponseUnion<TResponses>> | void | Promise<void>
    ): this {
        this.config.guards.push(async (req, reply) => {
            try {
                const result = await fn.call(this, req, reply);

                if (result === true || result === undefined) return true;

                if ((typeof result === "object") && ("status" in result) && ("data" in result)) {
                    reply.code(result.status).send(result);
                    return false;
                }
                reply.code(500).send(result?.message || `Guard returned an invalid error object`);
                return false;
            } catch (error) {
                if (error instanceof ResponseError) {
                    reply.code(error.status).send(error);
                    return false;
                }
                if ("status" in error && "data" in error) {
                    reply.code(error.status).send(error);
                    return false;
                }
                reply.code(500).send(error?.message || `Unknown server error`);
                return false;
            }
        });

        return this;
    }

    // --------------------------
    // 5) Hooks
    // --------------------------
    public onRequest(fn: (this: RouteBuilder, request: RequestWithState<Params, Body, Query, Headers, TState>, reply: FastifyReply) => void | Promise<void>): this {
        this.config.onRequest = fn;
        return this;
    }

    public preValidation(fn: (this: RouteBuilder, request: RequestWithState<Params, Body, Query, Headers, TState>, reply: FastifyReply) => void | Promise<void> | false): this {
        this.config.preValidation = fn;
        return this;
    }

    public preParsing(fn: (this: RouteBuilder, request: RequestWithState<Params, Body, Query, Headers, TState>, reply: FastifyReply, payload: unknown) => void | Promise<void>): this {
        this.config.preParsing = fn;
        return this;
    }

    public preSerialization(fn: (this: RouteBuilder, request: RequestWithState<Params, Body, Query, Headers, TState>, reply: FastifyReply, payload: unknown) => void | Promise<void>): this {
        this.config.preSerialization = fn;
        return this;
    }

    public preHandler(fn: (this: RouteBuilder, request: RequestWithState<Params, Body, Query, Headers, TState>, reply: FastifyReply) => void | Promise<void>): this {
        this.config.preHandlers.push(fn);
        return this;
    }
    public onSend(fn: (this: RouteBuilder, request: RequestWithState<Params, Body, Query, Headers, TState>, reply: FastifyReply, payload: unknown) => void | Promise<void>): this {
        this.config.onSend = fn;
        return this;
    }

    public onResponse(fn: (this: RouteBuilder, request: RequestWithState<Params, Body, Query, Headers, TState>, reply: FastifyReply) => void | Promise<void>): this {
        this.config.onResponse = fn;
        return this;
    }

    public onError(fn: (this: RouteBuilder, error: FastifyError, request: RequestWithState<Params, Body, Query, Headers, TState>, reply: FastifyReply) => void | Promise<void>): this {
        this.config.onError = fn;
        return this;
    }

    public setErrorHandler(fn: (this: RouteBuilder, error: FastifyError, request: RequestWithState<Params, Body, Query, Headers, TState>, reply: FastifyReply) => void | Promise<void>): this {
        this.config.errorHandler = fn;
        return this;
    }

    // -------------------------------------------
    // 6) Передача данных между хуками (resolver)
    // -------------------------------------------
    public resolve<TNewState extends TState>(
        fn: (
            req: RequestWithState<Params, Body, Query, Headers, TState>,
            reply: FastifyReply
        ) => TNewState | Promise<TNewState>
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


    // --------------------------------
    // 7) Финальный обработчик
    // --------------------------------
    public handler(
        fn: (
            req: RequestWithState<Params, Body, Query, Headers, TState>,
            reply: FastifyReply
        ) => Promise<ResponseUnion<TResponses> | string> | (ResponseUnion<TResponses> | string)
    ): this {
        this.config.handler = fn;
        return this;
    }

    // ------------------------------------------------
    // 8) Кастомные заголовки ответа и Cache-Control
    // ------------------------------------------------
    public responseHeader<Code extends keyof TResponses>(
        name: string,
        value: string,
        statusCode: Code // ✅ Ограничиваем только зарегистрированными статусами
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
            onError,
            version,
            prefix,
            controller
        } = this.config;

        if (!handler) {
            throw new Error('Handler is required');
        }
        if (!method || !url) {
            throw new Error('Method and URL are required');
        }
        const resolvePreHandler = async (req: FastifyRequest, reply: FastifyReply) => {
            if (resolver) {
                try {
                    const result = await resolver(req, reply);
                    if (result instanceof ResponseError) {
                        reply.code(result.status).send(result);
                        return false;
                    }
                    if ((typeof result === "object") && ("status" in result) && ("data" in result)) {
                        reply.code(result.status).send({
                            status: result.status,
                            data: result.data
                        });
                        return false;
                    }
                    req.routeData = result as TState;
                } catch (error) {
                    if (error instanceof ResponseError) {
                        reply.code(error.status).send(error);
                        return false;
                    }
                    reply.code(500).send({
                        status: 500,
                        data: { error: error.message },
                    });
                    return false;
                }
            }
            return true;
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
        const extendedSchema: Record<string, any> = {
            tags: tags || [],
            summary: summary || '',
            description: description || '',
            security: security || []
        }
        if (schema.body) {
            extendedSchema.body = schema.body;
        }
        if (schema.querystring) {
            extendedSchema.querystring = schema.querystring;
        }
        if (schema.headers) {
            extendedSchema.headers = schema.headers;
        }
        if (schema.params) {
            extendedSchema.params = schema.params;
        }
        if (schema.response) {
            extendedSchema.response = schema.response;
        }
        if (schema.consumes) {
            extendedSchema.consumes = schema.consumes;
        }

        const onErrorHandler = (error: FastifyError, req: FastifyRequest, reply: FastifyReply) => {
            if (error) {
                if (errorHandler) {
                    errorHandler.call(this, error, req, reply);
                } else {
                    reply.code(500).send({
                        status: 500,
                        data: { error: error.message },
                    });
                }
            }
        }


        const cleanedPrefix = trimSlashes(prefix || '');
        const cleanedController = trimSlashes(controller || '');
        const cleanedUrl = trimSlashes(url || '');

        const _prefix = cleanedPrefix ? `${cleanedPrefix}/` : '';
        const _controller = cleanedController ? `${cleanedController}/` : '';
        const _version = version ? `v${version}/` : '';
        const route = `/${_prefix}${_controller}${_version}${cleanedUrl}`;

        const schemas = this.extraMetaStorage.getAll();
        const metaEntry: MetaRouteEntry = {
            route,
            method,
            meta: schemas
        }
        metaRouteSchemaStorage.add(metaEntry);

        let newRouteOptions: RouteOptions = {
            method,
            url: route,
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

                        // Проверка максимального размера
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
                        reply.code(400).send({
                            status: 400,
                            data: {
                                error:
                                    errors.join('\n')
                            },
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
                    try {
                        const result = await handler.call(this, req, reply) as ResponseUnion<TResponses>;
                        if (result instanceof ResponseError) {
                            reply.code(result.status).send(result);
                            return false;
                        }
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
                    } catch (error) {
                        if (error instanceof ResponseError) {
                            reply.code(error.status).send(error);
                            return false;
                        }
                        if ("status" in error && "data" in error) {
                            reply.code(error.status).send({
                                status: error.status,
                                data: error.data
                            });
                            return false;
                        }
                        reply.code(500).send({
                            status: 500,
                            data: { error: error.message },
                        });
                        return false;
                    }
                } else {
                    return { status: 500, data: { error: 'No handler provided' } };
                }
            }
        };

        if (modify) {
            newRouteOptions = await modify(newRouteOptions);
        }


        this.fastify.route(newRouteOptions);
    }
}

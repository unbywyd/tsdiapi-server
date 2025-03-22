import { Type, } from '@sinclair/typebox';
import { fileTypeFromBuffer } from 'file-type';
import { metadataManager } from './metadata.js';
const metareg = metadataManager.use('route');
function groupFilesByFieldname(files) {
    return files.reduce((acc, file) => {
        if (!acc[file.fieldname]) {
            acc[file.fieldname] = [];
        }
        acc[file.fieldname].push(file);
        return acc;
    }, {});
}
export class RouteBuilder {
    appContext;
    config = {
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
    fastify;
    constructor(appContext) {
        this.appContext = appContext;
        this.fastify = appContext.fastify;
    }
    // ---------------------------
    // 1) Определение Content-Type
    // ---------------------------
    setRequestFormat(contentType) {
        if (contentType === 'multipart/form-data') {
            this.config.isMultipart = true;
        }
        this.config.schema.consumes = [contentType];
        return this;
    }
    acceptJson() {
        return this.setRequestFormat('application/json');
    }
    acceptMultipart() {
        return this.setRequestFormat('multipart/form-data');
    }
    acceptText() {
        return this.setRequestFormat('text/plain');
    }
    setResponseFormat(contentType) {
        this.config.responseType = contentType;
        return this;
    }
    json() {
        return this.setResponseFormat('application/json');
    }
    binary() {
        return this.setResponseFormat('application/octet-stream');
    }
    rawResponse(contentType) {
        return this.setResponseFormat(contentType);
    }
    multipart() {
        return this.setResponseFormat('multipart/form-data');
    }
    consumes(consumes) {
        this.config.schema.consumes = consumes;
        return this;
    }
    text() {
        return this.setResponseFormat('text/plain');
    }
    responseType(type) {
        this.config.responseType = type;
        return this;
    }
    version(version) {
        this.config.version = version;
        return this;
    }
    // -------------------------
    // 2) HTTP-методы
    // -------------------------
    get(path) {
        this.config.method = 'GET';
        this.config.url = path;
        return this;
    }
    post(path) {
        this.config.method = 'POST';
        this.config.url = path;
        return this;
    }
    put(path) {
        this.config.method = 'PUT';
        this.config.url = path;
        return this;
    }
    delete(path) {
        this.config.method = 'DELETE';
        this.config.url = path;
        return this;
    }
    patch(path) {
        this.config.method = 'PATCH';
        this.config.url = path;
        return this;
    }
    options(path) {
        this.config.method = 'OPTIONS';
        this.config.url = path;
        return this;
    }
    // Swagger-совместимость
    tags(tags) {
        this.config.tags = tags;
        return this;
    }
    summary(summary) {
        this.config.summary = summary;
        return this;
    }
    description(description) {
        this.config.description = description;
        return this;
    }
    auth(type = "bearer", guard) {
        if (!this.config.schema.headers) {
            this.config.schema.headers = Type.Object({});
        }
        if (!("Authorization" in this.config.schema.headers.properties)) {
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
    // --------------------------
    // 3) Определение схемы
    // --------------------------
    params(schema) {
        this.config.schema.params = schema;
        return this;
    }
    body(schema) {
        this.config.schema.body = schema;
        return this;
    }
    query(schema) {
        this.config.schema.querystring = schema;
        return this;
    }
    headers(schema) {
        this.config.schema.headers = schema;
        return this;
    }
    code(code, schema) {
        this.config.schema.response[code] = Type.Object({
            status: Type.Literal(code),
            data: schema
        });
        return this;
    }
    // --------------------------
    // 4) Guard-функции
    // --------------------------
    guard(fn) {
        this.config.guards.push(async (req, reply) => {
            const result = await fn.call(this, req, reply);
            if (result === true)
                return true;
            if (typeof result === "object" && "status" in result && "data" in result) {
                reply.code(result.status).send(result);
                return false;
            }
            throw new Error(`Guard returned an invalid error object`);
        });
        return this;
    }
    // --------------------------
    // 5) Hooks
    // --------------------------
    onRequest(fn) {
        this.config.onRequest = fn;
        return this;
    }
    preValidation(fn) {
        this.config.preValidation = fn;
        return this;
    }
    preParsing(fn) {
        this.config.preParsing = fn;
        return this;
    }
    preSerialization(fn) {
        this.config.preSerialization = fn;
        return this;
    }
    preHandler(fn) {
        this.config.preHandlers.push(fn);
        return this;
    }
    onSend(fn) {
        this.config.onSend = fn;
        return this;
    }
    onResponse(fn) {
        this.config.onResponse = fn;
        return this;
    }
    onError(fn) {
        this.config.onError = fn;
        return this;
    }
    setErrorHandler(fn) {
        this.config.errorHandler = fn;
        return this;
    }
    // -------------------------------------------
    // 6) Передача данных между хуками (resolver)
    // -------------------------------------------
    resolve(fn) {
        this.config.resolver = fn;
        return this;
    }
    // --------------------------------
    // 7) Финальный обработчик
    // --------------------------------
    handler(fn) {
        this.config.handler = fn;
        return this;
    }
    // ------------------------------------------------
    // 8) Кастомные заголовки ответа и Cache-Control
    // ------------------------------------------------
    responseHeader(name, value, statusCode // ✅ Ограничиваем только зарегистрированными статусами
    ) {
        if (!(statusCode in this.config.schema.response)) {
            throw new Error(`Cannot add header to status ${statusCode.toString()}: this status is not defined in .success() or .error()`);
        }
        // Добавляем заголовок в HTTP-ответ (Fastify)
        this.config.responseHeaders[name] = value;
        const schema = this.config.schema.response[statusCode];
        if (schema && typeof schema === 'object') {
            if (!schema.properties) {
                schema.properties = {};
            }
            schema.properties[name] = Type.String(); // Swagger требует type
        }
        return this;
    }
    cacheControl(value) {
        this.config.cacheControl = value;
        return this;
    }
    fileOptions(options, key) {
        if (!this.config.fileOptions) {
            this.config.fileOptions = {};
        }
        const field = key || 'default';
        this.config.fileOptions[field] = options;
        return this;
    }
    // ---------------------------------
    // 10) Модификация маршрута
    // ---------------------------------
    modify(fn) {
        this.config.modify = fn;
        return this;
    }
    // --------------------------------------
    // 11) Регистрация маршрута (build)
    // --------------------------------------
    async build() {
        const { method, url, schema, guards, resolver, handler, responseHeaders, responseType, cacheControl, modify, tags, description, summary, security, isMultipart, fileOptions, errorHandler, preHandlers, preParsing, preValidation, preSerialization, onRequest, onSend, onResponse, onError, version, prefix } = this.config;
        if (!handler) {
            throw new Error('Handler is required');
        }
        if (!method || !url) {
            throw new Error('Method and URL are required');
        }
        const resolvePreHandler = async (req) => {
            if (resolver) {
                req.routeData = (await resolver(req));
            }
        };
        const preHandlersWithResolver = [resolvePreHandler, ...guards];
        const tempFilesPrehandler = async (req) => {
            if (req.tempFiles.length) {
                const files = groupFilesByFieldname(req.tempFiles);
                if (!req.body) {
                    req.body = {};
                }
                for (const [key, value] of Object.entries(files)) {
                    const urls = value.filter(f => f.url).map(file => file.url);
                    const isArray = req.body[key] instanceof Array;
                    if (isArray) {
                        req.body[key] = urls.length ? urls : [];
                    }
                    else {
                        req.body[key] = urls[0] || null;
                    }
                }
            }
        };
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
        };
        const onErrorHandler = (error, req, reply) => {
            if (error) {
                if (errorHandler) {
                    errorHandler.call(this, error, req, reply);
                }
                else {
                    reply.status(500).send({
                        status: 500,
                        data: { error: error.message },
                    });
                }
            }
        };
        let finalUrl = url.startsWith('/') ? url : `/${url}`;
        if (version) {
            finalUrl = `${(prefix && prefix?.startsWith('/') ? prefix : (prefix ? `/${prefix}` : ''))}/v${version}${finalUrl}`;
        }
        let newRouteOptions = {
            method,
            url: finalUrl,
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
                    const errors = [];
                    const fileCounts = {};
                    const defaultOptions = fileOptions.default || null;
                    for (const file of req.tempFiles) {
                        const options = fileOptions[file.fieldname] || defaultOptions;
                        if (!options)
                            continue;
                        // Проверка максимального размера
                        if (options.maxFileSize && file.filesize > options.maxFileSize) {
                            errors.push(`File "${file.filename}" exceeds max size of ${options.maxFileSize} bytes.`);
                        }
                        if (options.accept) {
                            const fileType = await fileTypeFromBuffer(file.buffer);
                            const actualMime = fileType?.mime || file.mimetype;
                            const allowedTypes = options.accept.map(type => type.endsWith('/*') ? type.replace('/*', '') : type);
                            const isValidMime = allowedTypes.some(type => actualMime.startsWith(type));
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
                    }
                    else {
                        if (this.appContext.fileLoader) {
                            for (const file of req.tempFiles) {
                                const uploadedFile = await this.appContext.fileLoader(file, this);
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
                    const result = await handler.call(this, req, reply);
                    if (result &&
                        typeof result === 'object' &&
                        'status' in result) {
                        reply.code(result.status);
                        return result;
                    }
                    reply.type(this.config.responseType || 'text/html');
                    return result;
                }
                else {
                    return { status: 'No handler provided' };
                }
            }
        };
        metareg({
            name: `${method} ${finalUrl}`,
            metadata: {
                schema: extendedSchema,
                method,
                url: finalUrl,
                version: version || ''
            }
        });
        if (modify) {
            newRouteOptions = await modify(newRouteOptions);
        }
        this.fastify.route(newRouteOptions);
    }
}
//# sourceMappingURL=route.js.map
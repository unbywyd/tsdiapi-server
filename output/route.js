import { Type, } from '@sinclair/typebox';
import { fileTypeFromBuffer } from 'file-type';
import { MetaSchemaStorage, metaRouteSchemaStorage } from './meta.js';
import { ResponseError } from './response.js';
import { getSchemaRegistry } from './schema-registry.js';
export function DateString(defaultValue) {
    return Type.String({
        format: 'date-time',
        ...(defaultValue ? {
            default: new Date(defaultValue).toISOString()
        } : {})
    });
}
function groupFilesByFieldname(files) {
    return files.reduce((acc, file) => {
        if (!acc[file.fieldname]) {
            acc[file.fieldname] = [];
        }
        acc[file.fieldname].push(file);
        return acc;
    }, {});
}
export function trimSlashes(input) {
    return input.replace(/^[/\\]+|[/\\]+$/g, '');
}
/**
 * Convert kebab-case or snake_case to PascalCase
 * Examples: app-role -> AppRole, api_route -> ApiRoute, access-guard -> AccessGuard
 */
function toPascalCase(str) {
    return str
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}
/**
 * Remove duplicate entity name and fix common issues in operationId
 * Examples:
 * - controller: "AppRole", operationId: "deleteAppRole" -> "Delete"
 * - controller: "ApiRoute", operationId: "detachRoleFromRouteFromRoute" -> "DetachRoleFromRoute" (remove duplicate)
 */
function normalizeOperationId(controller, operationId) {
    const normalizedController = toPascalCase(controller).toLowerCase();
    let normalizedOperationId = operationId;
    // Remove duplicate "FromRoute" or similar patterns at the end
    normalizedOperationId = normalizedOperationId.replace(/FromRouteFromRoute$/i, 'FromRoute');
    normalizedOperationId = normalizedOperationId.replace(/ToRouteToRoute$/i, 'ToRoute');
    // Convert to lowercase for comparison
    const lowerOperationId = normalizedOperationId.toLowerCase();
    // Check if operationId starts with controller name
    if (lowerOperationId.startsWith(normalizedController)) {
        // Remove controller prefix from operationId
        const remaining = normalizedOperationId.slice(normalizedController.length);
        // Capitalize first letter
        return remaining.charAt(0).toUpperCase() + remaining.slice(1);
    }
    // Check for common patterns like "deleteAppRole" where controller is "AppRole"
    // Split controller into words (AppRole -> ["app", "role"])
    const controllerWords = normalizedController.split(/(?=[A-Z])/).map(w => w.toLowerCase()).filter(w => w.length > 0);
    // Check if operationId ends with controller words
    for (const word of controllerWords) {
        if (lowerOperationId.endsWith(word) && lowerOperationId.length > word.length) {
            // Remove trailing entity name
            const beforeEntity = normalizedOperationId.slice(0, -word.length);
            // Capitalize first letter
            return beforeEntity.charAt(0).toUpperCase() + beforeEntity.slice(1);
        }
    }
    // No duplicate found, return capitalized operationId
    return normalizedOperationId.charAt(0).toUpperCase() + normalizedOperationId.slice(1);
}
/**
 * Generate a consistent response wrapper schema name
 * Format: {Controller}{OperationId}Response{StatusCode}
 * Falls back to {SchemaId}Response{StatusCode} if operationId is not available
 * For standard error schema (ResponseErrorSchema), uses common response type names
 */
function generateResponseWrapperName(controller, operationId, schemaId, statusCode) {
    // Convert status code to string (e.g., 200 -> "200")
    const statusCodeStr = statusCode.toString();
    // For ResponseErrorSchema, use standard response type names
    // This avoids creating hundreds of duplicate types for the same error structure
    if (schemaId === 'ResponseErrorSchema') {
        const standardNames = {
            400: 'ResponseBadRequest',
            401: 'ResponseUnauthorized',
            403: 'ResponseForbidden',
            404: 'ResponseNotFound',
            409: 'ResponseConflict',
            422: 'ResponseUnprocessableEntity',
            429: 'ResponseTooManyRequests',
            500: 'ResponseInternalServerError',
            503: 'ResponseServiceUnavailable'
        };
        // Use standard name if available, otherwise fall back to generic pattern
        return standardNames[statusCode] || `ResponseError${statusCodeStr}`;
    }
    // For custom schemas, use endpoint-specific names to avoid conflicts
    // If we have operationId, use controller + operationId
    if (operationId) {
        // If controller is available, use it as prefix
        if (controller) {
            // Convert controller to PascalCase (app-role -> AppRole)
            const normalizedController = toPascalCase(controller);
            // Normalize operationId (remove duplicates, fix naming)
            const normalizedOperationId = normalizeOperationId(controller, operationId);
            return `${normalizedController}${normalizedOperationId}Response${statusCodeStr}`;
        }
        // Fallback to just operationId (capitalized)
        const capitalizedOperationId = operationId.charAt(0).toUpperCase() + operationId.slice(1);
        return `${capitalizedOperationId}Response${statusCodeStr}`;
    }
    // Fallback to schemaId if no operationId
    return `${schemaId}Response${statusCodeStr}`;
}
export class RouteBuilder {
    appContext;
    extraMetaStorage = new MetaSchemaStorage();
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
    // Track registered schema IDs to detect duplicates early and prevent server hang
    static registeredSchemaIds = new Set();
    /**
     * Clear the schema registry (useful for testing or hot reload scenarios)
     */
    static clearSchemaRegistry() {
        RouteBuilder.registeredSchemaIds.clear();
    }
    withRef(schema) {
        if (schema && schema.$id) {
            const schemaId = schema.$id;
            // Check if schema is already registered in Fastify
            const existingSchema = this.fastify.getSchema(schemaId);
            if (existingSchema) {
                // Schema already registered, use reference
                return Type.Ref(schemaId);
            }
            // Check if we've already processed this schema ID in this build process
            if (RouteBuilder.registeredSchemaIds.has(schemaId)) {
                // Schema was already registered during route building, use reference
                // This prevents duplicate registration which can cause server hang
                return Type.Ref(schemaId);
            }
            // Try to use schema registry if available
            try {
                const registry = getSchemaRegistry(this.fastify);
                if (registry.isRegistered(schemaId)) {
                    RouteBuilder.registeredSchemaIds.add(schemaId);
                    return Type.Ref(schemaId);
                }
                // Register schema in registry (it will handle dependencies)
                registry.register(schema);
                registry.resolveAndRegister();
                RouteBuilder.registeredSchemaIds.add(schemaId);
                return Type.Ref(schemaId);
            }
            catch (registryError) {
                // Registry not available or error - fall back to direct registration
                // This can happen if registry wasn't initialized yet
                try {
                    this.fastify.addSchema(schema);
                    RouteBuilder.registeredSchemaIds.add(schemaId);
                    return Type.Ref(schemaId);
                }
                catch (regError) {
                    // Handle potential duplicate registration errors
                    const errorMessage = regError instanceof Error ? regError.message : String(regError);
                    // Check if it's a duplicate schema error
                    if (errorMessage.includes('already exists') ||
                        errorMessage.includes('duplicate') ||
                        errorMessage.includes('already registered')) {
                        // Schema might have been registered by auto-registry or another route
                        RouteBuilder.registeredSchemaIds.add(schemaId);
                        return Type.Ref(schemaId);
                    }
                    // Re-throw other errors
                    throw regError;
                }
            }
        }
        return schema;
    }
    fastify;
    constructor(appContext) {
        this.appContext = appContext;
        this.fastify = appContext.fastify;
    }
    setRequestFormat(contentType) {
        if (contentType === 'multipart/form-data') {
            this.config.isMultipart = true;
        }
        this.config.schema.consumes = [contentType];
        return this;
    }
    controller(controllerPath) {
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
    // 2) HTTP methods
    // -------------------------
    get(path) {
        this.config.method = 'GET';
        if (path) {
            this.config.url = path;
        }
        return this;
    }
    post(path) {
        this.config.method = 'POST';
        if (path) {
            this.config.url = path;
        }
        return this;
    }
    put(path) {
        this.config.method = 'PUT';
        if (path) {
            this.config.url = path;
        }
        return this;
    }
    delete(path) {
        this.config.method = 'DELETE';
        if (path) {
            this.config.url = path;
        }
        return this;
    }
    patch(path) {
        this.config.method = 'PATCH';
        if (path) {
            this.config.url = path;
        }
        return this;
    }
    options(path) {
        this.config.method = 'OPTIONS';
        if (path) {
            this.config.url = path;
        }
        return this;
    }
    // Swagger compatibility
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
    operationId(id) {
        this.config.operationId = id;
        return this;
    }
    generateOperationId() {
        const { method, url, controller } = this.config;
        const parts = [];
        // Add controller if exists
        if (controller) {
            parts.push(controller.toLowerCase());
        }
        // Add HTTP method
        parts.push(method.toLowerCase());
        // Process URL path
        const urlParts = url.split('/').filter(Boolean);
        parts.push(...urlParts.map(part => part.toLowerCase()));
        // Join all parts with underscore
        return parts.join('_');
    }
    auth(type = "bearer", guard) {
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
    // 3) Schema definition
    // --------------------------
    /**
     * Validate that schema has $id (required for route schemas)
     */
    requireSchemaId(schema, context) {
        if (!schema || !schema.$id || typeof schema.$id !== 'string') {
            const contextInfo = [
                context.method && `method: ${context.method}`,
                context.route && `route: ${context.route}`,
                `type: ${context.type}`
            ].filter(Boolean).join(', ');
            // Try to extract schema information for better error message
            let schemaInfo = 'Unknown schema';
            try {
                if (schema && typeof schema === 'object') {
                    // Try to get schema type or structure info
                    const schemaType = schema.type || schema[Symbol.for('TypeBox.Kind')] || 'unknown';
                    const hasProperties = 'properties' in schema;
                    const hasItems = 'items' in schema;
                    const hasRef = '$ref' in schema;
                    const schemaDetails = [];
                    if (schemaType !== 'unknown')
                        schemaDetails.push(`type: ${schemaType}`);
                    if (hasProperties)
                        schemaDetails.push('has properties');
                    if (hasItems)
                        schemaDetails.push('has items');
                    if (hasRef)
                        schemaDetails.push(`ref: ${schema.$ref}`);
                    schemaInfo = schemaDetails.length > 0
                        ? `Schema(${schemaDetails.join(', ')})`
                        : 'Schema object';
                    // Try to get schema structure preview (first level only)
                    if (hasProperties && schema.properties) {
                        const propKeys = Object.keys(schema.properties).slice(0, 5);
                        if (propKeys.length > 0) {
                            schemaInfo += ` with fields: ${propKeys.join(', ')}${Object.keys(schema.properties).length > 5 ? '...' : ''}`;
                        }
                    }
                }
            }
            catch {
                // Ignore errors when extracting schema info
            }
            throw new Error(`Schema used in route must have $id property.\n` +
                `Context: ${contextInfo}\n` +
                `Schema: ${schemaInfo}\n\n` +
                `Solution:\n` +
                `1. Use addSchema() to register schema with $id:\n` +
                `   const MySchema = Type.Object({...}, { $id: 'MySchema' });\n` +
                `   addSchema(MySchema);\n\n` +
                `2. Or add $id directly:\n` +
                `   Type.Object({...}, { $id: 'MySchema' })\n\n` +
                `3. Then use in route:\n` +
                `   .${context.type}(MySchema)`);
        }
        return schema;
    }
    params(schema) {
        // Require $id for route schemas
        const validatedSchema = this.requireSchemaId(schema, {
            type: 'params',
            method: this.config.method,
            route: this.config.url
        });
        this.extraMetaStorage.add({
            type: 'params',
            schema: validatedSchema,
            id: validatedSchema.$id
        });
        this.config.schema.params = this.withRef(validatedSchema);
        return this;
    }
    body(schema) {
        // Require $id for route schemas
        const validatedSchema = this.requireSchemaId(schema, {
            type: 'body',
            method: this.config.method,
            route: this.config.url
        });
        this.extraMetaStorage.add({
            type: 'body',
            schema: validatedSchema,
            id: validatedSchema.$id
        });
        this.config.schema.body = this.withRef(validatedSchema);
        return this;
    }
    query(schema) {
        // Require $id for route schemas
        const validatedSchema = this.requireSchemaId(schema, {
            type: 'query',
            method: this.config.method,
            route: this.config.url
        });
        this.extraMetaStorage.add({
            type: 'query',
            schema: validatedSchema,
            id: validatedSchema.$id
        });
        this.config.schema.querystring = this.withRef(validatedSchema);
        return this;
    }
    headers(schema) {
        // Require $id for route schemas
        const validatedSchema = this.requireSchemaId(schema, {
            type: 'headers',
            method: this.config.method,
            route: this.config.url
        });
        this.extraMetaStorage.add({
            type: 'headers',
            schema: validatedSchema,
            id: validatedSchema.$id
        });
        this.config.schema.headers = this.withRef(validatedSchema);
        return this;
    }
    code(code, schema) {
        return this.codes({ [code]: schema });
    }
    codes(responses) {
        for (const [code, schema] of Object.entries(responses)) {
            const statusCode = Number(code);
            // For 204 No Content, don't create response schema according to HTTP/OpenAPI standard
            // 204 responses should not have a response body schema in Swagger
            if (statusCode === 204) {
                // Don't set any response schema for 204 - OpenAPI/Swagger will correctly
                // interpret this as "no content" response
                // Don't add to extraMetaStorage - 204 doesn't need schema metadata
                this.config.schema.response[statusCode] = Type.Any({ default: null });
                continue;
            }
            // Require $id for response schemas
            const validatedSchema = this.requireSchemaId(schema, {
                type: 'response',
                method: this.config.method,
                route: this.config.url
            });
            this.extraMetaStorage.add({
                type: 'response',
                statusCode,
                schema: validatedSchema,
                id: validatedSchema.$id
            });
            // Create wrapper schema with $id using consistent naming convention
            // Format: {Controller}{OperationId}Response{StatusCode} or {SchemaId}Response{StatusCode}
            const wrapperSchemaId = generateResponseWrapperName(this.config.controller, this.config.operationId, validatedSchema.$id, statusCode);
            const wrapperSchema = Type.Object({
                status: Type.Literal(statusCode),
                data: this.withRef(validatedSchema)
            }, { $id: wrapperSchemaId });
            // Register wrapper schema
            this.config.schema.response[statusCode] = this.withRef(wrapperSchema);
        }
        return this;
    }
    // --------------------------
    // 4) Guard functions
    // --------------------------
    guard(fn) {
        this.config.guards.push(async (req, reply) => {
            try {
                const result = await fn.call(this, req, reply);
                if (result === true || result === undefined)
                    return true;
                if ((typeof result === "object") && ("status" in result) && ("data" in result)) {
                    // For 204 No Content, don't send response body according to HTTP standard
                    if (result.status === 204) {
                        reply.code(204).send();
                        return false;
                    }
                    reply.code(result.status).send(result);
                    return false;
                }
                return reply.code(500).send(result?.message || `Guard returned an invalid error object`);
            }
            catch (error) {
                if (error instanceof ResponseError) {
                    // 204 is not typically an error status, but handle it properly if needed
                    if (error.status === 204) {
                        reply.code(204).send();
                        return false;
                    }
                    reply.code(error.status).send(error);
                    return false;
                }
                if ("status" in error && "data" in error) {
                    // For 204 No Content, don't send response body according to HTTP standard
                    if (error.status === 204) {
                        reply.code(204).send();
                        return false;
                    }
                    reply.code(error.status).send(error);
                    return false;
                }
                return reply.code(500).send(error?.message || `Unknown server error`);
            }
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
    // 6) Data passing between hooks (resolver)
    // -------------------------------------------
    resolve(fn) {
        this.config.resolver = fn;
        return this;
    }
    // --------------------------------
    // 7) Final handler
    // --------------------------------
    handler(fn) {
        this.config.handler = fn;
        return this;
    }
    // ------------------------------------------------
    // 8) Custom response headers and Cache-Control
    // ------------------------------------------------
    responseHeader(name, value, statusCode // ✅ Limit only to registered statuses
    ) {
        if (!(statusCode in this.config.schema.response)) {
            throw new Error(`Cannot add header to status ${statusCode.toString()}: this status is not defined in .success() or .error()`);
        }
        this.config.responseHeaders[name] = value;
        const schema = this.config.schema.response[statusCode];
        if (schema && typeof schema === 'object') {
            if (!schema.properties) {
                schema.properties = {};
            }
            schema.properties[name] = Type.String(); // Swagger requires type
        }
        return this;
    }
    cacheControl(value) {
        this.config.cacheControl = value;
        return this;
    }
    rateLimit(options) {
        this.config.rateLimit = options;
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
    modify(fn) {
        this.config.modify = fn;
        return this;
    }
    async build() {
        const { method, url, schema, guards, resolver, handler, responseHeaders, responseType, cacheControl, rateLimit, modify, tags, description, summary, security, isMultipart, fileOptions, errorHandler, preHandlers, preParsing, preValidation, preSerialization, onRequest, onSend, onResponse, onError, version, prefix, controller, operationId } = this.config;
        if (!handler) {
            throw new Error('Handler is required');
        }
        if (!method || !url) {
            throw new Error('Method and URL are required');
        }
        const resolvePreHandler = async (req, reply) => {
            if (resolver) {
                try {
                    const result = await resolver(req, reply);
                    if (result instanceof ResponseError) {
                        // For 204 No Content, don't send response body according to HTTP standard
                        if (result.status === 204) {
                            reply.code(204).send();
                            return false;
                        }
                        reply.code(result.status).send(result);
                        return false;
                    }
                    if ((typeof result === "object") && ("status" in result) && ("data" in result)) {
                        // For 204 No Content, don't send response body according to HTTP standard
                        if (result.status === 204) {
                            reply.code(204).send();
                            return false;
                        }
                        reply.code(result.status).send({
                            status: result.status,
                            data: result.data
                        });
                        return false;
                    }
                    req.routeData = result;
                }
                catch (error) {
                    if (error instanceof ResponseError) {
                        // 204 is not typically an error status, but handle it properly if needed
                        if (error.status === 204) {
                            reply.code(204).send();
                            return false;
                        }
                        reply.code(error.status).send(error);
                        return false;
                    }
                    return reply.code(500).send({
                        status: 500,
                        data: { error: error.message },
                    });
                }
            }
            return true;
        };
        const preHandlersWithResolver = [resolvePreHandler, ...guards];
        const tempFilesPrehandler = async (req) => {
            if (Array.isArray(req.tempFiles) && req.tempFiles.length) {
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
            operationId: operationId || this.generateOperationId()
        };
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
        const onErrorHandler = (error, req, reply) => {
            if (error) {
                if (errorHandler) {
                    errorHandler.call(this, error, req, reply);
                }
                else {
                    return reply.code(500).send({
                        status: 500,
                        data: { error: error.message },
                    });
                }
            }
        };
        const cleanedPrefix = trimSlashes(prefix || '');
        const cleanedController = trimSlashes(controller || '');
        const cleanedUrl = trimSlashes(url || '');
        const _prefix = cleanedPrefix ? `${cleanedPrefix}/` : '';
        const _controller = cleanedController ? `${cleanedController}/` : '';
        const _version = version ? `v${version}/` : '';
        const route = `/${_prefix}${_controller}${_version}${cleanedUrl}`;
        const schemas = this.extraMetaStorage.getAll();
        const metaEntry = {
            route,
            method,
            meta: schemas
        };
        metaRouteSchemaStorage.add(metaEntry);
        let newRouteOptions = {
            method,
            url: route,
            schema: extendedSchema,
            config: rateLimit ? { rateLimit } : undefined,
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
                    const tempFiles = Array.isArray(req.tempFiles) ? req.tempFiles : [];
                    const errors = [];
                    const fileCounts = {};
                    const defaultOptions = fileOptions.default || null;
                    for (const file of tempFiles) {
                        const options = fileOptions[file.fieldname] || defaultOptions;
                        if (!options)
                            continue;
                        // Check maximum file size
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
                    for (const file of tempFiles) {
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
                                error: errors.join('\n')
                            },
                        });
                    }
                    else {
                        if (this.appContext.fileLoader && Array.isArray(req.tempFiles)) {
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
                    try {
                        const result = await handler.call(this, req, reply);
                        if (result instanceof ResponseError) {
                            // For 204 No Content, don't send response body according to HTTP standard
                            if (result.status === 204) {
                                return reply.code(204).send();
                            }
                            return reply.code(result.status).send(result);
                        }
                        if (result &&
                            typeof result === 'object' &&
                            'status' in result) {
                            // For 204 No Content, don't send response body according to HTTP standard
                            if (result.status === 204) {
                                return reply.code(204).send();
                            }
                            return reply.code(result.status).send(result);
                        }
                        reply.type(this.config.responseType || 'text/html');
                        return result;
                    }
                    catch (error) {
                        if (error instanceof ResponseError) {
                            // 204 is not typically an error status, but handle it properly if needed
                            if (error.status === 204) {
                                return reply.code(204).send();
                            }
                            return reply.code(error.status).send(error);
                        }
                        if ("status" in error && "data" in error) {
                            // For 204 No Content, don't send response body according to HTTP standard
                            if (error.status === 204) {
                                return reply.code(204).send();
                            }
                            return reply.code(error.status).send({
                                status: error.status,
                                data: error.data
                            });
                        }
                        return reply.code(500).send({
                            status: 500,
                            data: { error: error.message || 'Internal server error' }
                        });
                    }
                }
                else {
                    return reply.code(500).send({
                        status: 500,
                        data: { error: 'No handler provided' }
                    });
                }
            }
        };
        if (modify) {
            newRouteOptions = await modify(newRouteOptions);
        }
        this.fastify.route(newRouteOptions);
    }
}
//# sourceMappingURL=route.js.map
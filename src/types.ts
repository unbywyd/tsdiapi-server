import type { FastifyCorsOptions } from '@fastify/cors';
import type { FastifyHelmetOptions } from '@fastify/helmet';
import type { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import { FastifySwaggerUiConfigOptions, FastifySwaggerUiOptions } from '@fastify/swagger-ui';
import { FastifyInstance, FastifyRequest, FastifyServerOptions } from "fastify";

import { FastifyStaticOptions } from '@fastify/static';
import { FastifyMultipartAttachFieldsToBodyOptions, FastifyMultipartBaseOptions } from '@fastify/multipart';
import { TObject } from '@sinclair/typebox';
import { AppConfig } from './config-loader.js';
import { RouteBuilder, StatusSchemas } from './route.js';

export type UploadFile = {
    fieldname: string;
    filename: string;
    encoding: string;
    mimetype: string;
    filesize: number;
    buffer: Buffer | Buffer<ArrayBufferLike>;
    url?: string;
    meta?: Record<string, any>;
    id: string;
    s3bucket?: string;
    s3region?: string;
}

export type FileLoader = (file: UploadFile, routeBuilder: RouteBuilder) => Promise<UploadFile> | UploadFile;

export type AppOptionHandler<T> = (defaultOptions: T) => T;
export interface AppOptions<T extends object = Record<string, any>> {
    apiDir?: string;
    configSchema?: TObject;
    logger?: boolean;
    fileLoader?: FileLoader;
    fastifyOptions?: AppOptionHandler<FastifyServerOptions>;
    corsOptions?: FastifyCorsOptions | boolean | AppOptionHandler<FastifyCorsOptions>;
    helmetOptions?: FastifyHelmetOptions | boolean | AppOptionHandler<FastifyHelmetOptions>;
    swaggerOptions?: AppOptionHandler<FastifyDynamicSwaggerOptions> | FastifyDynamicSwaggerOptions;
    swaggerUiOptions?: AppOptionHandler<FastifySwaggerUiOptions> | FastifySwaggerUiOptions;
    staticOptions?: AppOptionHandler<FastifyStaticOptions> | FastifyStaticOptions | boolean;
    multipartOptions?: AppOptionHandler<FastifyMultipartAttachFieldsToBodyOptions> | FastifyMultipartAttachFieldsToBodyOptions;
    plugins?: AppPlugin[];
    onInit?(ctx: AppContext<T>): Promise<void> | void;
    beforeStart?(ctx: AppContext<T>): Promise<void> | void;
    preReady?(ctx: AppContext<T>): Promise<void> | void;
    afterStart?(ctx: AppContext<T>): Promise<void> | void;
}

export type Env = 'production' | 'development';
export interface AppContext<T extends object = Record<string, any>> {
    fastify: FastifyInstance;
    environment: Env;
    appDir: string;
    options: AppOptions<T>;
    fileLoader?: FileLoader;
    projectConfig: AppConfig<T>;
    projectPackage: Record<string, any>;
    plugins?: Record<string, AppPlugin>;
    useRoute: <Params extends TObject = TObject, Body extends TObject = TObject, Query extends TObject = TObject, Headers extends TObject = TObject, TResponses extends StatusSchemas = {}, TState = unknown>(controller?: string) => RouteBuilder<Params, Body, Query, Headers, TResponses, TState>;
}

export type Constructor<T = any> = new (...args: any[]) => T;
export interface AppPlugin<T extends object = Record<string, any>, P extends object = Record<string, any>> {
    name: string;
    services?: Constructor<unknown>[];
    config?: P;
    onInit?(ctx: AppContext<T>): Promise<void> | void;
    beforeStart?(ctx: AppContext<T>): Promise<void> | void;
    afterStart?(ctx: AppContext<T>): Promise<void> | void;
    preReady?(ctx: AppContext<T>): Promise<void> | void;
}

export type AppMainOptions = {
    PORT?: number;
    HOST?: string;
    APP_NAME?: string;
    APP_VERSION?: string;
}
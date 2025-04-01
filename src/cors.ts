import { FastifyCorsOptions } from '@fastify/cors';
import { AppOptions } from './types.js';

/*
*   CORS Configuration
*/
const defaultCors: FastifyCorsOptions = {
    "origin": "*",
    "methods": [
        "GET",
        "POST",
        "OPTIONS",
        "PUT",
        "PATCH",
        "DELETE"
    ],
    "credentials": false,
    "allowedHeaders": [
        "Content-Type",
        "Authorization",
        "X-Auth-Guard",
        "Apollo-Require-Preflight",
        "access-control-allow-origin",
        "access-control-allow-headers",
        "access-control-allow-methods"
    ]
}

export async function setupCors(corsOptions?: AppOptions['corsOptions']) {
    let options: FastifyCorsOptions = defaultCors;
    if (corsOptions === false) return;
    if ('function' === typeof corsOptions) {
        options = corsOptions(defaultCors);
    } else if ('object' === typeof corsOptions) {
        options = corsOptions
    }
    return options;
}

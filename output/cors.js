/*
*   CORS Configuration
*/
const defaultCors = {
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
};
export async function setupCors(corsOptions) {
    let options = defaultCors;
    if (corsOptions === false)
        return;
    if ('function' === typeof corsOptions) {
        options = corsOptions(defaultCors);
    }
    else if ('object' === typeof corsOptions) {
        options = corsOptions;
    }
    return options;
}
//# sourceMappingURL=cors.js.map
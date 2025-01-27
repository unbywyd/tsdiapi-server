"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("../modules/app");
const cors = {
    "origin": (0, app_1.getConfig)('CORS_ORIGIN', '*'),
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
exports.default = cors;
//# sourceMappingURL=cors.config.js.map
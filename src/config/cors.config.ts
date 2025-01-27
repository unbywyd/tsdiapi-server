import { getConfig } from "../modules/app";
import { CorsOptions } from "cors";

const cors: CorsOptions = {
    "origin": getConfig('CORS_ORIGIN', '*'),
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

export default cors;
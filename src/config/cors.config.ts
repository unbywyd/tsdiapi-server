import { CorsOptions } from "cors";
import { App } from "../modules/app.js";

export const corsOptions = async () => {
    await App.getAppConfig(); // Load app config
    const cors: CorsOptions = {
        "origin": App.getConfig<Record<string, any>, string>('CORS_ORIGIN', '*'),
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
    return cors;
}
export default corsOptions;
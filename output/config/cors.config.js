"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsOptions = void 0;
const app_1 = require("../modules/app");
const corsOptions = () => __awaiter(void 0, void 0, void 0, function* () {
    yield app_1.App.getAppConfig(); // Load app config
    const cors = {
        "origin": app_1.App.getConfig('CORS_ORIGIN', '*'),
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
    return cors;
});
exports.corsOptions = corsOptions;
exports.default = exports.corsOptions;
//# sourceMappingURL=cors.config.js.map
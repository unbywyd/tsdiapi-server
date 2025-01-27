"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    baseDir: '/docs',
    securitySchemes: {
        bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
        }
    }
};
exports.default = config;
//# sourceMappingURL=swagger.config.js.map
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomErrorHandler = void 0;
exports.toSlug = toSlug;
const routing_controllers_1 = require("routing-controllers");
const typedi_1 = require("typedi");
const app_1 = require("../modules/app");
const response_1 = require("../modules/response");
function toSlug(str) {
    return str
        .trim()
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .replace(/[^a-zA-Z0-9_.]+/g, "_")
        .toUpperCase();
}
let CustomErrorHandler = class CustomErrorHandler {
    error(error, _req, res, next) {
        const IsDevelopment = app_1.App.isDevelopment;
        // Если заголовки уже отправлены, пропускаем
        if (res.headersSent) {
            return next();
        }
        // 1. Определим статус
        let status = 500;
        if (error instanceof routing_controllers_1.HttpError && error.httpCode) {
            status = error.httpCode;
        }
        // 2. Формируем главный message
        const mainMessage = error.message || "Internal server error";
        // 3. Создаём IResponseError
        const responseError = new response_1.IResponseError(mainMessage, status);
        // 4. Если это ошибка валидации (обычно status=400), заполняем массив errors
        //    Допустим, error.errors — это массив ValidationError от class-validator
        if (status === 400 && error.errors && Array.isArray(error.errors)) {
            // Заново наполним responseError.errors
            responseError.errors = error.errors.map((validationError) => {
                // По-разному достаём текст ошибки. Например:
                if (validationError.constraints) {
                    // если есть constraints (class-validator)
                    const constraintMessages = Object.values(validationError.constraints);
                    const msg = constraintMessages.join("; ");
                    return {
                        message: msg,
                        slug: toSlug(msg),
                    };
                }
                // fallback: если нет constraints, возьмём validationError.message, если оно есть
                const fallbackMessage = validationError.message || "Validation error";
                return {
                    message: fallbackMessage,
                    slug: toSlug(fallbackMessage),
                };
            });
        }
        // 5. Если у нас 500-я ошибка и режим разработки - добавляем stack
        if (IsDevelopment && status === 500 && error.stack) {
            // Приводим к any, чтобы не ломать типы
            responseError.stack = error.stack;
        }
        // 6. Отправляем ответ
        return res.status(status).json(responseError);
    }
};
exports.CustomErrorHandler = CustomErrorHandler;
exports.CustomErrorHandler = CustomErrorHandler = __decorate([
    (0, typedi_1.Service)(),
    (0, routing_controllers_1.Middleware)({ type: "after" })
], CustomErrorHandler);
//# sourceMappingURL=error-handler.middleware.js.map
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Middleware, HttpError, } from "routing-controllers";
import { Service } from "typedi";
import { App } from "../modules/app.js";
import { IResponseError } from "../modules/response.js";
export function toSlug(str) {
    return str
        .trim()
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .replace(/[^a-zA-Z0-9_.]+/g, "_")
        .toUpperCase();
}
let CustomErrorHandler = class CustomErrorHandler {
    error(error, _req, res, next) {
        const IsDevelopment = App.isDevelopment;
        // Если заголовки уже отправлены, пропускаем
        if (res.headersSent) {
            return next();
        }
        // 1. Определим статус
        let status = 500;
        if (error instanceof HttpError && error.httpCode) {
            status = error.httpCode;
        }
        // 2. Формируем главный message
        const mainMessage = error.message || "Internal server error";
        // 3. Создаём IResponseError
        const responseError = new IResponseError(mainMessage, status);
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
CustomErrorHandler = __decorate([
    Service(),
    Middleware({ type: "after" })
], CustomErrorHandler);
export default CustomErrorHandler;
//# sourceMappingURL=error-handler.middleware.js.map
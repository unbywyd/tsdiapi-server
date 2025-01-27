import {
    ExpressErrorMiddlewareInterface,
    Middleware,
    HttpError,
} from "routing-controllers";
import * as express from "express";
import { Service } from "typedi";
import { IResponseError } from "routing-controllers-openapi-extra";
import { IsDevelopment } from "../modules/app";

export function toSlug(str: string) {
    return str
        .trim()
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .replace(/[^a-zA-Z0-9_.]+/g, "_")
        .toUpperCase();
}
@Service()
@Middleware({ type: "after" })
export class CustomErrorHandler implements ExpressErrorMiddlewareInterface {
    public error(
        error: any,
        _req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) {
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
            responseError.errors = error.errors.map((validationError: any) => {
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
            (responseError as any).stack = error.stack;
        }

        // 6. Отправляем ответ
        return res.status(status).json(responseError);
    }
}


import { Type } from "@sinclair/typebox";
export class ResponseErrorClass {
    status;
    data;
    constructor(message, status, payload) {
        this.status = status;
        this.data = {
            error: message,
            payload
        };
    }
}
export class ResponseSuccessClass {
    status;
    data;
    constructor(data, status) {
        this.status = status;
        this.data = data;
    }
}
export const ResponseErrorSchema = Type.Object({
    error: Type.String(),
    payload: Type.Optional(Type.Any({
        default: null
    }))
});
export const useResponseErrorSchema = (schema) => {
    const errorSchema = Type.Object({
        error: Type.String(),
        payload: Type.Optional(schema)
    });
    const sendError = (message, payload) => {
        return new ResponseErrorClass(message, 400, payload);
    };
    return {
        sendError,
        errorSchema
    };
};
export const useResponseSuccessSchema = (schema) => {
    const sendSuccess = (data) => {
        return new ResponseSuccessClass(data, 200);
    };
    return {
        sendSuccess,
        successSchema: schema
    };
};
export const useResponseSchemas = (successSchema, errorSchema) => {
    return {
        ...useResponseErrorSchema(errorSchema),
        ...useResponseSuccessSchema(successSchema)
    };
};
// Client errors (4xx)
export const Response400Error = (message, payload) => new ResponseErrorClass(message, 400, payload); // Bad Response
export const Response401Error = (message, payload) => new ResponseErrorClass(message, 401, payload); // Unauthorized
export const Response403Error = (message, payload) => new ResponseErrorClass(message, 403, payload); // Forbidden
export const Response404Error = (message, payload) => new ResponseErrorClass(message, 404, payload); // Not Found
export const Response409Error = (message, payload) => new ResponseErrorClass(message, 409, payload); // Conflict
export const Response422Error = (message, payload) => new ResponseErrorClass(message, 422, payload); // Unprocessable Entity
export const Response429Error = (message, payload) => new ResponseErrorClass(message, 429, payload); // Too Many Responses
export const ResponseForbiddenError = (message, payload) => new ResponseErrorClass(message, 403, payload);
export const ResponseNotFoundError = (message, payload) => new ResponseErrorClass(message, 404, payload);
export const ResponseConflictError = (message, payload) => new ResponseErrorClass(message, 409, payload);
export const ResponseUnprocessableEntityError = (message, payload) => new ResponseErrorClass(message, 422, payload);
export const ResponseTooManyRequestsError = (message, payload) => new ResponseErrorClass(message, 429, payload);
export const ResponseBadRequestError = (message, payload) => new ResponseErrorClass(message, 400, payload);
// Server errors (5xx)
export const Response500Error = (message, payload) => new ResponseErrorClass(message, 500, payload); // Internal Server Error
export const Response503Error = (message, payload) => new ResponseErrorClass(message, 503, payload); // Service Unavailable
export const ResponseSuccess = (data) => new ResponseSuccessClass(data, 200);
export const Response200Success = (data) => new ResponseSuccessClass(data, 200);
export const Response201Success = (data) => new ResponseSuccessClass(data, 201);
export const Response202Success = (data) => new ResponseSuccessClass(data, 202);
export const Response204Success = (data) => new ResponseSuccessClass(data, 204);
export const ResponseNullSuccess = () => new ResponseSuccessClass(null, 204);
//# sourceMappingURL=response.js.map
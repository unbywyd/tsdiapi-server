"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toDTO = toDTO;
exports.toSlug = toSlug;
exports.getEnumValues = getEnumValues;
const class_transformer_1 = require("class-transformer");
function toDTO(DTOClass, data, options = {}) {
    return (0, class_transformer_1.plainToClass)(DTOClass, data, Object.assign(Object.assign({}, options), { excludeExtraneousValues: true }));
}
function toSlug(str) {
    return str
        .trim()
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .replace(/[^a-zA-Z0-9_.]+/g, "_")
        .toUpperCase();
}
function getEnumValues(enumType) {
    return Array.from(new Set(Object.keys(enumType)
        .filter((key) => isNaN(Number(key)))
        .map((key) => enumType[key])
        .filter((value) => typeof value === 'string')));
}
//# sourceMappingURL=utils.js.map
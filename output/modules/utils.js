import { plainToClass } from "class-transformer";
export function toDTO(DTOClass, data, options = {}) {
    return plainToClass(DTOClass, data, {
        ...options,
        excludeExtraneousValues: true,
    });
}
export function toSlug(str) {
    return str
        .trim()
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .replace(/[^a-zA-Z0-9_.]+/g, "_")
        .toUpperCase();
}
export function getEnumValues(enumType) {
    return Array.from(new Set(Object.keys(enumType)
        .filter((key) => isNaN(Number(key)))
        .map((key) => enumType[key])
        .filter((value) => typeof value === 'string')));
}
//# sourceMappingURL=utils.js.map
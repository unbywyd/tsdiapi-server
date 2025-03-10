import { ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { JSONSchema } from "class-validator-jsonschema";
import { getSyncQueueProvider } from "@tsdiapi/syncqueue";
function FixArrayJsonSchemaReference(reference) {
    return JSONSchema({
        type: "array",
        items: {
            $ref: `#/components/schemas/${reference.name}`,
        },
    });
}
function FixItemJsonSchemaReference(reference) {
    return JSONSchema({
        $ref: `#/components/schemas/${reference.name}`,
    });
}
function ApplyJsonSchemaType(type, target, propertyKey, isArray) {
    if (type) {
        if (isArray) {
            FixArrayJsonSchemaReference(type)(target, propertyKey);
        }
        else {
            FixItemJsonSchemaReference(type)(target, propertyKey);
        }
    }
}
export function IsEntity(typeFunction, options) {
    const isArray = options?.each || false;
    return function (target, propertyKey) {
        ValidateNested({ each: isArray })(target, propertyKey);
        const referenceType = typeFunction();
        Reflect.defineMetadata("design:itemtype", referenceType, target, propertyKey);
        if (referenceType instanceof Promise) {
            const task = referenceType.then(type => {
                Type(() => type)(target, propertyKey);
                ApplyJsonSchemaType(type, target, propertyKey, isArray);
            }).catch(err => {
                console.error("Error resolving type for property :" + String(propertyKey), err);
            });
            getSyncQueueProvider().addTask(task);
        }
        else {
            Type(() => referenceType)(target, propertyKey);
            ApplyJsonSchemaType(referenceType, target, propertyKey, isArray);
        }
    };
}
export function ReferenceModel(modelName) {
    return (target, propertyKey) => {
        JSONSchema({
            description: `@reference ${modelName}`,
        })(target, propertyKey);
    };
}
//# sourceMappingURL=entity.js.map
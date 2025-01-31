"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonSchemaProperty = JsonSchemaProperty;
exports.JsonSchemaClass = JsonSchemaClass;
exports.generateJsonSchema = generateJsonSchema;
const class_validator_jsonschema_1 = require("class-validator-jsonschema");
const class_validator_1 = require("class-validator");
function JsonSchemaProperty(schemaOptions) {
    return function (target, propertyKey) {
        const metadata = Reflect.getMetadata('jsonSchema', target) || {};
        metadata[propertyKey] = metadata[propertyKey] || {};
        Object.assign(metadata[propertyKey], schemaOptions);
        Reflect.defineMetadata('jsonSchema', metadata, target);
    };
}
function JsonSchemaClass(schemaOptions) {
    return function (target) {
        const metadata = Reflect.getMetadata('jsonSchema', target.prototype) || {};
        Object.assign(metadata, schemaOptions);
        Reflect.defineMetadata('jsonSchema', metadata, target.prototype);
    };
}
function generateJsonSchema(classConstructor, options) {
    try {
        const metadataStorage = (0, class_validator_1.getMetadataStorage)();
        if (!metadataStorage) {
            throw new Error('No metadata storage found. Ensure that class-validator is properly set up.');
        }
        // Generate all schemas from class-validator metadata
        const allSchemas = (0, class_validator_jsonschema_1.validationMetadatasToSchemas)({
            refPointerPrefix: '#/components/schemas/',
        });
        // Determine the reference name (either provided or auto-generated)
        const name = (options === null || options === void 0 ? void 0 : options.refName) || classConstructor.name;
        // Fetch the schema for the requested class
        const schema = allSchemas[name];
        if (!schema) {
            throw new Error(`No schema found for class "${name}". Ensure that the class has proper validation decorators.`);
        }
        // Add custom metadata to the schema
        const customMetadata = Reflect.getMetadata('jsonSchema', classConstructor.prototype);
        if (customMetadata) {
            Object.keys(customMetadata).forEach(key => {
                if (key === 'additionalProperties' || key === 'title' || key === 'description') {
                    schema[key] = customMetadata[key];
                }
                else if (schema.properties && schema.properties[key]) {
                    Object.assign(schema.properties[key], customMetadata[key]);
                }
            });
        }
        // If `isArray` is true, wrap the schema inside an array definition
        if (options === null || options === void 0 ? void 0 : options.isArray) {
            return {
                type: 'array',
                items: schema,
            };
        }
        return schema;
    }
    catch (error) {
        console.error('Error generating JSON schema:', error);
        throw error;
    }
}
//# sourceMappingURL=jsonschema.js.map
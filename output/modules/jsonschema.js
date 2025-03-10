import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import { getMetadataStorage } from 'class-validator';
export function JsonSchemaProperty(schemaOptions) {
    return function (target, propertyKey) {
        const metadata = Reflect.getMetadata('jsonSchema', target) || {};
        metadata[propertyKey] = metadata[propertyKey] || {};
        Object.assign(metadata[propertyKey], schemaOptions);
        Reflect.defineMetadata('jsonSchema', metadata, target);
    };
}
export function JsonSchemaClass(schemaOptions) {
    return function (target) {
        const metadata = Reflect.getMetadata('jsonSchema', target.prototype) || {};
        Object.assign(metadata, schemaOptions);
        Reflect.defineMetadata('jsonSchema', metadata, target.prototype);
    };
}
export function generateJsonSchema(classConstructor, options) {
    try {
        const metadataStorage = getMetadataStorage();
        if (!metadataStorage) {
            throw new Error('No metadata storage found. Ensure that class-validator is properly set up.');
        }
        // Generate all schemas from class-validator metadata
        const allSchemas = validationMetadatasToSchemas({
            refPointerPrefix: '#/components/schemas/',
        });
        // Determine the reference name (either provided or auto-generated)
        const name = options?.refName || classConstructor.name;
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
        if (options?.isArray) {
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
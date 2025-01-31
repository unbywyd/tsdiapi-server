import { JSONSchema7 } from 'json-schema';
export declare function JsonSchemaProperty(schemaOptions: Record<string, any>): (target: any, propertyKey: string) => void;
export declare function JsonSchemaClass(schemaOptions: Record<string, any>): (target: any) => void;
export declare function generateJsonSchema<T>(classConstructor: new () => T, options?: {
    refName?: string;
    isArray?: boolean;
}): JSONSchema7;
//# sourceMappingURL=jsonschema.d.ts.map
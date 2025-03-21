import { Value } from '@sinclair/typebox/value';
export class AppConfig {
    appConfig = {};
    get(key, defaultValue) {
        return this.appConfig[key] || defaultValue;
    }
    set(key, value) {
        this.appConfig[key] = value;
    }
    prepare(data, schema) {
        this.appConfig = (data || {});
        if (schema) {
            try {
                this.appConfig = Value.Cast(schema, data);
            }
            catch (error) {
                console.error(`Error while parsing config schema: ${error.message}`);
            }
        }
    }
    getConfig() {
        return this.appConfig;
    }
}
//# sourceMappingURL=config-loader.js.map
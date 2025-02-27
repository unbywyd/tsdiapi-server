export type SwaggerOptions = {
    baseDir: string;
    securitySchemes?: any;
}

const config = {
    baseDir: '/docs'
} as SwaggerOptions;

const getSwaggerOptions = async () => {
    return config;
}

export default getSwaggerOptions;
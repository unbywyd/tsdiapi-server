import morgan from 'morgan';
export function loadMorganModule(app, logger) {
    return app.use(morgan("combined", {
        stream: { write: (message) => logger.info(message.trim()) },
    }));
}
//# sourceMappingURL=morgan.js.map
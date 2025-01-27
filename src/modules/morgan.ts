import morgan from 'morgan'
import express from 'express';
import winston from 'winston';

export function loadMorganModule(app: express.Application, logger: winston.Logger) {
    return app.use(
        morgan("combined", {
            stream: { write: (message) => logger.info(message.trim()) },
        })
    );
}
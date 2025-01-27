import Helmet from 'helmet';
import express from 'express';
import helmetOptions from '../config/helmet.config';


export function loadHelmetModule(app: express.Application) {
    return app.use(
        Helmet(helmetOptions),
    );
}

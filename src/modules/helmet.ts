import { HelmetOptions } from 'helmet';
import Helmet from 'helmet';
import express from 'express';


export function loadHelmetModule(app: express.Application, helmetOptions: HelmetOptions) {
    return app.use(
        Helmet(helmetOptions),
    );
}

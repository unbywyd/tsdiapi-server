import { initApp } from "./init";
import { App } from "./modules/app";
import { CreateAppOptions } from "./types";

export { App } from './modules/app';
export type * from './types';

export async function createApp(options?: CreateAppOptions) {
    App.initialize({
        appCwd: process.cwd(),
    }).then(() => {
        initApp(options);
    }).catch(error => {
        console.error('Error initializing app', error);
    });
}
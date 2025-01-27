import { AppContext } from "./AppContext";
import { AppOptions } from "./AppOptions";
import { AppPlugin } from "./Plugin";

export * from "./AppContext";
export * from "./AppOptions";
export * from "./Plugin";


export interface CreateAppOptions {
    config?: Partial<AppOptions> | ((options: AppOptions) => AppOptions);
    plugins?: AppPlugin[];
    onInit?(ctx: AppContext): Promise<void> | void;
    beforeStart?(ctx: AppContext): Promise<void> | void;
    afterStart?(ctx: AppContext): Promise<void> | void;
}

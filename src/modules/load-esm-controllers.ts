import { statSync } from "node:fs";
import { sync as globSync } from "glob";
import path from 'path';
import { pathToFileURL } from "url";

export async function loadESMControllers(globPatterns: string[]): Promise<void> {
    for (const pattern of globPatterns) {
        const fixedPattern = path.posix.join(pattern.replace(/\\/g, "/"));
        const matchedFiles = globSync(fixedPattern, { absolute: true });
        if (matchedFiles.length === 0) {
            continue;
        }
        for (const filePath of matchedFiles) {
            if (statSync(filePath).isDirectory())
                continue;
            try {
                const fileUrl = pathToFileURL(filePath).href;
                await import(fileUrl);
            }
            catch (error) {
                console.error(`❌ [loadESMControllers] Error importing ${filePath}:\n`, error);
            }
        }
    }
}
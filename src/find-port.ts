import { createServer } from "net";

export async function findAvailablePort(host: string, startingPort: number, maxAttempts = 10): Promise<number | null> {
    return new Promise((resolve) => {
        let attempt = 0;
        let currentPort = startingPort;

        function tryPort() {
            const testServer = createServer();
            testServer.once("error", (err: any) => {
                if (err.code === "EADDRINUSE") {
                    console.warn(`⚠️ Port ${currentPort} is in use. Trying port ${currentPort + 1}...`);
                    attempt++;
                    if (attempt >= maxAttempts) {
                        console.warn(`❌ No available ports found up to ${currentPort}.`);
                        resolve(null);
                    } else {
                        currentPort++;
                        setTimeout(tryPort, 100);
                    }
                } else {
                    console.error(`❌ Unexpected error while checking port ${currentPort}:`, err);
                    resolve(null);
                }
            });

            testServer.once("listening", () => {
                console.log(`✅ Port ${currentPort} is free.`);
                testServer.close(() => {
                    setTimeout(() => resolve(currentPort), 200);
                });
            });

            testServer.listen(currentPort, host);
        }

        tryPort();
    });
}

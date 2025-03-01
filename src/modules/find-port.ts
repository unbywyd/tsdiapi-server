import { createServer } from "http";

export async function findAvailablePort(startingPort: number, maxAttempts = 10): Promise<number | null> {
    return new Promise((resolve) => {
        let attempt = 0;
        let currentPort = startingPort;

        function tryPort() {
            const testServer = createServer();

            testServer.listen(currentPort, () => {
                testServer.close(() => resolve(currentPort));
            });

            testServer.on("error", (err: any) => {
                if (err.code === "EADDRINUSE") {
                    attempt++;
                    if (attempt >= maxAttempts) {
                        resolve(null);
                    } else {
                        console.warn(`⚠️ Port ${currentPort} is in use. Trying port ${currentPort + 1}...`);
                        currentPort++;
                        tryPort();
                    }
                } else {
                    resolve(null);
                }
            });
        }

        tryPort();
    });
}

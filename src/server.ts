import express, { type NextFunction, type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";

import { bot } from "./bot";

const app = express();

app.use(express.json());
app.use(bot.webhookCallback("/webhook/telegram"));

function getPackageVersion(): string {
  const packageJsonPath = path.resolve(__dirname, "..", "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as { version?: string };
  return packageJson.version ?? "unknown";
}

function healthHandler(_req: Request, res: Response): void {
  res.status(200).json({ status: "ok" });
}

function rootHandler(_req: Request, res: Response): void {
  res.status(200).json({ service: "dani-api", version: getPackageVersion() });
}

function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: "Not Found" });
}

function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
}

app.get("/health", healthHandler);
app.get("/", rootHandler);
app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) {
  const port = Number(process.env.PORT ?? "3000");
  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
  if (webhookUrl) {
    console.log(`Setting webhook to ${webhookUrl}/webhook/telegram`);
    bot.telegram.setWebhook(`${webhookUrl}/webhook/telegram`);
  }
  const server = app.listen(port, () => {
    console.log(`dani-api listening on port ${port}`);
  });

  let isShuttingDown = false;
  const shutdown = (signal: NodeJS.Signals) => {
    if (isShuttingDown) {
      return;
    }
    isShuttingDown = true;

    const forceExitTimer = setTimeout(() => {
      server.closeAllConnections?.();
      process.exit(1);
    }, 5000);
    forceExitTimer.unref();

    try {
      bot.stop(signal);
    } catch (error) {
      if (!(error instanceof Error) || error.message !== "Bot is not running!") {
        console.error("Error while stopping bot:", error);
      }
    }

    server.close((error) => {
      clearTimeout(forceExitTimer);
      if (error) {
        console.error("Error while shutting down server:", error);
        process.exit(1);
      }
      process.exit(0);
    });
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

export { app, errorHandler, healthHandler, notFoundHandler, rootHandler };

import express, { type NextFunction, type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";
import type { Telegraf } from "telegraf";

function getPackageVersion(): string {
  const packageJsonPath = path.resolve(__dirname, "..", "..", "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as { version?: string };
  return packageJson.version ?? "unknown";
}

export function healthHandler(_req: Request, res: Response): void {
  res.status(200).json({ status: "ok" });
}

export function rootHandler(_req: Request, res: Response): void {
  res.status(200).json({ service: "dani-api", version: getPackageVersion() });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: "Not Found" });
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
}

export function createApp(bot?: Telegraf): express.Express {
  const app = express();
  app.use(express.json());

  if (bot) {
    app.use(bot.webhookCallback("/webhook/telegram"));
  }

  app.get("/health", healthHandler);
  app.get("/", rootHandler);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

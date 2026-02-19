import express, { type NextFunction, type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";

const app = express();

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
  app.listen(port, "0.0.0.0", () => {
    console.log(`dani-api listening on 0.0.0.0:${port}`);
  });
}

export { app, errorHandler, healthHandler, notFoundHandler, rootHandler };

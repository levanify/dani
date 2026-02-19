import { createApp, errorHandler, healthHandler, notFoundHandler, rootHandler } from "./http/app";
import { createDaniAssistant } from "./services/dani-assistant";
import { createBot } from "./telegram/bot";

const app = createApp();

if (require.main === module) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN environment variable.");
  }

  const bot = createBot({
    assistant: createDaniAssistant(),
    token,
    allowedUsersRaw: process.env.ALLOWED_USERS ?? "",
    nodeEnv: process.env.NODE_ENV,
  });
  const runtimeApp = createApp(bot);
  const port = Number(process.env.PORT ?? "3000");
  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
  if (webhookUrl) {
    console.log(`Setting webhook to ${webhookUrl}/webhook/telegram`);
    bot.telegram.setWebhook(`${webhookUrl}/webhook/telegram`);
  }

  const server = runtimeApp.listen(port, () => {
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

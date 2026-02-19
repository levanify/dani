import { Telegraf } from "telegraf";

import { chat } from "./openai";

export const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
const allowedUsers = new Set(
  (process.env.ALLOWED_USERS ?? "")
    .split(",")
    .map((username) => username.trim().replace(/^@/, "").toLowerCase())
    .filter(Boolean),
);

function isAllowedTelegramUser(username: string | undefined): boolean {
  if (!username) {
    return false;
  }

  return allowedUsers.has(username.toLowerCase());
}

bot.on("text", async (ctx) => {
  if (!isAllowedTelegramUser(ctx.from?.username)) {
    await ctx.reply("You don't have access to this bot.");
    return;
  }

  const reply = await chat(ctx.message.text);
  await ctx.reply(reply);
});

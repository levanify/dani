import { Telegraf } from "telegraf";

import { NodeEnv } from "../config/env";
import type { DaniAssistant } from "../services/dani-assistant";

type CreateBotOptions = {
  assistant: DaniAssistant;
  token: string;
  allowedUsersRaw: string;
  nodeEnv?: string;
};

function parseAllowedUsers(allowedUsersRaw: string): Set<string> {
  return new Set(
    allowedUsersRaw
      .split(",")
      .map((username) => username.trim().replace(/^@/, "").toLowerCase())
      .filter(Boolean),
  );
}

function isAllowedTelegramUser(allowedUsers: Set<string>, username: string | undefined): boolean {
  if (!username) {
    return false;
  }

  return allowedUsers.has(username.toLowerCase());
}

export function createBot(options: CreateBotOptions): Telegraf {
  const allowedUsers = parseAllowedUsers(options.allowedUsersRaw);
  const bot = new Telegraf(options.token);

  bot.on("text", async (ctx) => {
    if (!isAllowedTelegramUser(allowedUsers, ctx.from?.username)) {
      await ctx.reply("You don't have access to this bot.");
      return;
    }

    if (options.nodeEnv === NodeEnv.Development) {
      console.log(ctx.message.text);
    }

    const ack = await options.assistant.quickAck(ctx.message.text);
    await ctx.reply(ack, { parse_mode: "HTML" });

    const reply = await options.assistant.chat(ctx.message.text);
    await ctx.reply(reply, { parse_mode: "HTML" });
  });

  return bot;
}

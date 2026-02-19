import { Telegraf } from "telegraf";

import prisma from "../config/db";
import { NodeEnv } from "../config/env";
import type { DaniAssistant } from "../services/dani-assistant";
import { replyHtmlChunked } from "./reply-html";

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

export function createBot(options: CreateBotOptions): Telegraf {
  const allowedUsers = parseAllowedUsers(options.allowedUsersRaw);
  const bot = new Telegraf(options.token);

  bot.on("text", async (ctx) => {
    const username = ctx.from?.username?.toLowerCase();
    if (!username || !allowedUsers.has(username)) {
      await ctx.reply("You don't have access to this bot.");
      return;
    }

    if (options.nodeEnv === NodeEnv.Development) {
      console.log(ctx.message.text);
    }

    const ack = await options.assistant.quickAck(ctx.message.text);
    await replyHtmlChunked(ctx, ack);

    const { text: reply, responseId } = await options.assistant.chat(
      ctx.message.text,
      username,
    );
    await replyHtmlChunked(ctx, reply);

    await prisma.user.upsert({
      where: { telegramHandle: username },
      update: { lastOpenaiResponseId: responseId },
      create: { telegramHandle: username, lastOpenaiResponseId: responseId },
    });
  });

  return bot;
}

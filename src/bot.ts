import { Telegraf } from "telegraf";

import { chat } from "./openai";

export const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

bot.on("text", async (ctx) => {
  console.log(ctx.message.text);
  const reply = await chat(ctx.message.text);
  await ctx.reply(reply);
});

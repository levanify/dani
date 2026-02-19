import OpenAI from "openai";

import prisma from "../config/db";
import { NodeEnv } from "../config/env";
import { TELEGRAM_ACK_PROMPT, TELEGRAM_SYSTEM_PROMPT } from "./prompts";

export type ChatResponse = {
  text: string;
  responseId: string;
};

export type DaniAssistant = {
  quickAck(userMessage: string): Promise<string>;
  chat(userMessage: string, telegramHandle: string): Promise<ChatResponse>;
};

function createClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable.");
  }

  return new OpenAI({ apiKey });
}

export function createDaniAssistant(
  client: OpenAI = createClient(),
): DaniAssistant {
  return {
    async quickAck(userMessage: string): Promise<string> {
      const response = await client.responses.create({
        model: "gpt-4.1-mini",
        instructions: TELEGRAM_ACK_PROMPT,
        input: userMessage,
      });

      return response.output_text;
    },

    async chat(
      userMessage: string,
      telegramHandle: string,
    ): Promise<ChatResponse> {
      const user = await prisma.user.findUnique({
        where: { telegramHandle },
      });

      const response = await client.responses.create({
        model: "gpt-5.2-chat-latest",
        tools: [{ type: "web_search" }],
        instructions: TELEGRAM_SYSTEM_PROMPT,
        input: userMessage,
        ...(user?.lastOpenaiResponseId && {
          previous_response_id: user.lastOpenaiResponseId,
        }),
        context_management: [
          {
            type: "compaction",
            compact_threshold: 120000,
          },
        ],
      });

      if (process.env.NODE_ENV === NodeEnv.Development) {
        console.log(JSON.stringify(response, null, 2));
      }

      return { text: response.output_text, responseId: response.id };
    },
  };
}

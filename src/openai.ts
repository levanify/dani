import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function chat(userMessage: string): Promise<string> {
  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: userMessage,
  });

  if (response.output_text) {
    return response.output_text;
  }

  for (const item of response.output) {
    if (item.type !== "message") {
      continue;
    }

    for (const content of item.content) {
      if (content.type === "output_text") {
        return content.text;
      }
    }
  }

  return "";
}

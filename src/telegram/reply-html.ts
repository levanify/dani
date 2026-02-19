import { Context } from "telegraf";
import sanitizeHtml from "sanitize-html";

const TELEGRAM_MAX_TEXT_LENGTH = 4096;
const TELEGRAM_SAFE_CHUNK_LENGTH = 3900;
const CHUNK_SPLIT_PATTERNS = [
  /.*?(?:\n\n|$)/gs,
  /.*?(?:\n|$)/gs,
  /.*?(?:[.!?](?:\s+|$)|$)/gs,
  /.*?(?:\s+|$)/gs,
] as const;
const TELEGRAM_ALLOWED_TAGS = ["b", "i", "u", "s", "a", "code", "pre"];
const MARKDOWN_LINK_PATTERN = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;

function markdownLinksToAnchors(input: string): string {
  return input.replace(
    MARKDOWN_LINK_PATTERN,
    (_match, text: string, href: string) => `<a href="${href.trim()}">${text}</a>`,
  );
}

function splitChunkByPattern(text: string, pattern: RegExp): string[] {
  const matches = text.match(pattern) ?? [];
  const units = matches.filter((unit) => unit.length > 0);
  if (units.length <= 1) {
    return [text];
  }

  const chunks: string[] = [];
  let current = "";
  for (const unit of units) {
    if (!current || (current + unit).length <= TELEGRAM_SAFE_CHUNK_LENGTH) {
      current += unit;
      continue;
    }

    chunks.push(current);
    current = unit;
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

function splitForTelegramHtml(text: string): string[] {
  if (text.length <= TELEGRAM_MAX_TEXT_LENGTH) {
    return [text];
  }

  let chunks = [text];
  for (const pattern of CHUNK_SPLIT_PATTERNS) {
    chunks = chunks.flatMap((chunk) => {
      if (chunk.length <= TELEGRAM_SAFE_CHUNK_LENGTH) {
        return [chunk];
      }
      return splitChunkByPattern(chunk, pattern);
    });
  }

  return chunks.flatMap((chunk) => {
    if (chunk.length <= TELEGRAM_SAFE_CHUNK_LENGTH) {
      return [chunk];
    }

    const hardChunks: string[] = [];
    for (let index = 0; index < chunk.length; index += TELEGRAM_SAFE_CHUNK_LENGTH) {
      hardChunks.push(chunk.slice(index, index + TELEGRAM_SAFE_CHUNK_LENGTH));
    }
    return hardChunks;
  });
}

export function sanitizeTelegramHtml(input: string): string {
  // Convert markdown links first, then normalize unsupported HTML tags.
  const normalized = markdownLinksToAnchors(input)
    .replace(/<\s*hr\s*\/?\s*>/gi, "\n\n")
    .replace(/<\s*br\s*\/?\s*>/gi, "\n");

  const sanitized = sanitizeHtml(normalized, {
    allowedTags: TELEGRAM_ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href"],
    },
    allowedSchemes: ["http", "https", "tg", "mailto"],
    allowProtocolRelative: false,
    parser: { lowerCaseTags: true },
    // Keep text content for stripped tags and only remove the tag itself.
    disallowedTagsMode: "discard",
  });

  // Telegram expects href on <a>; unwrap anchors that lost href during sanitization.
  return sanitized.replace(/<a>([\s\S]*?)<\/a>/g, "$1");
}

export async function replyHtmlChunked(
  ctx: Context,
  text: string,
): Promise<void> {
  const safeText = sanitizeTelegramHtml(text);
  for (const chunk of splitForTelegramHtml(safeText)) {
    try {
      await ctx.reply(chunk, { parse_mode: "HTML" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await ctx.reply(message);
    }
  }
}

import { describe, expect, it } from "vitest";

import { sanitizeTelegramHtml } from "../reply-html";

describe("sanitizeTelegramHtml", () => {
  it("replaces unsupported hr/br tags with text line breaks", () => {
    const result = sanitizeTelegramHtml("A<hr>B<br>C");

    expect(result).toContain("A");
    expect(result).toContain("A\n\nB");
    expect(result).toContain("B\nC");
    expect(result).not.toContain("<hr>");
    expect(result).not.toContain("<br>");
  });

  it("keeps Telegram-supported tags and strips unsupported tags", () => {
    const result = sanitizeTelegramHtml("<b>ok</b><p>text</p><ul><li>x</li></ul>");

    expect(result).toContain("<b>ok</b>");
    expect(result).toContain("text");
    expect(result).toContain("x");
    expect(result).not.toContain("<p>");
    expect(result).not.toContain("<ul>");
    expect(result).not.toContain("<li>");
  });

  it("keeps safe links and strips unsafe href protocols", () => {
    const safe = sanitizeTelegramHtml('<a href="https://example.com">ok</a>');
    const unsafe = sanitizeTelegramHtml('<a href="javascript:alert(1)">bad</a>');

    expect(safe).toContain('<a href="https://example.com">ok</a>');
    expect(unsafe).toBe("bad");
  });

  it("converts markdown links to html anchors", () => {
    const result = sanitizeTelegramHtml("Visit [OpenAI](https://openai.com) now.");

    expect(result).toContain('Visit <a href="https://openai.com">OpenAI</a> now.');
  });

  it("converts markdown links but strips unsafe protocols", () => {
    const result = sanitizeTelegramHtml("Run [this](javascript:alert(1))");

    expect(result).toContain("Run this");
    expect(result).not.toContain("<a");
  });
});

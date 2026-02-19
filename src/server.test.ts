import { describe, expect, it, vi } from "vitest";

import { healthHandler, notFoundHandler, rootHandler } from "./server";

type MockResponse = {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
};

function createMockResponse(): MockResponse {
  const response = {} as MockResponse;
  response.status = vi.fn().mockReturnValue(response);
  response.json = vi.fn().mockReturnValue(response);
  return response;
}

describe("dani-api handlers", () => {
  it("GET /health returns ok", () => {
    const res = createMockResponse();

    healthHandler({} as never, res as never);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: "ok" });
  });

  it("GET / returns service metadata", () => {
    const res = createMockResponse();

    rootHandler({} as never, res as never);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      service: "dani-api",
      version: expect.any(String)
    });
  });

  it("unknown routes return JSON 404", () => {
    const res = createMockResponse();

    notFoundHandler({} as never, res as never);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Not Found" });
  });
});

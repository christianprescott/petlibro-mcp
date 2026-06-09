import { describe, it, before, after, afterEach, mock } from "node:test";
import assert from "node:assert/strict";

import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types";

import { getServer } from "../server.js";
import { setCachedToken, clearDb } from "../db/index.js";

process.env.PETLIBRO_USER = "test@domain.invalid";
process.env.PETLIBRO_PASS_MD5 = "password";

const mockServer = setupServer();

describe("get_feeding_plans", () => {
  let client: Client;

  before(async () => {
    mockServer.listen({ onUnhandledRequest: "error" });

    const mcpServer = getServer();
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    client = new Client({ name: "test-client", version: "1.0.0" });
    await mcpServer.connect(serverTransport);
    await client.connect(clientTransport);
  });

  afterEach(() => {
    clearDb();
    mockServer.resetHandlers();
  });

  after(async () => {
    await client.close();
    mockServer.close();
  });

  const setupHandlers = () => {
    const loginHandler = mock.fn(() =>
      HttpResponse.json({
        code: 0,
        msg: null,
        data: { token: "token" },
      }),
    );
    const devicesHandler = mock.fn(() =>
      HttpResponse.json({
        code: 0,
        msg: null,
        data: [{ deviceSn: "serial" }],
      }),
    );
    const plansHandler = mock.fn(() =>
      HttpResponse.json({ code: 0, msg: null, data: [] }),
    );
    mockServer.use(
      http.post("*/member/auth/login", loginHandler),
      http.post("*/device/device/list", devicesHandler),
      http.post("*/device/feedingPlan/list", plansHandler),
    );
    return { loginHandler, devicesHandler, plansHandler };
  };

  it("calls auth, devices, and plans endpoints", async () => {
    const { loginHandler, devicesHandler, plansHandler } = setupHandlers();

    await client.callTool({ name: "get_feeding_plans" });

    assert.equal(loginHandler.mock.callCount(), 1, "should call auth endpoint");
    assert.equal(
      devicesHandler.mock.callCount(),
      1,
      "should call devices endpoint",
    );
    assert.equal(
      plansHandler.mock.callCount(),
      1,
      "should call plans endpoint",
    );
  });

  it("caches auth token", async () => {
    setCachedToken("test@domain.invalid", "token");
    const { loginHandler, devicesHandler, plansHandler } = setupHandlers();

    await client.callTool({ name: "get_feeding_plans" });

    assert.equal(
      loginHandler.mock.callCount(),
      0,
      "should not call auth endpoint",
    );
    assert.equal(
      devicesHandler.mock.callCount(),
      1,
      "should call devices endpoint",
    );
    assert.equal(
      plansHandler.mock.callCount(),
      1,
      "should call plans endpoint",
    );
  });

  it("calls auth when token is expired", async () => {
    setCachedToken("test@domain.invalid", "oldtoken");
    const { loginHandler, plansHandler } = setupHandlers();
    const devicesHandler = mock.fn(({ request }) => {
      const expired = request.headers.get("token") === "oldtoken";
      return HttpResponse.json(
        expired
          ? { code: 1009, msg: "NOT_YET_LOGIN", data: [] }
          : { code: 0, msg: null, data: [{ deviceSn: "serial" }] },
      );
    });
    mockServer.use(http.post("*/device/device/list", devicesHandler));

    await client.callTool({ name: "get_feeding_plans" });

    // devices is called twice - once with expired token, once with refreshed token
    assert.equal(devicesHandler.mock.callCount(), 2);
    // login is called once - after the first devices call fails
    assert.equal(loginHandler.mock.callCount(), 1);
    assert.equal(plansHandler.mock.callCount(), 1);
  });

  it("fails when no devices are present", async () => {
    setupHandlers();
    mockServer.use(
      http.post("*/device/device/list", () =>
        HttpResponse.json({
          code: 0,
          msg: null,
          data: [],
        }),
      ),
    );

    const result = (await client.callTool({
      name: "get_feeding_plans",
    })) as CallToolResult;
    assert.partialDeepStrictEqual(result, {
      isError: true,
      content: [{ text: "No feeder devices found." }],
    });
  });
});

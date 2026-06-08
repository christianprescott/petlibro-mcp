import * as petlibro from "petlibro-client";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import express, { Request, Response } from "express";
import morgan from "morgan";

import tools from "./tools/index.js";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const getServer = (): McpServer => {
  const server = new McpServer({
    name: "petlibro",
    version: "1.0.0",
    description:
      "Tools for interacting with an automated food dispenser. You control a machine that can give treats to pets, usually cats or dogs.",
  });

  tools.forEach((t) => {
    server.registerTool(t.name, t.config, t.cb);
  });

  return server;
};

const app = express();
app.use(morgan("common"));
app.use(express.json());

app.post("/mcp", async (req: Request, res: Response) => {
  const server = getServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
  res.on("close", () => {
    transport.close();
    server.close();
  });
});

app.listen(PORT, () => {
  console.error(`MCP server listening on port ${PORT}`);
});

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { Request, Response } from "express";
import morgan from "morgan";

import { getServer } from "./server.js";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

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

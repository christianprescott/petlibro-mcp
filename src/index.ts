import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import express, { Request, Response, NextFunction } from "express";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const getServer = (): McpServer => {
  const server = new McpServer({
    name: "weather",
    version: "1.0.0",
  });

  async function makeWeatherRequest(state: string): Promise<string> {
    return Promise.resolve("Things are sunny in " + state);
  }

  server.registerTool(
    "get_alerts",
    {
      description: "Get weather alerts for a state",
      inputSchema: {
        state: z.string().describe("Two-letter state code (e.g. CA, NY)"),
      },
    },
    async ({ state }) => {
      const alerts = await makeWeatherRequest(state);
      return {
        content: [{ type: "text", text: alerts }],
      };
    },
  );

  return server;
};

const app = express();
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

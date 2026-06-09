import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import tools from "./tools/index.js";

export function getServer(): McpServer {
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
}

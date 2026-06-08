import type { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";

export type ToolDefinition = {
  name: string;
  config: {
    title?: string;
    description?: string;
    annotations?: ToolAnnotations;
    _meta?: Record<string, unknown>;
  };
  cb: ToolCallback;
};

import * as petlibro from "petlibro-client";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import express, { Request, Response } from "express";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const getServer = (): McpServer => {
  const server = new McpServer({
    name: "petlibro",
    version: "1.0.0",
    description:
      "Tools for interacting with an automated food dispenser. You control a machine that can give treats to humans or animals.",
  });

  function assertSuccess(response: petlibro.Response) {
    if (response.code != 0) throw new Error(response.msg);
    return response;
  }

  async function getAuthToken(): Promise<string> {
    const configurationParameters = {
      baseServer: petlibro.servers[0],
      authMethods: {
        Source: "ANDROID",
        Language: "EN",
        Version: "1.3.45",
        Timezone: "America/Chicago",
      },
    };
    const authApi = new petlibro.AuthApi(
      petlibro.createConfiguration(configurationParameters),
    );
    const loginResponse = await authApi.login({
      email: "johnanderson@mailinator.com",
      password: process.env.MD5_PASS || "",
      appId: 1,
      appSn: petlibro.LoginRequestAppSnEnum.C35772530d1041699c87fe62348507a8,
      country: "US",
      phoneBrand: "",
      phoneSystemVersion: "",
      timezone: "America/Chicago",
    });
    assertSuccess(loginResponse);
    return loginResponse.data.token;
  }

  async function getRecentActivity(): Promise<string> {
    const devicesApi = new petlibro.DevicesApi(
      petlibro.createConfiguration({
        baseServer: petlibro.servers[0],
        authMethods: {
          TokenAuth: await getAuthToken(),
          Source: "ANDROID",
          Language: "EN",
          Version: "1.3.45",
          Timezone: "America/Chicago",
        },
      }),
    );
    const devicesResponse = await devicesApi.listDevices();
    assertSuccess(devicesResponse);
    const [device] = devicesResponse.data;
    if (!device) {
      throw new Error("No feeder devices found.");
    }
    const workRecordsResponse = await devicesApi.listWorkRecords({
      deviceSn: device.deviceSn,
      startTime: Date.now() - 7 * 24 * 60 * 60 * 1000,
      endTime: Date.now(),
      size: 25,
    });
    assertSuccess(workRecordsResponse);
    const workRecords = workRecordsResponse.data
      .map((d) => d.workRecords)
      .flat()
      .filter((r) => r.type === "GRAIN_OUTPUT_SUCCESS");
    return workRecords;
  }

  async function makeFeedRequest(): Promise<string> {
    const devicesApi = new petlibro.DevicesApi(
      petlibro.createConfiguration({
        baseServer: petlibro.servers[0],
        authMethods: {
          TokenAuth: await getAuthToken(),
          Source: "ANDROID",
          Language: "EN",
          Version: "1.3.45",
          Timezone: "America/Chicago",
        },
      }),
    );
    const devicesResponse = await devicesApi.listDevices();
    assertSuccess(devicesResponse);
    const [device] = devicesResponse.data;
    if (!device) {
      throw new Error("No feeder devices found.");
    }
    const feedResponse = await devicesApi.manualFeed({
      deviceSn: device.deviceSn,
      grainNum: 1,
      requestId: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
    });
    assertSuccess(feedResponse);
    return "1 serving is being dispensed at your request.";
  }

  server.registerTool(
    "dispense_food",
    {
      description:
        "Dispense food from the feeder. One serving will be put into the bowl. Use this tool sparingly - too many servings can overfill the bowl or spoil the recipient's appetite.",
    },
    async () => {
      const alerts = await makeFeedRequest();
      return {
        content: [{ type: "text", text: alerts }],
      };
    },
  );

  server.registerTool(
    "check_food_history",
    {
      description:
        "Get a list of recent feeding events, ordered from most to least recent. This can tell you when the most recent feeding occurred to avoid giving too many servings.",
    },
    async () => {
      const activities = await getRecentActivity();
      const table = `
| Date and Time | Servings | Detail |
|---|---|---|
${activities
  .map((a) => `| ${a.formatRecordTime} | ${a.actualGrainNum} | ${a.content} |`)
  .join("\n")}
`;
      return {
        content: [{ type: "text", text: table }],
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

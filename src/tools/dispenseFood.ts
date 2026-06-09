import * as petlibro from "petlibro-client";
import { assertSuccess, createApiConfiguration } from "./helpers.js";
import type { ToolDefinition } from "./types.js";

async function makeFeedRequest(): Promise<string> {
  const devicesApi = new petlibro.DevicesApi(await createApiConfiguration());
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

const dispenseFood: ToolDefinition = {
  name: "dispense_food",
  config: {
    description:
      "Dispense food from the feeder. One serving will be put into the bowl. Use this tool sparingly - too many servings can overfill the bowl or spoil the recipient's appetite.",
  },
  cb: async () => {
    const alerts = await makeFeedRequest();
    return {
      content: [{ type: "text", text: alerts }],
    };
  },
};

export default dispenseFood;

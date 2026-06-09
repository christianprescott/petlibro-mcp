import * as petlibro from "petlibro-client";
import { ToolDefinition } from "./types.js";
import { assertSuccess, createApiConfiguration } from "./helpers.js";

async function getRecentActivity(): Promise<
  petlibro.ListWorkRecords200ResponseAllOfDataInnerWorkRecordsInner[]
> {
  const devicesApi = new petlibro.DevicesApi(await createApiConfiguration());
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
  return workRecordsResponse.data
    .map((d) => d.workRecords)
    .flat()
    .filter(
      (
        r,
      ): r is petlibro.ListWorkRecords200ResponseAllOfDataInnerWorkRecordsInner =>
        r !== undefined && r.type === "GRAIN_OUTPUT_SUCCESS",
    );
}

const getFeedingHistory: ToolDefinition = {
  name: "get_feeding_history",
  config: {
    description: `Get a list of feeding events that have happened in the past, ordered from most to least recent.
        This can tell you when the most recent feeding occurred to answer questions about when pets were last fed and
        to avoid giving too many servings.
        Returns a JSON object with:
        - count: number of feedings
        - feedings: array of { timestamp, servings, detail }`,
  },
  cb: async () => {
    const activities = await getRecentActivity();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            count: activities.length,
            feedings: activities.map((a) => ({
              timestamp: a.formatRecordTime,
              servings: a.actualGrainNum,
              detail: a.content,
            })),
          }),
        },
      ],
    };
  },
};

export default getFeedingHistory;

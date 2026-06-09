import * as petlibro from "petlibro-client";
import { assertSuccess, withApiConfig } from "./helpers.js";
import type { ToolDefinition } from "./types.js";

function indexToDays(repeatDay: string): string[] {
  const days = JSON.parse(repeatDay);
  return days
    .map((index: number) => {
      return {
        1: "Monday",
        2: "Tuesday",
        3: "Wednesday",
        4: "Thursday",
        5: "Friday",
        6: "Saturday",
        7: "Sunday",
      }[index];
    })
    .filter((day: string | undefined) => day !== undefined);
}

async function getPlans(): Promise<
  petlibro.ListFeedingPlans200ResponseAllOfDataInner[]
> {
  return withApiConfig(async (config) => {
    const devicesApi = new petlibro.DevicesApi(config);
    const devicesResponse = await devicesApi.listDevices();
    assertSuccess(devicesResponse);
    const [device] = devicesResponse.data;
    if (!device) {
      throw new Error("No feeder devices found.");
    }

    const plansApi = new petlibro.FeedingPlansApi(config);
    const plansResponse = await plansApi.listFeedingPlans({
      id: device.deviceSn,
      deviceSn: device.deviceSn,
    });
    assertSuccess(plansResponse);
    return plansResponse.data;
  });
}

const getFeedingPlans: ToolDefinition = {
  name: "get_feeding_plans",
  config: {
    description: `Get current list of configured feeding plans.
    Each plan describes a time of day when food will be automatically dispensed.
    These plans are scheduled to happen in the future. Pets will receive food at the planned time.
    Returns a JSON object with:
    - count: number of plans
    - plans: array of { time, repeatsOn, label, servings }
      - time: time of day when food is dispensed
      - repeatsOn: days of the week when the feeding will be repeated at the same time each day. If this is empty, the plan does not repeat and will dispense only one time.
      - label: optional label. May be useful to infer this feeding's purpose, but may be absent.
      - servings: number of servings dispensed`,
  },
  cb: async () => {
    const plans = await getPlans();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            count: plans.filter((p) => p.enable !== false).length,
            plans: plans
              .filter((p) => p.enable !== false)
              .map(({ executionTime, repeatDay, label, grainNum }) => ({
                time: executionTime,
                repeatsOn:
                  repeatDay === undefined ? [] : indexToDays(repeatDay),
                label,
                servings: grainNum,
              })),
          }),
        },
      ],
    };
  },
};

export default getFeedingPlans;

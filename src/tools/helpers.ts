import * as petlibro from "petlibro-client";

export function assertSuccess(response: petlibro.Response) {
  if (response.code != 0) throw new Error(response.msg);
  return response;
}

export async function getAuthToken(): Promise<string> {
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
  if (!process.env.PETLIBRO_USER || !process.env.PETLIBRO_PASS_MD5) {
    throw new Error(
      "No Petlibro password is set. Owner must authenticate to use this tool.",
    );
  }
  const loginResponse = await authApi.login({
    email: process.env.PETLIBRO_USER,
    password: process.env.PETLIBRO_PASS_MD5,
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

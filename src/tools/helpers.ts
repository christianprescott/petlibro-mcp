import * as petlibro from "petlibro-client";
import { getCachedToken, setCachedToken } from "../db/index.js";

export class TokenExpiredError extends Error {}

export function assertSuccess(response: petlibro.Response) {
  if (response.code === 1009)
    throw new TokenExpiredError(response.msg ?? undefined);
  if (response.code != 0) throw new Error(response.msg ?? undefined);
  return response;
}

// Curry API config to the wrapped function. If a TokenExpiredError is raised,
// re-authenticate with a fresh token and call again.
export async function withApiConfig<T>(
  fn: (config: petlibro.Configuration) => Promise<T>,
): Promise<T> {
  try {
    return await fn(await createApiConfiguration());
  } catch (e) {
    if (e instanceof TokenExpiredError) {
      await login();
      return fn(await createApiConfiguration());
    }
    throw e;
  }
}

const HEADERS = {
  Source: "ANDROID",
  Language: "EN",
  Version: "1.3.45",
  Timezone: "America/Chicago",
};

async function createApiConfiguration(): Promise<petlibro.Configuration> {
  return petlibro.createConfiguration({
    baseServer: petlibro.servers[0],
    authMethods: {
      ...HEADERS,
      TokenAuth: await getAuthToken(),
    },
  });
}

async function getAuthToken(): Promise<string> {
  const cached = getCachedToken(process.env.PETLIBRO_USER);
  if (cached) return cached;
  return login();
}

async function login() {
  if (!process.env.PETLIBRO_USER || !process.env.PETLIBRO_PASS_MD5) {
    throw new Error(
      "No Petlibro password is set. Owner must authenticate to use this tool.",
    );
  }

  const authApi = new petlibro.AuthApi(
    petlibro.createConfiguration({
      baseServer: petlibro.servers[0],
      authMethods: HEADERS,
    }),
  );
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
  setCachedToken(process.env.PETLIBRO_USER, loginResponse.data.token);
  return loginResponse.data.token;
}

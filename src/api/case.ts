import { req } from "./req";

export async function push(branch: string, tests: any, options?: { host: string; token: string }) {
  const { host, token } = options ?? {};
  await req(`/api/sync?branch=${branch}`, {
    method: "POST",
    body: {
      tests,
    },
    host,
    token,
  });
}

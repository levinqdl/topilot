import { req } from "./req";

export async function push(branch: string, tests: any, { host, token }: { host: string; token: string }) {
  await req(`/api/sync?branch=${branch}`, {
    method: "POST",
    body: {
      tests,
    },
    host,
    token,
  });
}

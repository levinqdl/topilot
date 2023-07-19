import req from "./req";

export async function push(branch: string, body: any, options?: { host: string; token: string }) {
  const { host, token } = options ?? {};
  await req(`/api/sync?branch=${branch}`, {
    method: "POST",
    body,
    host,
    token,
  });
}

export async function pull(branch: string) {
  const resp = await req(`/api/sync?branch=${branch}`)
  const {tests} = await resp.json()
  return tests
}

import { req } from "./req";

interface Options {
  host?: string;
  token?: string;
  env?: "development" | "preview";
}
export async function push<T extends Record<string, unknown>>(
  params: T,
  { env = process.env.CI ? "preview" : "development", ...options }: Options = {}
) {
  const query = new URLSearchParams({ env: env }).toString();
  const resp = await req(`/api/states?${query}`, {
    ...options,
    method: "POST",
    body: params,
  });
  if (!resp.ok) {
    try {
      const { message } = await resp.json();
      throw new Error(message);
    } catch (e) {
      throw new Error(
        `Error committing state: ${resp.status} ` + resp.statusText
      );
    }
  }
}

export async function pull({env=process.env.CI? "preview": "development", ...options}: Options = {}) {
  const query = new URLSearchParams({ env: env }).toString();
  const resp = await req(`/api/states?${query}`, { method: "GET", ...options });
  if (!resp.ok) {
    throw new Error(`Error pulling state: ${resp.status} ` + resp.statusText);
  }
  return await resp.json();
}
